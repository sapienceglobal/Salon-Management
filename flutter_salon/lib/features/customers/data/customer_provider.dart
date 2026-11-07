import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'customer_repository.dart';

import '../../../../core/network/dio_client.dart';

final customerRepositoryProvider = Provider<CustomerRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return CustomerRepository(dio: dio);
});

final customersListProvider = FutureProvider.autoDispose
    .family<List<dynamic>, String>((ref, search) async {
      final repository = ref.watch(customerRepositoryProvider);
      return await repository.getCustomers(search: search);
    });

final recentCustomersProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(customerRepositoryProvider);
  return await repository.getCustomers(limit: 5);
});

final customerStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((
  ref,
) async {
  final repository = ref.watch(customerRepositoryProvider);
  return await repository.getCustomerStats();
});

final customerProfileProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, id) async {
      final repository = ref.watch(customerRepositoryProvider);
      return await repository.getCustomerProfile(id);
    });

final customerVisitsProvider = FutureProvider.autoDispose
    .family<List<dynamic>, int>((ref, id) async {
      final repository = ref.watch(customerRepositoryProvider);
      return await repository.getCustomerVisits(id);
    });

final customerAppointmentsProvider = FutureProvider.autoDispose
    .family<List<dynamic>, int>((ref, id) async {
      final repository = ref.watch(customerRepositoryProvider);
      return await repository.getCustomerAppointments(id);
    });

final customerWalletHistoryProvider = FutureProvider.autoDispose
    .family<List<dynamic>, int>((ref, id) async {
      final repository = ref.watch(customerRepositoryProvider);
      return await repository.getCustomerWalletHistory(id);
    });

final customerRewardHistoryProvider = FutureProvider.autoDispose
    .family<List<dynamic>, int>((ref, id) async {
      final repository = ref.watch(customerRepositoryProvider);
      return await repository.getCustomerRewardHistory(id);
    });
