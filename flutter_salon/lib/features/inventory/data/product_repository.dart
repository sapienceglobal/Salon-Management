import 'package:dio/dio.dart';

class ProductRepository {
  final Dio _dio;

  ProductRepository({Dio? dio}) : _dio = dio!;

  Future<List<dynamic>> getProducts() async {
    try {
      final response = await _dio.get('/products');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load products: $e');
    }
  }

  Future<List<dynamic>> getLowStockProducts() async {
    try {
      final response = await _dio.get('/products/low-stock');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load low stock products: $e');
    }
  }

  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/products', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to create product: $e');
    }
  }

  Future<Map<String, dynamic>> updateProduct(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/products/$id', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to update product: $e');
    }
  }

  Future<void> updateStock(int id, int stockAdded, String reason) async {
    try {
      await _dio.patch(
        '/products/$id/stock',
        data: {'quantity': stockAdded, 'reason': reason},
      );
    } catch (e) {
      throw Exception('Failed to update stock: $e');
    }
  }

  Future<void> deleteProduct(int id) async {
    try {
      await _dio.delete('/products/$id');
    } catch (e) {
      throw Exception('Failed to delete product: $e');
    }
  }
}
