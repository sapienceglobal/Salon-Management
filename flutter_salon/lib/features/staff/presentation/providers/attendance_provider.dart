import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/staff/data/attendance_repository.dart';

typedef AttendanceQuery = ({int? staffMemberId, String? date});

// Provider to fetch attendance based on query params using a Record for proper equality
final attendanceListProvider = FutureProvider.autoDispose
    .family<List<dynamic>, AttendanceQuery>((ref, query) async {
      final repository = ref.watch(attendanceRepositoryProvider);
      return await repository.getAttendance(
        staffMemberId: query.staffMemberId,
        date: query.date,
      );
    });
