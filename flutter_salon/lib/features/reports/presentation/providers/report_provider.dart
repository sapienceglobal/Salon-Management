import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/reports/data/report_repository.dart';

final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ReportRepository(dio: dio);
});

class DateRange {
  final String start;
  final String end;
  DateRange(this.start, this.end);
}

final reportDateRangeProvider = StateProvider<DateRange>((ref) {
  final now = DateTime.now();
  final firstDayOfMonth = DateTime(now.year, now.month, 1);
  final lastDayOfMonth = DateTime(now.year, now.month + 1, 0);
  return DateRange(
    firstDayOfMonth.toIso8601String().split('T')[0],
    lastDayOfMonth.toIso8601String().split('T')[0],
  );
});

final salesReportProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repository = ref.watch(reportRepositoryProvider);
  final range = ref.watch(reportDateRangeProvider);
  return await repository.getSalesReport(range.start, range.end);
});

final serviceReportProvider = FutureProvider.autoDispose<dynamic>((ref) async {
  final repository = ref.watch(reportRepositoryProvider);
  final range = ref.watch(reportDateRangeProvider);
  return await repository.getServiceReport(range.start, range.end);
});

final staffReportProvider = FutureProvider.autoDispose<dynamic>((ref) async {
  final repository = ref.watch(reportRepositoryProvider);
  final range = ref.watch(reportDateRangeProvider);
  return await repository.getStaffReport(range.start, range.end);
});

final customerReportProvider = FutureProvider.autoDispose<Map<String, dynamic>>(
  (ref) async {
    final repository = ref.watch(reportRepositoryProvider);
    final range = ref.watch(reportDateRangeProvider);
    return await repository.getCustomerReport(range.start, range.end);
  },
);

final expenseReportProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repository = ref.watch(reportRepositoryProvider);
  final range = ref.watch(reportDateRangeProvider);
  return await repository.getExpenseReport(range.start, range.end);
});

final gstReportProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repository = ref.watch(reportRepositoryProvider);
  final range = ref.watch(reportDateRangeProvider);
  return await repository.getGstReport(range.start, range.end);
});
