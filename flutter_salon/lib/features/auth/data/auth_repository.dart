import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/network/dio_client.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    dio: ref.watch(dioProvider),
    secureStorage: ref.watch(secureStorageProvider),
  );
});

class AuthRepository {
  final Dio dio;
  final FlutterSecureStorage secureStorage;

  AuthRepository({required this.dio, required this.secureStorage});

  Future<String> login(String email, String password) async {
    try {
      final response = await dio.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      if (response.data is Map && response.data['success'] == true) {
        final data = response.data as Map<String, dynamic>;
        final token =
            data['data']?['accessToken'] ??
            data['data']?['token'] ??
            data['token']; // Adjust based on actual API payload
        final refreshToken = response.data['data']['refreshToken'];
        if (token != null) {
          if (refreshToken != null) {
            await safeStorageWrite(
              secureStorage,
              'refresh_token',
              refreshToken.toString(),
            );
          }
          final userRole = data['data']?['user']?['role']?.toString() ?? 'staff';
          await safeStorageWrite(secureStorage, 'user_role', userRole);
          return token.toString();
        } else {
          throw Exception('Token missing in response');
        }
      } else {
        final msg = response.data is Map
            ? response.data['message']
            : 'Login failed (Invalid response format)';
        throw Exception(msg ?? 'Login failed');
      }
    } on DioException catch (e) {
      String message = e.message ?? 'Unknown error';
      if (e.response != null && e.response!.data != null) {
        if (e.response!.data is Map) {
          message = e.response!.data['message'] ?? message;
        } else if (e.response!.data is String) {
          message = 'Server Error (Status: ${e.response?.statusCode})';
        }
      }
      throw Exception(message);
    }
  }

  Future<void> logout() async {
    try {
      await dio.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await safeStorageDelete(secureStorage, 'auth_token');
      await safeStorageDelete(secureStorage, 'refresh_token');
      await safeStorageDelete(secureStorage, 'user_role');
    }
  }

  Future<String?> getUserRole() async {
    return await safeStorageRead(secureStorage, 'user_role');
  }

  Future<bool> isAuthenticated() async {
    final token = await safeStorageRead(secureStorage, 'auth_token');
    return token != null;
  }

  Future<void> forgotPassword(String email) async {
    try {
      final response = await dio.post(
        '/auth/forgot-password',
        data: {'email': email},
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to send OTP');
      }
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? 'Failed to send OTP';
      throw Exception(message);
    }
  }

  Future<void> verifyOtp(String email, String otp) async {
    try {
      final response = await dio.post(
        '/auth/verify-otp',
        data: {'email': email, 'otp': otp},
      );
      if (response.statusCode != 200) {
        throw Exception('Invalid OTP');
      }
    } on DioException catch (e) {
      final message = e.response?.data?['message'] ?? 'Invalid OTP';
      throw Exception(message);
    }
  }

  Future<void> resetPassword(
    String email,
    String otp,
    String newPassword,
  ) async {
    try {
      final response = await dio.post(
        '/auth/reset-password',
        data: {'email': email, 'token': otp, 'password': newPassword},
      );
      if (response.statusCode != 200) {
        throw Exception('Failed to reset password');
      }
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] ?? 'Failed to reset password';
      throw Exception(message);
    }
  }

  Future<void> deleteAccount(String password) async {
    try {
      final response = await dio.post(
        '/auth/delete-account',
        data: {'password': password},
      );
      if (response.data is Map && response.data['success'] == false) {
        throw Exception(response.data['message'] ?? 'Failed to delete account');
      }
    } on DioException catch (e) {
      String message = 'Failed to delete account';
      if (e.response?.data != null && e.response!.data is Map) {
        message = e.response!.data['message'] ?? message;
      }
      throw Exception(message);
    } finally {
      await safeStorageDelete(secureStorage, 'auth_token');
      await safeStorageDelete(secureStorage, 'refresh_token');
      await safeStorageDelete(secureStorage, 'user_role');
    }
  }
}
