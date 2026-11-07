import 'package:dio/dio.dart';

class CustomerRepository {
  final Dio _dio;

  CustomerRepository({Dio? dio}) : _dio = dio!;

  Future<List<dynamic>> getCustomers({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    try {
      final queryParams = {
        'page': page,
        'limit': limit,
        'is_active': 'true',
        if (search != null && search.isNotEmpty) 'search': search,
      };

      final response = await _dio.get(
        '/customers',
        queryParameters: queryParams,
      );
      final responseData = response.data['data'] ?? response.data;
      if (responseData is List) return responseData;
      return responseData['customers'] ?? responseData;
    } catch (e) {
      throw Exception('Failed to load customers: $e');
    }
  }

  Future<Map<String, dynamic>> getCustomerStats() async {
    try {
      final response = await _dio.get('/customers/stats/metrics');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load customer stats: $e');
    }
  }

  Future<Map<String, dynamic>> getCustomerProfile(int id) async {
    try {
      final response = await _dio.get('/customers/$id/profile');
      final responseData = response.data['data'] ?? response.data;
      return Map<String, dynamic>.from(responseData);
    } catch (e) {
      throw Exception('Failed to load customer profile: $e');
    }
  }

  Future<Map<String, dynamic>> getCustomer(int id) async {
    try {
      final response = await _dio.get('/customers/$id');
      final responseData = response.data['data'] ?? response.data;
      return Map<String, dynamic>.from(responseData);
    } catch (e) {
      throw Exception('Failed to load customer details: $e');
    }
  }

  Future<Map<String, dynamic>> createCustomer(Map<String, dynamic> data) async {
    try {
      final hasFile = data.values.any((v) => v is MultipartFile);
      final requestData = hasFile ? FormData.fromMap(data) : data;
      final response = await _dio.post('/customers', data: requestData);
      return response.data;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final resData = e.response!.data;
        if (resData is Map) {
          if (resData['errors'] != null &&
              resData['errors'] is List &&
              resData['errors'].isNotEmpty) {
            throw Exception(
              resData['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (resData['message'] != null) throw Exception(resData['message']);
        }
      }
      throw Exception('Failed to create customer');
    }
  }

  Future<Map<String, dynamic>> updateCustomer(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final hasFile = data.values.any((v) => v is MultipartFile);
      final requestData = hasFile ? FormData.fromMap(data) : data;
      final response = await _dio.put('/customers/$id', data: requestData);
      return response.data;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
        final resData = e.response!.data;
        if (resData is Map) {
          if (resData['errors'] != null &&
              resData['errors'] is List &&
              resData['errors'].isNotEmpty) {
            throw Exception(
              resData['errors'][0]['message'] ?? 'Validation failed',
            );
          }
          if (resData['message'] != null) throw Exception(resData['message']);
        }
      }
      throw Exception('Failed to update customer');
    }
  }

  Future<void> deleteCustomer(int id) async {
    try {
      await _dio.delete('/customers/$id');
    } catch (e) {
      throw Exception('Failed to delete customer: $e');
    }
  }

  Future<List<dynamic>> getCustomerVisits(int id) async {
    try {
      final response = await _dio.get('/customers/$id/visits');
      final responseData = response.data['data'] ?? response.data;
      if (responseData is List) return responseData;
      return [];
    } catch (e) {
      throw Exception('Failed to load customer visits: $e');
    }
  }

  Future<List<dynamic>> getCustomerAppointments(int id) async {
    try {
      final response = await _dio.get(
        '/appointments',
        queryParameters: {'customer_id': id},
      );
      final responseData = response.data['data'] ?? response.data;
      if (responseData is List) return responseData;
      return responseData['appointments'] ?? [];
    } catch (e) {
      throw Exception('Failed to load customer appointments: $e');
    }
  }

  Future<List<dynamic>> getCustomerWalletHistory(int id) async {
    try {
      final response = await _dio.get('/customers/$id/wallet');
      final responseData = response.data['data'] ?? response.data;
      if (responseData is List) return responseData;
      return [];
    } catch (e) {
      throw Exception('Failed to load wallet history: $e');
    }
  }

  Future<List<dynamic>> getCustomerRewardHistory(int id) async {
    try {
      final response = await _dio.get('/customers/$id/rewards');
      final responseData = response.data['data'] ?? response.data;
      if (responseData is List) return responseData;
      return [];
    } catch (e) {
      throw Exception('Failed to load reward history: $e');
    }
  }
}
