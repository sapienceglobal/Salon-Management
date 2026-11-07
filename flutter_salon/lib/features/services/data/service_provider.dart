import 'package:flutter_salon/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'service_repository.dart';

final serviceRepositoryProvider = Provider<ServiceRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return ServiceRepository(dio: dio);
});

final servicesListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(serviceRepositoryProvider);
  return await repository.getServices();
});

final categoriesListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  final repository = ref.watch(serviceRepositoryProvider);
  return await repository.getCategories();
});
