import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/dio_client.dart';

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  return SettingsRepository(dio: ref.watch(dioProvider));
});

class SettingsRepository {
  final Dio dio;

  SettingsRepository({required this.dio});

  // Business & Config
  Future<Map<String, dynamic>> getSettings() async {
    final response = await dio.get('/settings');
    if (response.data is Map) {
      if (response.data['data'] != null && response.data['data'] is Map) {
        return Map<String, dynamic>.from(response.data['data']);
      }
      return Map<String, dynamic>.from(response.data);
    }
    return {};
  }

  Future<Map<String, dynamic>> updateBusiness(Map<String, dynamic> data) async {
    final response = await dio.put('/settings/business', data: data);
    if (response.data is Map && response.data['data'] is Map) {
      return Map<String, dynamic>.from(response.data['data']);
    }
    return {};
  }

  Future<Map<String, dynamic>> updateConfig(Map<String, dynamic> data) async {
    final response = await dio.put('/settings/config', data: data);
    if (response.data is Map && response.data['data'] is Map) {
      return Map<String, dynamic>.from(response.data['data']);
    }
    return {};
  }

  // Commission Profiles
  Future<List<dynamic>> getCommissionProfiles() async {
    final response = await dio.get('/settings/commission-profiles');
    return response.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> createCommissionProfile(
    Map<String, dynamic> data,
  ) async {
    final response = await dio.post(
      '/settings/commission-profiles',
      data: data,
    );
    return response.data['data'] ?? {};
  }

  Future<Map<String, dynamic>> updateCommissionProfile(
    int id,
    Map<String, dynamic> data,
  ) async {
    final response = await dio.put(
      '/settings/commission-profiles/$id',
      data: data,
    );
    return response.data['data'] ?? {};
  }

  Future<void> deleteCommissionProfile(int id) async {
    await dio.delete('/settings/commission-profiles/$id');
  }

  // Rooms
  Future<List<dynamic>> getRooms() async {
    final response = await dio.get('/settings/rooms');
    return response.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> createRoom(Map<String, dynamic> data) async {
    final response = await dio.post('/settings/rooms', data: data);
    return response.data['data'] ?? {};
  }

  Future<Map<String, dynamic>> updateRoom(
    int id,
    Map<String, dynamic> data,
  ) async {
    final response = await dio.put('/settings/rooms/$id', data: data);
    return response.data['data'] ?? {};
  }

  Future<void> deleteRoom(int id) async {
    await dio.delete('/settings/rooms/$id');
  }

  // Notifications
  Future<List<dynamic>> getNotificationTemplates() async {
    final response = await dio.get('/settings/notifications');
    return response.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> upsertNotificationTemplate(
    Map<String, dynamic> data,
  ) async {
    final response = await dio.post('/settings/notifications', data: data);
    return response.data['data'] ?? {};
  }

  Future<void> deleteNotificationTemplate(int id) async {
    await dio.delete('/settings/notifications/$id');
  }

  // Users (Staff)
  Future<List<dynamic>> getUsers() async {
    final response = await dio.get('/settings/users');
    return response.data['data'] ?? [];
  }

  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    final response = await dio.post('/settings/users', data: data);
    return response.data['data'] ?? {};
  }

  Future<Map<String, dynamic>> updateUser(
    int id,
    Map<String, dynamic> data,
  ) async {
    final response = await dio.put('/settings/users/$id', data: data);
    return response.data['data'] ?? {};
  }

  Future<void> deleteUser(int id) async {
    await dio.delete('/settings/users/$id');
  }
}
