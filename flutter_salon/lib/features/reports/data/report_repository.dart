import 'package:dio/dio.dart';

class ReportRepository {
  final Dio _dio;

  ReportRepository({Dio? dio}) : _dio = dio!;

  Future<Map<String, dynamic>> getSalesReport(
    String startDate,
    String endDate,
  ) async {
    try {
      final response = await _dio.get(
        '/reports/sales',
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load sales report: $e');
    }
  }

  Future<dynamic> getServiceReport(String startDate, String endDate) async {
    try {
      final response = await _dio.get(
        '/reports/services',
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load service report: $e');
    }
  }

  Future<dynamic> getStaffReport(String startDate, String endDate) async {
    try {
      final response = await _dio.get(
        '/reports/staff',
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load staff report: $e');
    }
  }

  Future<Map<String, dynamic>> getCustomerReport(
    String startDate,
    String endDate,
  ) async {
    try {
      final response = await _dio.get(
        '/reports/customers',
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load customer report: $e');
    }
  }

  Future<Map<String, dynamic>> getExpenseReport(
    String startDate,
    String endDate,
  ) async {
    try {
      final response = await _dio.get(
        '/reports/expenses',
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load expense report: $e');
    }
  }

  Future<Map<String, dynamic>> getGstReport(
    String startDate,
    String endDate,
  ) async {
    try {
      final response = await _dio.get(
        '/reports/gst',
        queryParameters: {'start_date': startDate, 'end_date': endDate},
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load gst report: $e');
    }
  }
}
