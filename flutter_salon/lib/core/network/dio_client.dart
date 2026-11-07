import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final secureStorageProvider = Provider(
  (ref) => const FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  ),
);

Future<String?> safeStorageRead(
  FlutterSecureStorage storage,
  String key,
) async {
  try {
    final val = await storage.read(key: key);
    if (val != null && val.isNotEmpty) return val;
  } catch (_) {}
  try {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('fallback_$key');
  } catch (_) {
    return null;
  }
}

Future<void> safeStorageWrite(
  FlutterSecureStorage storage,
  String key,
  String value,
) async {
  try {
    await storage.write(key: key, value: value);
  } catch (_) {
    try {
      await storage.delete(key: key);
      await storage.write(key: key, value: value);
    } catch (_) {}
  }
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('fallback_$key', value);
  } catch (_) {}
}

Future<void> safeStorageDelete(
  FlutterSecureStorage storage,
  String key,
) async {
  try {
    await storage.delete(key: key);
  } catch (_) {}
  try {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('fallback_$key');
  } catch (_) {}
}

bool _isPublicPath(String path) {
  return path.contains('/auth/login') ||
      path.contains('/auth/forgot-password') ||
      path.contains('/auth/verify-otp') ||
      path.contains('/auth/reset-password') ||
      path.contains('/auth/refresh') ||
      path.contains('/app-version');
}

final inMemoryTokenProvider = StateProvider<String?>((ref) => null);

bool _isRefreshing = false;
final List<Completer<String?>> _tokenRefreshQueue = [];

const String kDefaultBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://api.salontime.co.in/api/v1',
  // defaultValue: 'http://192.168.1.3:5000/api/v1',
);

String get kBaseMediaUrl => kDefaultBaseUrl.replaceAll('/api/v1', '');

/// Safely resolves any relative or absolute media/upload URL to a valid URL.
/// Rewrites local IPs (192.168.x.x, localhost) to kBaseMediaUrl, handles comma-separated lists, and relative paths.
String resolveMediaUrl(dynamic url) {
  if (url == null) return '';
  final str = url.toString().trim();
  if (str.isEmpty || str == 'null') return '';

  final first = str.split(',').first.trim();
  if (first.isEmpty) return '';

  if (first.contains('192.168.') || first.contains('localhost:') || first.contains('127.0.0.1:')) {
    final uri = Uri.tryParse(first);
    if (uri != null && uri.path.isNotEmpty) {
      return '$kBaseMediaUrl${uri.path}';
    }
  }

  if (first.startsWith('http://') || first.startsWith('https://')) {
    return first;
  }

  if (first.startsWith('/')) {
    return '$kBaseMediaUrl$first';
  }

  return '$kBaseMediaUrl/$first';
}

final dioProvider = Provider<Dio>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);

  final dio = Dio(
    BaseOptions(
      baseUrl: kDefaultBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final inMemoryToken = ref.read(inMemoryTokenProvider);
        var token = inMemoryToken;
        if (token == null) {
          token = await safeStorageRead(secureStorage, 'auth_token');
          if (token != null) {
            ref.read(inMemoryTokenProvider.notifier).state = token;
          }
        }

        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        } else if (!_isPublicPath(options.path)) {
          return handler.reject(
            DioException(
              requestOptions: options,
              type: DioExceptionType.cancel,
              error: 'Session expired or token missing. Please login again.',
            ),
          );
        }

        options.headers['x-api-key'] = 'SALON_MOBILE_SECURE_2026';

        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        if (e.response?.statusCode == 401 &&
            !e.requestOptions.path.contains('/auth/refresh') &&
            !e.requestOptions.path.contains('/auth/login')) {
          if (_isRefreshing) {
            // Wait for the ongoing refresh to complete
            final completer = Completer<String?>();
            _tokenRefreshQueue.add(completer);
            final newToken = await completer.future;

            if (newToken != null) {
              final options = e.requestOptions;
              options.headers['Authorization'] = 'Bearer $newToken';
              try {
                final retryResponse = await dio.fetch(options);
                return handler.resolve(retryResponse);
              } catch (retryError) {
                return handler.next(
                  e,
                ); // If retry still fails, return original error
              }
            } else {
              return handler.next(e);
            }
          }

          _isRefreshing = true;

          final refreshToken = await safeStorageRead(
            secureStorage,
            'refresh_token',
          );
          String? resolvedNewToken;

          if (refreshToken != null) {
            try {
              final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
              refreshDio.options.headers['x-api-key'] =
                  'SALON_MOBILE_SECURE_2026';

              final response = await refreshDio.post(
                '/auth/refresh',
                data: {'refreshToken': refreshToken},
              );

              if (response.statusCode == 200 &&
                  response.data is Map &&
                  response.data['success'] == true) {
                final data = response.data as Map<String, dynamic>;
                final newToken =
                    data['data']?['accessToken'] ?? data['data']?['token'];
                final newRefreshToken = data['data']?['refreshToken'];

                if (newToken != null) {
                  await safeStorageWrite(secureStorage, 'auth_token', newToken);
                  if (newRefreshToken != null) {
                    await safeStorageWrite(
                      secureStorage,
                      'refresh_token',
                      newRefreshToken,
                    );
                  }
                  ref.read(inMemoryTokenProvider.notifier).state = newToken;
                  resolvedNewToken = newToken;
                }
              }
            } catch (refreshError) {
              // Refresh failed
            }
          }

          _isRefreshing = false;

          // Notify all waiting requests
          for (var completer in _tokenRefreshQueue) {
            completer.complete(resolvedNewToken);
          }
          _tokenRefreshQueue.clear();

          if (resolvedNewToken != null) {
            final options = e.requestOptions;
            options.headers['Authorization'] = 'Bearer $resolvedNewToken';
            try {
              final retryResponse = await dio.fetch(options);
              return handler.resolve(retryResponse);
            } catch (retryError) {
              return handler.next(e);
            }
          } else {
            // Refresh totally failed, clear session
            await safeStorageDelete(secureStorage, 'auth_token');
            await safeStorageDelete(secureStorage, 'refresh_token');
            ref.read(inMemoryTokenProvider.notifier).state = null;
          }
        }

        String userFriendlyMessage =
            'An unexpected error occurred. Please try again.';

        if (e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.sendTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          userFriendlyMessage =
              'Server is taking too long to respond. Please check your connection.';
        } else if (e.type == DioExceptionType.connectionError) {
          userFriendlyMessage =
              'Unable to connect to the server. Please check your internet connection.';
        } else if (e.response != null) {
          try {
            final data = e.response?.data;
            if (data is Map && data.containsKey('message')) {
              userFriendlyMessage = data['message'];
            } else if (data is Map && data.containsKey('error')) {
              userFriendlyMessage = data['error'];
            } else {
              userFriendlyMessage =
                  'Server error (${e.response?.statusCode}). Please try again later.';
            }
          } catch (_) {
            userFriendlyMessage =
                'Server error (${e.response?.statusCode}). Please try again later.';
          }
        } else if (e.message != null &&
            e.message!.contains('SocketException')) {
          userFriendlyMessage =
              'No internet connection or server is unreachable.';
        }

        final customError = DioException(
          requestOptions: e.requestOptions,
          response: e.response,
          type: e.type,
          error: userFriendlyMessage,
          stackTrace: e.stackTrace,
          message: userFriendlyMessage,
        );

        return handler.next(customError);
      },
    ),
  );

  return dio;
});
