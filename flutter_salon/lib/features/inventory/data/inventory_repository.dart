import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';

final inventoryRepositoryProvider = Provider<InventoryRepository>((ref) {
  return InventoryRepository(ref.watch(dioProvider));
});

class InventoryRepository {
  final Dio _dio;

  InventoryRepository(this._dio);

  Future<List<dynamic>> getProducts({
    String? search,
    String? category,
    bool? lowStock,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{'limit': 100};

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (category != null && category.isNotEmpty) {
        queryParams['category'] = category;
      }
      if (lowStock == true) {
        queryParams['low_stock'] = 'true';
      }

      final response = await _dio.get(
        '/products',
        queryParameters: queryParams,
      );
      List<dynamic> products = [];
      if (response.data is Map<String, dynamic> &&
          response.data['data'] != null) {
        products = response.data['data'];
      } else if (response.data is List) {
        products = response.data;
      }

      if (status == 'active') {
        products = products.where((p) => p['is_active'] == true).toList();
      } else if (status == 'inactive') {
        products = products.where((p) => p['is_active'] == false).toList();
      }

      return products;
    } catch (e) {
      if (e is DioException) {
        final message =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(message);
      }
      throw Exception('Failed to load products: $e');
    }
  }

  Future<Map<String, dynamic>> createProduct(
    Map<String, dynamic> data, {
    String? imagePath,
  }) async {
    try {
      if (imagePath != null) {
        final formData = FormData.fromMap(data);
        formData.files.add(
          MapEntry(
            'image',
            await MultipartFile.fromFile(
              imagePath,
              filename: imagePath.split('/').last,
            ),
          ),
        );
        final response = await _dio.post('/products', data: formData);
        return response.data['data'];
      } else {
        final response = await _dio.post('/products', data: data);
        return response.data['data'];
      }
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
      throw Exception('Failed to create product');
    }
  }

  Future<Map<String, dynamic>> updateProduct(
    int id,
    Map<String, dynamic> data, {
    String? imagePath,
  }) async {
    try {
      if (imagePath != null) {
        final formData = FormData.fromMap(data);
        formData.files.add(
          MapEntry(
            'image',
            await MultipartFile.fromFile(
              imagePath,
              filename: imagePath.split('/').last,
            ),
          ),
        );
        // Sometimes PUT doesn't work well with FormData in some setups, but we'll try standard PUT.
        final response = await _dio.put('/products/$id', data: formData);
        return response.data['data'];
      } else {
        final response = await _dio.put('/products/$id', data: data);
        return response.data['data'];
      }
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
      throw Exception('Failed to update product');
    }
  }

  Future<Map<String, dynamic>> getProduct(int id) async {
    try {
      final response = await _dio.get('/products/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load product details: $e');
    }
  }

  Future<void> adjustStock(
    int id,
    String type,
    int quantity,
    String reason,
  ) async {
    try {
      await _dio.patch(
        '/products/$id/stock',
        data: {
          'type': type, // 'add' or 'remove'
          'quantity': quantity,
          'reason': reason,
        },
      );
    } catch (e) {
      if (e is DioException) {
        final message =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(message);
      }
      throw Exception('Failed to adjust stock: $e');
    }
  }

  Future<void> deleteProduct(int id) async {
    try {
      await _dio.delete('/products/$id');
    } catch (e) {
      if (e is DioException) {
        final message =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(message);
      }
      throw Exception('Failed to delete product: $e');
    }
  }
}
