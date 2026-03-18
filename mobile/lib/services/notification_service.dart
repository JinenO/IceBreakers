import 'dart:convert';
import 'dart:typed_data';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  late FirebaseMessaging _messaging;
  late FlutterLocalNotificationsPlugin _localNotifications;

  // ✨ TERMINAL STATE VARIABLES
  BluetoothConnection? _bluetoothConnection;
  bool _isServoOpen = false;

  Future<void> init() async {
    _messaging = FirebaseMessaging.instance;

    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    print('User granted permission: ${settings.authorizationStatus}');

    // Local Notifications Setup
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

    const AndroidNotificationChannel alertChannel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      importance: Importance.max,
    );

    const AndroidNotificationChannel sosChannel = AndroidNotificationChannel(
      'sos_channel',
      'SOS Alarms',
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

    // ✨ TERMINAL STARTUP: Try to connect to the HC-06 as soon as the app opens!
    _connectToTerminal();

    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message whilst in the foreground!');
      RemoteNotification? notification = message.notification;

      bool isIotTrigger =
          message.data['commandId'] == 'IOT_TRIGGER' ||
          message.data['type'] == 'IOT_TRIGGER' ||
          notification?.title?.contains('IOT_TRIGGER') == true;

      if (isIotTrigger) {
        print("⚡ IOT TRIGGER DETECTED!");
        _sendBluetoothCommand();
      }

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
              channelId == 'sos_channel' ? 'SOS Alarms' : 'High Importance',
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

  // ==============================================================
  // ✨ NEW: Persistent Terminal Connection
  // ==============================================================
  Future<void> _connectToTerminal() async {
    try {
      // 1. Check Permissions
      Map<Permission, PermissionStatus> statuses = await [
        Permission.bluetoothConnect,
        Permission.bluetoothScan,
      ].request();

      if (statuses[Permission.bluetoothConnect] != PermissionStatus.granted) {
        print("❌ TERMINAL: Bluetooth permissions denied.");
        return;
      }

      print("🔍 TERMINAL: Searching for HC-06...");
      List<BluetoothDevice> devices = await FlutterBluetoothSerial.instance
          .getBondedDevices();

      BluetoothDevice? hc06;
      for (BluetoothDevice device in devices) {
        if (device.name != null &&
            (device.name!.contains("HC-06") || device.name!.contains("HC06"))) {
          hc06 = device;
          break;
        }
      }

      if (hc06 == null) {
        print("❌ TERMINAL: HC-06 not found in paired devices.");
        return;
      }

      // 2. Open the persistent connection
      print("🔗 TERMINAL: Connecting to ${hc06.name}...");
      _bluetoothConnection = await BluetoothConnection.toAddress(hc06.address);
      print(
        "✅ TERMINAL: CONNECTED SUCCESSFULLY! The red light should now be SOLID.",
      );

      // 3. Listen for incoming data (Just like the Serial Terminal App!)
      _bluetoothConnection!.input!
          .listen((Uint8List data) {
            // If your Arduino ever does Serial.println(), it will show up here!
            print("📥 TERMINAL RECEIVED: ${ascii.decode(data)}");
          })
          .onDone(() {
            print("⚠️ TERMINAL: Disconnected by remote device.");
            _bluetoothConnection = null;
          });
    } catch (e) {
      print("❌ TERMINAL ERROR: $e");
    }
  }

  // ==============================================================
  // ✨ UPDATED: Send Command over the open Terminal
  // ==============================================================
  Future<void> _sendBluetoothCommand() async {
    // If the connection dropped or didn't start, try reconnecting first
    if (_bluetoothConnection == null || !_bluetoothConnection!.isConnected) {
      print("⚠️ TERMINAL: Not connected. Attempting to reconnect...");
      await _connectToTerminal();
    }

    // If we are definitely connected, send the command
    if (_bluetoothConnection != null && _bluetoothConnection!.isConnected) {
      String commandChar = _isServoOpen ? '0' : '2';
      _isServoOpen = !_isServoOpen;

      String finalCommand = commandChar + "\n";

      print("📤 TERMINAL: Sending '$commandChar' to Arduino...");
      _bluetoothConnection!.output.add(
        Uint8List.fromList(finalCommand.codeUnits),
      );
      await _bluetoothConnection!.output.allSent;
      print("✅ TERMINAL: Message sent. (Connection remains OPEN)");
    } else {
      print("❌ TERMINAL: Failed to send command. Still not connected.");
    }
  }
}
