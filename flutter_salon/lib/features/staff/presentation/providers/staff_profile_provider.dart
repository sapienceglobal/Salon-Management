import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/core/network/dio_client.dart';

final staffProfileServicesProvider = FutureProvider.family<List<dynamic>, int>((
  ref,
  staffId,
) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/staff/$staffId/services');
  return response.data['data'] as List<dynamic>;
});

final staffProfileScheduleProvider = FutureProvider.family<List<dynamic>, int>((
  ref,
  staffId,
) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/staff/$staffId/schedule');
  return response.data['data'] as List<dynamic>;
});

final staffProfileLeavesProvider = FutureProvider.family<List<dynamic>, int>((
  ref,
  staffId,
) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/staff/$staffId/leaves');
  return response.data['data'] as List<dynamic>;
});

final staffProfilePerformanceProvider =
    FutureProvider.family<Map<String, dynamic>, ({int staffId, String? startDate, String? endDate})>((ref, arg) async {
      final dio = ref.watch(dioProvider);
      final qp = <String, dynamic>{};
      if (arg.startDate != null) qp['start_date'] = arg.startDate;
      if (arg.endDate != null) qp['end_date'] = arg.endDate;
      final response = await dio.get('/staff/${arg.staffId}/performance', queryParameters: qp);
      return response.data['data'] as Map<String, dynamic>;
    });

final staffProfileAppointmentsProvider = FutureProvider.family<List<dynamic>, int>((
  ref,
  staffId,
) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/appointments', queryParameters: {'staff_member_id': staffId, 'limit': 100});
  final raw = response.data['data'] ?? response.data;
  if (raw is Map && raw['appointments'] != null) {
    return raw['appointments'] as List<dynamic>;
  }
  return raw is List ? raw : [];
});

final staffProfileAttendanceProvider = FutureProvider.family<List<dynamic>, ({int staffId, int? month, int? year})>((
  ref,
  arg,
) async {
  final dio = ref.watch(dioProvider);
  final qp = <String, dynamic>{'staff_member_id': arg.staffId};
  if (arg.month != null) qp['month'] = arg.month;
  if (arg.year != null) qp['year'] = arg.year;
  final response = await dio.get('/staff/attendance', queryParameters: qp);
  return response.data['data'] as List<dynamic>;
});

final staffProfileDocumentsProvider = FutureProvider.family<List<dynamic>, int>((
  ref,
  staffId,
) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/staff/$staffId/documents');
  return response.data['data'] as List<dynamic>;
});
