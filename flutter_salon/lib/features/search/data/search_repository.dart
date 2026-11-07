import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  final dio = ref.watch(dioProvider);
  return SearchRepository(dio: dio);
});

class SearchRepository {
  final Dio dio;

  SearchRepository({required this.dio});

  Future<Map<String, dynamic>> searchAll(String query) async {
    if (query.trim().length < 2) return {};
    try {
      final response = await dio.get('/search', queryParameters: {'q': query});
      if (response.data is Map && response.data['success'] == true) {
        return response.data['data'] as Map<String, dynamic>;
      }
      return response.data as Map<String, dynamic>? ?? {};
    } on DioException catch (e) {
      if (e.response != null && e.response?.statusCode == 404) {
        return {};
      }
      rethrow;
    }
  }
}
