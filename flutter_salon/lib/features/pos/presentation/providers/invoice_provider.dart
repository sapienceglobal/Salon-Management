import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_salon/features/pos/data/invoice_repository.dart';

final invoiceRepositoryProvider = Provider<InvoiceRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return InvoiceRepository(dio: dio);
});

final invoicesListProvider = FutureProvider.autoDispose
    .family<List<dynamic>, String?>((ref, status) async {
      final repository = ref.watch(invoiceRepositoryProvider);
      return await repository.getInvoices(status: status);
    });

final invoiceDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>((ref, invoiceId) async {
      final repository = ref.watch(invoiceRepositoryProvider);
      return await repository.getInvoice(invoiceId);
    });
