import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';

final posItemsProvider = FutureProvider.autoDispose<Map<String, List<dynamic>>>(
  (ref) async {
    final dio = ref.watch(dioProvider);

    try {
      final responses = await Future.wait([
        dio.get('/services', queryParameters: {'active_only': 'true'}),
        dio.get('/products', queryParameters: {'is_active': 'true'}),
        dio.get('/catalog/packages'),
        dio.get('/catalog/memberships'),
      ]);

      List<dynamic> filterActive(dynamic raw) {
        if (raw is List) {
          return raw.where((i) => i['is_active'] != false && i['is_active'] != 0).toList();
        }
        return [];
      }

      return {
        'services': filterActive(responses[0].data['data'] ?? responses[0].data),
        'products': filterActive(responses[1].data['data'] ?? responses[1].data),
        'packages': filterActive(responses[2].data['data'] ?? responses[2].data),
        'memberships': filterActive(responses[3].data['data'] ?? responses[3].data),
      };
    } catch (e) {
      throw Exception('Failed to load POS items: $e');
    }
  },
);
