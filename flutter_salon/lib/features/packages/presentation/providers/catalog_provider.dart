import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/catalog_repository.dart';

final packagesListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  return await ref.watch(catalogRepositoryProvider).getPackages();
});

final membershipsListProvider = FutureProvider.autoDispose<List<dynamic>>((
  ref,
) async {
  return await ref.watch(catalogRepositoryProvider).getMemberships();
});
