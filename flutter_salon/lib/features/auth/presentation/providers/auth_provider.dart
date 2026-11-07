import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/auth_repository.dart';

import '../../../../core/network/dio_client.dart';

class CurrentUserSession {
  static String? currentRole;
  static bool get isManager => currentRole?.toLowerCase() == 'manager';
  static bool get isAdmin => currentRole == null || currentRole?.toLowerCase() == 'admin' || currentRole?.toLowerCase() == 'super_admin';
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<void>>(
  (ref) {
    return AuthNotifier(ref.watch(authRepositoryProvider), ref);
  },
);

class AuthNotifier extends StateNotifier<AsyncValue<void>> {
  final AuthRepository _repository;
  final Ref _ref;

  AuthNotifier(this._repository, this._ref) : super(const AsyncData(null));

  Future<bool> login(String email, String password, bool rememberMe) async {
    state = const AsyncLoading();
    try {
      final token = await _repository.login(email, password);

      if (rememberMe) {
        await safeStorageWrite(
          _ref.read(secureStorageProvider),
          'auth_token',
          token,
        );
      }
      _ref.read(inMemoryTokenProvider.notifier).state = token;

      String? role;
      try {
        role = await _repository.getUserRole();
      } catch (_) {}
      CurrentUserSession.currentRole = role;
      _ref.read(userRoleProvider.notifier).state = role;

      state = const AsyncData(null);
      return true;
    } catch (e, st) {
      state = AsyncError(e, st);
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
    } catch (_) {}
    final storage = _ref.read(secureStorageProvider);
    await safeStorageDelete(storage, 'auth_token');
    await safeStorageDelete(storage, 'user_role');
    CurrentUserSession.currentRole = null;
    _ref.read(inMemoryTokenProvider.notifier).state = null;
    _ref.read(userRoleProvider.notifier).state = null;
  }

  Future<void> forgotPassword(String email) async {
    await _repository.forgotPassword(email);
  }

  Future<void> verifyOtp(String email, String otp) async {
    await _repository.verifyOtp(email, otp);
  }

  Future<void> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    await _repository.resetPassword(email, otp, newPassword);
  }

  Future<void> deleteAccount(String password) async {
    await _repository.deleteAccount(password);
    CurrentUserSession.currentRole = null;
    _ref.read(inMemoryTokenProvider.notifier).state = null;
    _ref.read(userRoleProvider.notifier).state = null;
  }
}

final userRoleProvider = StateProvider<String?>((ref) => null);

final isManagerProvider = Provider<bool>((ref) {
  final role = ref.watch(userRoleProvider);
  if (role != null) {
    return role.toLowerCase() == 'manager';
  }
  return CurrentUserSession.isManager;
});

final isAdminProvider = Provider<bool>((ref) {
  final isManager = ref.watch(isManagerProvider);
  return !isManager;
});

final userProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final token = ref.watch(inMemoryTokenProvider);
  if (token == null) return null;

  try {
    final dio = ref.watch(dioProvider);
    final response = await dio.get('/auth/me');
    if (response.statusCode == 200 &&
        response.data is Map &&
        response.data['success'] == true) {
      final user = response.data['data']['user'] as Map<String, dynamic>?;
      if (user != null && user['role'] != null) {
        final role = user['role'].toString();
        CurrentUserSession.currentRole = role;
        ref.read(userRoleProvider.notifier).state = role;
      }
      return user;
    }
    return null;
  } catch (e) {
    return null;
  }
});
