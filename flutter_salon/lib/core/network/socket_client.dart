import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:uuid/uuid.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'dio_client.dart';
import '../../features/notifications/presentation/providers/notification_provider.dart';
import '../../features/crm/data/crm_provider.dart';
import '../router/app_router.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService(ref);
  service.connect();
  ref.onDispose(() {
    service.disconnect();
  });
  return service;
});

class SocketService {
  final Ref _ref;
  IO.Socket? _socket;

  SocketService(this._ref);

  Future<void> connect() async {
    if (_socket != null && _socket!.connected) return;

    final token = _ref.read(inMemoryTokenProvider);
    if (token == null || token.isEmpty) return;

    try {
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      final businessId = decodedToken['business_id'];
      if (businessId == null) return;

      // Subscribe to FCM topic for push notifications (non-blocking)
      Future(() async {
        try {
          if (Firebase.apps.isEmpty) return;
          final fcm = FirebaseMessaging.instance;
          if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
            String? apnsToken = await fcm.getAPNSToken();
            for (int i = 0; i < 3 && apnsToken == null; i++) {
              await Future.delayed(const Duration(seconds: 2));
              apnsToken = await fcm.getAPNSToken();
            }
            if (apnsToken == null) {
              debugPrint('Skipping FCM topic subscription on iOS: APNs token not ready yet');
              return;
            }
          }
          await fcm.subscribeToTopic('business_$businessId');
          debugPrint('Subscribed to FCM topic: business_$businessId');
        } catch (e) {
          debugPrint('Failed to subscribe to FCM topic: $e');
        }
      });

      const baseUrl = String.fromEnvironment(
        'API_URL',
        defaultValue: 'https://api.salontime.co.in',
      );
      final uri = Uri.parse(baseUrl);
      final socketUrl =
          '${uri.scheme}://${uri.host}${uri.port != 80 && uri.port != 443 ? ':${uri.port}' : ''}';

      _socket = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .build(),
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        debugPrint('Socket connected: ${_socket!.id}');
        _socket!.emit('join_business_room', businessId);
        debugPrint('Joined room: business_$businessId');
      });

      _socket!.onDisconnect((_) {
        debugPrint('Socket disconnected');
      });

      _socket!.onError((err) {
        debugPrint('Socket error: $err');
      });

      // Global listeners for notifications
      _socket!.on('new_lead', (data) {
        if (data != null) {
          final mapData = Map<String, dynamic>.from(data as Map);
          _ref
              .read(notificationProvider.notifier)
              .addNotification(
                AppNotification(
                  id: const Uuid().v4(),
                  title: 'New Lead: ${mapData['name'] ?? 'Unknown'}',
                  message:
                      'A new lead just arrived via ${mapData['source'] ?? 'Meta'}.',
                  timestamp: DateTime.now(),
                  type: 'new_lead',
                ),
              );

          // Invalidate the leads list so it automatically refreshes on the LeadsScreen
          _ref.invalidate(leadsListProvider);

          // Show in-app Snackbar using global key
          scaffoldMessengerKey.currentState?.showSnackBar(
            SnackBar(
              content: Text('New Lead from Meta: ${mapData['name']}'),
              backgroundColor: const Color(0xFFE74A8A), // Brand Color
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10.r),
              ),
              action: SnackBarAction(
                label: 'VIEW',
                textColor: Colors.white,
                onPressed: () {
                  goRouter.push('/leads');
                },
              ),
            ),
          );
        }
      });
    } catch (e) {
      debugPrint('Socket initialization error: $e');
    }
  }

  void onNewLead(Function(Map<String, dynamic>) callback) {
    if (_socket != null) {
      _socket!.on('new_lead', (data) {
        if (data != null) {
          final mapData = Map<String, dynamic>.from(data as Map);
          callback(mapData);
        }
      });
    }
  }

  void offNewLead() {
    if (_socket != null) {
      _socket!.off('new_lead');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
