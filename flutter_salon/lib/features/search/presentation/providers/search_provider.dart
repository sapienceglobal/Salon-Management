import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/search_repository.dart';

final globalSearchProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, query) async {
      if (query.trim().length < 2) return {};

      var didDispose = false;
      ref.onDispose(() => didDispose = true);
      await Future.delayed(const Duration(milliseconds: 400));
      if (didDispose) {
        throw Exception('cancelled');
      }

      final repository = ref.watch(searchRepositoryProvider);
      return await repository.searchAll(query);
    });
