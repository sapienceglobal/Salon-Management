import 'package:dio/dio.dart';

class ServiceRepository {
  final Dio _dio;

  ServiceRepository({Dio? dio}) : _dio = dio!;

  Future<List<dynamic>> getServices() async {
    try {
      final response = await _dio.get('/services');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load services: $e');
    }
  }

  Future<List<dynamic>> getCategories() async {
    try {
      final response = await _dio.get('/services/categories');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load categories: $e');
    }
  }

  Future<Map<String, dynamic>> createService(Map<String, dynamic> data) async {
    try {
      final hasFile = data.values.any(
        (v) =>
            v is MultipartFile ||
            (v is List && v.isNotEmpty && v.first is MultipartFile),
      );
      final requestData = hasFile ? FormData.fromMap(data) : data;
      final response = await _dio.post('/services', data: requestData);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to create service: $e');
    }
  }

  Future<Map<String, dynamic>> updateService(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final hasFile = data.values.any(
        (v) =>
            v is MultipartFile ||
            (v is List && v.isNotEmpty && v.first is MultipartFile),
      );
      final requestData = hasFile ? FormData.fromMap(data) : data;
      final response = await _dio.put('/services/$id', data: requestData);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to update service: $e');
    }
  }

  Future<void> deleteService(int id) async {
    try {
      await _dio.delete('/services/$id');
    } catch (e) {
      throw Exception('Failed to delete service: $e');
    }
  }

  Future<Map<String, dynamic>> createCategory(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/services/categories', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to create category: $e');
    }
  }

  Future<Map<String, dynamic>> updateCategory(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/services/categories/$id', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to update category: $e');
    }
  }

  Future<void> deleteCategory(int id) async {
    try {
      await _dio.delete('/services/categories/$id');
    } catch (e) {
      throw Exception('Failed to delete category: $e');
    }
  }

  // ── Get Single Service ───────────────────────────────────────
  Future<Map<String, dynamic>> getService(int id) async {
    try {
      final response = await _dio.get('/services/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load service details: $e');
    }
  }

  // ── Toggle Service Active ────────────────────────────────────
  Future<Map<String, dynamic>> toggleServiceActive(int id) async {
    try {
      final response = await _dio.patch('/services/$id/toggle-active');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to toggle service status: $e');
    }
  }
}
