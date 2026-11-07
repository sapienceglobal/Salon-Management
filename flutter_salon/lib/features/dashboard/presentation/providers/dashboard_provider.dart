import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/dashboard_repository.dart';

class DashboardDateRangeState {
  final DateTimeRange? range;
  final String label;

  DashboardDateRangeState({this.range, this.label = 'Today'});
}

final dashboardDateRangeProvider = StateProvider<DashboardDateRangeState>(
  (ref) => DashboardDateRangeState(label: 'Today'),
);

final todayAppointmentsProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getTodayAppointments();
});

final topServicesProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getTopServices();
});
final dashboardSummaryProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  final dateRange = ref.watch(dashboardDateRangeProvider).range;

  String? startDate;
  String? endDate;

  if (dateRange != null) {
    startDate =
        "${dateRange.start.year}-${dateRange.start.month.toString().padLeft(2, '0')}-${dateRange.start.day.toString().padLeft(2, '0')}";
    endDate =
        "${dateRange.end.year}-${dateRange.end.month.toString().padLeft(2, '0')}-${dateRange.end.day.toString().padLeft(2, '0')}";
  }

  return repository.getSummary(startDate: startDate, endDate: endDate);
});
