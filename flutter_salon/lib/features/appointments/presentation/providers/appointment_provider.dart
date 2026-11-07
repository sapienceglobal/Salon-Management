import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/appointment_repository.dart';
import '../../../../core/network/dio_client.dart';

final appointmentRepositoryProvider = Provider<AppointmentRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return AppointmentRepository(dio: dio);
});

final appointmentsListProvider = FutureProvider.autoDispose
    .family<List<dynamic>, String?>((ref, date) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      return await repository.getAppointments(date: date, limit: 100);
    });

// New provider to fetch appointments for a whole month (or range) to render calendar dots
final monthlyAppointmentsProvider = FutureProvider.autoDispose
    .family<Set<String>, DateTime>((ref, monthDate) async {
      final repository = ref.watch(appointmentRepositoryProvider);

      // Calculate start and end of the month
      final startDate = DateTime(monthDate.year, monthDate.month, 1);
      final endDate = DateTime(
        monthDate.year,
        monthDate.month + 1,
        0,
      ); // Last day of month

      // Convert to strings
      final startStr =
          "${startDate.year}-${startDate.month.toString().padLeft(2, '0')}-01";
      final endStr =
          "${endDate.year}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}";

      final appointments = await repository.getAppointments(
        startDate: startStr,
        endDate: endStr,
        limit: 1000,
      );

      // Extract unique dates that have appointments
      final Set<String> datesWithAppointments = {};
      for (var appt in appointments) {
        if (appt['appointment_date'] != null && appt['status'] != 'cancelled') {
          // The backend returns date like "2023-10-15T00:00:00.000Z"
          final dateOnly = appt['appointment_date'].toString().split('T')[0];
          datesWithAppointments.add(dateOnly);
        }
      }

      return datesWithAppointments;
    });

typedef BookedSlotsQuery = ({String date, int staffId});

final bookedSlotsProvider = FutureProvider.autoDispose
    .family<List<String>, BookedSlotsQuery>((ref, query) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      final appointments = await repository.getAppointments(
        date: query.date,
        staffId: query.staffId,
        limit: 100,
      );

      final List<String> bookedTimes = [];
      for (var appt in appointments) {
        if (appt['status'] != 'cancelled' && appt['start_time'] != null) {
          // Backend returns time like '10:00:00'
          final timeStr = appt['start_time'].toString();
          bookedTimes.add(timeStr);
        }
      }
      return bookedTimes;
    });

final appointmentStatsProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, date) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      return await repository.getAppointmentStats(date);
    });

final appointmentDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, id) async {
      final repository = ref.watch(appointmentRepositoryProvider);
      return await repository.getAppointmentById(id);
    });
