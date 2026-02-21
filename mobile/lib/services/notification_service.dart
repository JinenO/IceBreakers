import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  late FirebaseMessaging _messaging;
  late FlutterLocalNotificationsPlugin _localNotifications;

  Future<void> init() async {
    _messaging = FirebaseMessaging.instance;

    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    print('User granted permission: ${settings.authorizationStatus}');

    // Local Notifications (for foreground)
    _localNotifications = FlutterLocalNotificationsPlugin();
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings();
    const InitializationSettings initializationSettings =
        InitializationSettings(
          android: initializationSettingsAndroid,
          iOS: initializationSettingsIOS,
        );
    await _localNotifications.initialize(initializationSettings);

    // Create Android Notification Channels
    const AndroidNotificationChannel alertChannel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'General requests from the patient.',
      importance: Importance.max,
    );

    const AndroidNotificationChannel sosChannel = AndroidNotificationChannel(
      'sos_channel',
      'SOS Alarms',
      description: 'Emergency alerts (SOS) - loud and persistent.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      showBadge: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(alertChannel);

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(sosChannel);

    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      RemoteNotification? notification = message.notification;

      // Determine which channel to use based on data or title
      String channelId = 'high_importance_channel';
      if (message.data['commandId'] == 'SOS' ||
          notification?.title?.contains('SOS') == true) {
        channelId = 'sos_channel';
      }

      if (notification != null) {
        _localNotifications.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channelId,
              channelId == 'sos_channel'
                  ? 'SOS Alarms'
                  : 'High Importance Notifications',
              importance: Importance.max,
              priority: Priority.high,
              fullScreenIntent: channelId == 'sos_channel',
            ),
          ),
        );
      }
    });

    _messaging.subscribeToTopic('caregivers');
  }
}
