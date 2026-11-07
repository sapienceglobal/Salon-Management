import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  return AttendanceRepository(dio: ref.watch(dioProvider));
});

class AttendanceRepository {
  final Dio dio;

  AttendanceRepository({required this.dio});

  Future<List<dynamic>> getAttendance({
    int? staffMemberId,
    String? date,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (staffMemberId != null) queryParams['staff_member_id'] = staffMemberId;
      if (date != null) queryParams['date'] = date;

      final response = await dio.get(
        '/staff/attendance',
        queryParameters: queryParams,
      );
      if (response.data['success'] == true) {
        return response.data['data'] as List<dynamic>;
      } else {
        throw Exception(
          response.data['message'] ?? 'Failed to fetch attendance',
        );
      }
    } catch (e) {
      throw Exception('Failed to fetch attendance: $e');
    }
  }

  Future<void> markAttendance({
    required int staffMemberId,
    required String date,
    required String status,
    String? checkInTime,
    String? checkOutTime,
    String? notes,
  }) async {
    try {
      final data = {
        'staff_member_id': staffMemberId,
        'date': date,
        'status': status,
      };
      if (checkInTime != null && checkInTime.isNotEmpty)
        data['check_in_time'] = checkInTime;
      if (checkOutTime != null && checkOutTime.isNotEmpty)
        data['check_out_time'] = checkOutTime;
      if (notes != null && notes.isNotEmpty) data['notes'] = notes;

      final response = await dio.post('/staff/attendance', data: data);
      if (response.data['success'] != true) {
        throw Exception(
          response.data['message'] ?? 'Failed to mark attendance',
        );
      }
    } catch (e) {
      throw Exception('Failed to mark attendance: $e');
    }
  }
}
