import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_database/firebase_database.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'firebase_options.dart';

// --- Background Notification Handler ---
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  print('Handling a background message ${message.messageId}');
}

// --- Main Entry ---
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Set the background messaging handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Caregiver App',
      theme: ThemeData(
        brightness: Brightness.dark,
        primarySwatch: Colors.teal,
        scaffoldBackgroundColor: const Color(0xFF1A1D2E),
      ),
      home: const CaregiverHomePage(),
    );
  }
}

class CaregiverHomePage extends StatefulWidget {
  const CaregiverHomePage({super.key});

  @override
  State<CaregiverHomePage> createState() => _CaregiverHomePageState();
}

class _CaregiverHomePageState extends State<CaregiverHomePage> {
  final DatabaseReference _alertsRef = FirebaseDatabase.instance.ref('alerts');
  late FirebaseMessaging _messaging;
  late FlutterLocalNotificationsPlugin _localNotifications;

  @override
  void initState() {
    super.initState();
    _initNotifications();
    _subscribeToTopic();
  }

  void _initNotifications() async {
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

    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null) {
        _localNotifications.show(
          notification.hashCode,
          notification.title,
          notification.body,
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'high_importance_channel',
              'High Importance Notifications',
              importance: Importance.max,
            ),
          ),
        );
      }
    });
  }

  void _subscribeToTopic() {
    _messaging.subscribeToTopic('caregivers');
  }

  // Handle alert actions (Acknowledge)
  Future<void> _acknowledgeAlert(String key) async {
    await _alertsRef.child(key).update({
      'status': 'ack',
      'ackTimestamp': DateTime.now().millisecondsSinceEpoch,
    });
    // Show snackbar
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Alert Acknowledged')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Caregiver Dashboard'),
        backgroundColor: const Color(0xFF1A1D2E),
        elevation: 0,
      ),
      body: StreamBuilder(
        stream: _alertsRef.orderByChild('timestamp').limitToLast(20).onValue,
        builder: (context, AsyncSnapshot<DatabaseEvent> snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.snapshot.value == null) {
            return const Center(
              child: Text(
                'No active alerts',
                style: TextStyle(color: Colors.grey),
              ),
            );
          }

          // Process data
          final data = snapshot.data!.snapshot.value as Map<dynamic, dynamic>;
          final List<Map<String, dynamic>> alerts = [];
          data.forEach((key, value) {
            final alert = Map<String, dynamic>.from(value);
            alert['key'] = key;
            alerts.add(alert);
          });

          // Sort by timestamp descending
          alerts.sort((a, b) => b['timestamp'].compareTo(a['timestamp']));

          return ListView.builder(
            itemCount: alerts.length,
            itemBuilder: (context, index) {
              final alert = alerts[index];
              final bool isAck = alert['status'] == 'ack';
              final DateTime time = DateTime.fromMillisecondsSinceEpoch(
                alert['timestamp'],
              );
              final String timeString =
                  "${time.hour}:${time.minute.toString().padLeft(2, '0')}";

              return Card(
                color: isAck
                    ? const Color(0xFF2D3748)
                    : const Color(0xFFC53030),
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ListTile(
                  leading: Icon(
                    isAck ? Icons.check_circle : Icons.warning_amber_rounded,
                    color: Colors.white,
                    size: 40,
                  ),
                  title: Text(
                    alert['commandId']?.toString().toUpperCase() ?? 'ALERT',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: Colors.white,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (alert['details'] != null &&
                          alert['details'].toString().isNotEmpty)
                        Text(
                          alert['details'],
                          style: const TextStyle(color: Colors.white70),
                        ),
                      const SizedBox(height: 4),
                      Text(
                        timeString,
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  trailing: isAck
                      ? null
                      : ElevatedButton(
                          onPressed: () => _acknowledgeAlert(alert['key']),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.red,
                          ),
                          child: const Text('ACK'),
                        ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
