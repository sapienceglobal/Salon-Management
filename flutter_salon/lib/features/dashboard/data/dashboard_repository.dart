import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(dio: ref.watch(dioProvider));
});

class DashboardRepository {
  final Dio dio;

  DashboardRepository({required this.dio});

  Future<Map<String, dynamic>> getSummary({
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (startDate != null) queryParams['startDate'] = startDate;
      if (endDate != null) queryParams['endDate'] = endDate;

      final response = await dio.get(
        '/dashboard/summary',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      return response.data['data'] as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to load dashboard summary');
    }
  }

  Future<List<dynamic>> getTodayAppointments() async {
    try {
      final response = await dio.get('/dashboard/today-appointments');
      return response.data['data'] as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load appointments');
    }
  }

  Future<List<dynamic>> getTopServices() async {
    try {
      final response = await dio.get('/dashboard/top-services');
      return response.data['data'] as List<dynamic>;
    } catch (e) {
      throw Exception('Failed to load services');
    }
  }
}
