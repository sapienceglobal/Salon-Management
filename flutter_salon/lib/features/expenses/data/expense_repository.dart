import 'package:dio/dio.dart';
import 'dart:io';

class ExpenseRepository {
  final Dio _dio;

  ExpenseRepository({Dio? dio}) : _dio = dio!;

  Future<dynamic> getExpenses({String? startDate, String? endDate}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;

      final response = await _dio.get(
        '/expenses',
        queryParameters: queryParams,
      );
      // Return the whole response so we can extract meta.summary in the provider if needed
      return response.data;
    } catch (e) {
      throw Exception('Failed to load expenses: $e');
    }
  }

  Future<List<dynamic>> getExpenseCategories() async {
    try {
      final response = await _dio.get('/expenses/categories');
      return response.data['data'] ?? response.data ?? [];
    } catch (e) {
      throw Exception('Failed to load expense categories: $e');
    }
  }

  Future<Map<String, dynamic>> createExpense(Map<String, dynamic> data) async {
    try {
      final response = await _dio.post('/expenses', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to create expense: $e');
    }
  }

  Future<Map<String, dynamic>> updateExpense(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.put('/expenses/$id', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to update expense: $e');
    }
  }

  Future<void> deleteExpense(int id) async {
    try {
      await _dio.delete('/expenses/$id');
    } catch (e) {
      throw Exception('Failed to delete expense: $e');
    }
  }

  // ── Get Single Expense ───────────────────────────────────────
  Future<Map<String, dynamic>> getExpenseById(int id) async {
    try {
      final response = await _dio.get('/expenses/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to load expense details: $e');
    }
  }

  // ── Create Expense Category ──────────────────────────────────
  Future<Map<String, dynamic>> createExpenseCategory(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.post('/expenses/categories', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to create expense category: $e');
    }
  }

  // ── Upload Receipt ───────────────────────────────────────────
  Future<Map<String, dynamic>> uploadReceipt(String filePath) async {
    try {
      final file = File(filePath);
      final formData = FormData.fromMap({
        'receipt': await MultipartFile.fromFile(
          file.path,
          filename: file.path.split('/').last,
        ),
      });
      final response = await _dio.post('/expenses/upload', data: formData);
      return response.data['data'] ?? response.data;
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to upload receipt: $e');
    }
  }
}

