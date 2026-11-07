import 'package:dio/dio.dart';

class AppointmentRepository {
  final Dio _dio;

  AppointmentRepository({Dio? dio}) : _dio = dio!;

  Future<List<dynamic>> getAppointments({
    String? date,
    String? startDate,
    String? endDate,
    int? staffId,
    int? limit,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (date != null) queryParams['date'] = date;
      if (startDate != null) queryParams['start_date'] = startDate;
      if (endDate != null) queryParams['end_date'] = endDate;
      if (staffId != null) queryParams['staff_id'] = staffId;
      if (limit != null) queryParams['limit'] = limit;

      final response = await _dio.get(
        '/appointments',
        queryParameters: queryParams,
      );
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load appointments: $e');
    }
  }

  Future<Map<String, dynamic>> getAppointmentById(int id) async {
    try {
      final response = await _dio.get('/appointments/$id');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load appointment details: $e');
    }
  }

  Future<Map<String, dynamic>> getAppointmentStats(String date) async {
    try {
      final response = await _dio.get('/appointments/stats?date=$date');
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to load appointment stats: $e');
    }
  }

  Future<Map<String, dynamic>> createAppointment(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.post('/appointments', data: data);
      return response.data['data'] ?? response.data;
    } catch (e) {
      throw Exception('Failed to create appointment: $e');
    }
  }

  Future<Map<String, dynamic>> updateAppointmentStatus(
    int id,
    String status,
  ) async {
    try {
      final response = await _dio.patch(
        '/appointments/$id/status',
        data: {'status': status},
      );
      return response.data['data'] ?? response.data;
    } on DioException catch (e) {
      String msg = e.response?.data?['message'] ?? e.message;
      if (e.response?.data?['errors'] != null) {
        final errors = e.response!.data!['errors'] as List;
        if (errors.isNotEmpty) {
          msg = errors.first['message'] ?? msg;
        }
      }
      throw Exception(msg);
    } catch (e) {
      throw Exception('Failed to update status: $e');
    }
  }

  // ── Update Appointment Details ───────────────────────────────
  Future<Map<String, dynamic>> updateAppointment(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _dio.patch('/appointments/$id', data: data);
      return response.data['data'] ?? response.data;
    } on DioException catch (e) {
      String msg = e.response?.data?['message'] ?? e.message;
      if (e.response?.data?['errors'] != null) {
        final errors = e.response!.data!['errors'] as List;
        if (errors.isNotEmpty) {
          msg = errors.first['message'] ?? msg;
        }
      }
      throw Exception(msg);
    } catch (e) {
      throw Exception('Failed to update appointment: $e');
    }
  }

  Future<void> deleteAppointment(int id) async {
    try {
      await _dio.delete('/appointments/$id');
    } catch (e) {
      if (e is DioException) {
        final msg =
            e.response?.data?['message'] ??
            e.response?.data?['error'] ??
            e.message;
        throw Exception(msg);
      }
      throw Exception('Failed to delete appointment: $e');
    }
  }
}
