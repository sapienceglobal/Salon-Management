import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';

import 'dart:developer';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

const FirebaseOptions _iosFirebaseOptions = FirebaseOptions(
  apiKey: 'AIzaSyBnJZwDnZWls9KnIfPVYJuY2rwt117QllA',
  appId: '1:731254904481:ios:baae13873e58618e1b82e0',
  messagingSenderId: '731254904481',
  projectId: 'salon-time-9295b',
  storageBucket: 'salon-time-9295b.firebasestorage.app',
  iosBundleId: 'com.salontime.app',
);

Future<void> _ensureFirebaseInitialized() async {
  if (Firebase.apps.isNotEmpty) return;
  try {
    await Firebase.initializeApp();
  } catch (e) {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      await Firebase.initializeApp(options: _iosFirebaseOptions);
    } else {
      rethrow;
    }
  }
}

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'high_importance_channel', // id
  'High Importance Notifications', // title
  description:
      'This channel is used for important notifications.', // description
  importance: Importance.high,
);

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await _ensureFirebaseInitialized();
    log("Handling a background message: ${message.messageId}");
  } catch (e) {
    log("Background Firebase init skipped: $e");
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await _ensureFirebaseInitialized();
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request notification permissions explicitly for Android 13+
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();

    // Request permission for iOS & Android
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    await messaging.setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
    );

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
      try {
        String? apnsToken = await messaging.getAPNSToken();
        if (apnsToken == null) {
          await Future.delayed(const Duration(seconds: 2));
          apnsToken = await messaging.getAPNSToken();
        }
        log('iOS APNs token ready: ${apnsToken != null}');
      } catch (e) {
        log('APNs token check non-fatal error: $e');
      }
    }

    // Initialize Local Notifications for Heads-Up UI in Foreground
    const initializationSettingsAndroid = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const initializationSettingsIOS = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );
    await flutterLocalNotificationsPlugin.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload == 'new_lead') {
          goRouter.push('/leads');
        }
      },
    );

    // Create the channel on the device (if a channel with an id already exists, it will be updated)
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);

    // Listen to foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      log('Got a message whilst in the foreground!');
      log('Message data: ${message.data}');

      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        log('Message also contained a notification: ${message.notification}');
        // Show Local Heads-Up Notification when app is in Foreground on Android
        // (On iOS, setForegroundNotificationPresentationOptions handles the native banner)
        flutterLocalNotificationsPlugin.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: '@mipmap/ic_launcher',
              color: const Color(0xFFE74A8A), // Brand Color
              importance: Importance.high,
              priority: Priority.high,
            ),
            iOS: const DarwinNotificationDetails(
              presentAlert: true,
              presentBadge: true,
              presentSound: true,
            ),
          ),
          payload: message.data['type'],
        );
      }
    });

    // Handle tapping on a background push notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log('User tapped on notification in background: ${message.data}');
      if (message.data['type'] == 'new_lead') {
        goRouter.push('/leads');
      }
    });

    // Check if app was opened from a terminated state via a push notification
    FirebaseMessaging.instance.getInitialMessage().then((
      RemoteMessage? message,
    ) {
      if (message != null) {
        log(
          'App opened from terminated state via notification: ${message.data}',
        );
        // Delay slightly to ensure router is ready
        Future.delayed(const Duration(milliseconds: 500), () {
          if (message.data['type'] == 'new_lead') {
            goRouter.push('/leads');
          }
        });
      }
    });
  } catch (e) {
    log("Firebase initialization error: $e");
  }

  runApp(const ProviderScope(child: SalonAdminApp()));
}

class SalonAdminApp extends ConsumerWidget {
  const SalonAdminApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ScreenUtilInit(
      designSize: const Size(390, 844), // iPhone 14 Pro size
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (context, child) {
        return MaterialApp.router(
          title: 'Salon Admin Panel',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: goRouter,
          scaffoldMessengerKey: scaffoldMessengerKey,
          builder: (context, child) {
            return child!;
          },
        );
      },
    );
  }
}
