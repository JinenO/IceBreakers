import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'firebase_options.dart';
import 'screens/home_screen.dart';
import 'services/notification_service.dart';
import 'package:provider/provider.dart';
import 'providers/settings_provider.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  print('Handling a background message ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Set the background messaging handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialize notification service
  await NotificationService().init();

  runApp(
    MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => SettingsProvider())],
      child: const IrisFlowApp(),
    ),
  );
}

class IrisFlowApp extends StatelessWidget {
  const IrisFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, provider, child) {
        return MaterialApp(
          title: 'IRIS FLOW',
          debugShowCheckedModeBanner: false,
          theme: provider.currentTheme.copyWith(
            textTheme:
                GoogleFonts.atkinsonHyperlegibleTextTheme(
                      ThemeData.dark().textTheme,
                    )
                    .apply(
                      bodyColor: provider.highContrastMode
                          ? Colors.yellow
                          : Colors.white,
                      displayColor: provider.highContrastMode
                          ? Colors.yellow
                          : Colors.white,
                    )
                    .copyWith(
                      bodyLarge: TextStyle(
                        fontSize: provider.largeTextMode ? 20 : 16,
                      ),
                      bodyMedium: TextStyle(
                        fontSize: provider.largeTextMode ? 18 : 14,
                      ),
                    ),
          ),
          home: const HomeScreen(),
        );
      },
    );
  }
}
