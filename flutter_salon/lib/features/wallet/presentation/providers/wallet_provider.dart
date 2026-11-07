import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/wallet/data/wallet_repository.dart';

final walletRepositoryProvider = Provider<WalletRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return WalletRepository(dio: dio);
});

final walletBalanceProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, customerId) async {
      final repository = ref.watch(walletRepositoryProvider);
      return await repository.getBalance(customerId);
    });

final walletTransactionsProvider = FutureProvider.autoDispose
    .family<List<dynamic>, int>((ref, customerId) async {
      final repository = ref.watch(walletRepositoryProvider);
      return await repository.getTransactions(customerId);
    });
