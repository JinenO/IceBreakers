import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_database/firebase_database.dart';

class SettingsProvider with ChangeNotifier {
  // Local Settings
  bool _highContrastMode = false;
  bool _largeTextMode = false;
  int _autoClearHours = 24;
  double _batteryWarningThreshold = 15.0;

  // Remote Settings (Synced to Firebase)
  int _scanSpeed = 2500;
  double _blinkThreshold = 0.012;
  int _requiredBlinkTime = 1000;
  List<String> _emergencyContacts = [];

  // Toggles for Alert Criticality (Local or Remote, keeping it Local for now to configure this app's behavior)
  bool _criticalSOS = true;
  bool _criticalSuction = true;
  bool _criticalFood = false;
  bool _criticalWater = false;

  final DatabaseReference _settingsRef = FirebaseDatabase.instance.ref(
    'patient_settings',
  );

  SettingsProvider() {
    _loadLocalSettings();
    _listenToRemoteSettings();
  }

  // --- Getters ---
  bool get highContrastMode => _highContrastMode;
  bool get largeTextMode => _largeTextMode;
  int get autoClearHours => _autoClearHours;
  double get batteryWarningThreshold => _batteryWarningThreshold;

  int get scanSpeed => _scanSpeed;
  double get blinkThreshold => _blinkThreshold;
  int get requiredBlinkTime => _requiredBlinkTime;
  List<String> get emergencyContacts => _emergencyContacts;

  bool get criticalSOS => _criticalSOS;
  bool get criticalSuction => _criticalSuction;
  bool get criticalFood => _criticalFood;
  bool get criticalWater => _criticalWater;

  // --- Theme Helpers ---
  ThemeData get currentTheme {
    ThemeData baseTheme = ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: _highContrastMode
          ? Colors.black
          : const Color(0xFF121212),
      colorScheme: ColorScheme.dark(
        primary: _highContrastMode ? Colors.yellow : const Color(0xFF64FFDA),
        surface: _highContrastMode ? Colors.black : const Color(0xFF1E1E1E),
        error: const Color(0xFFD32F2F),
        onSurface: _highContrastMode ? Colors.yellow : Colors.white,
      ),
      useMaterial3: true,
    );
    return baseTheme;
  }

  // --- Setters (Local) ---
  Future<void> toggleHighContrast(bool value) async {
    _highContrastMode = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('highContrastMode', value);
  }

  Future<void> toggleLargeText(bool value) async {
    _largeTextMode = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('largeTextMode', value);
  }

  Future<void> setAutoClearHours(int hours) async {
    _autoClearHours = hours;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('autoClearHours', hours);
  }

  Future<void> setBatteryWarningThreshold(double value) async {
    _batteryWarningThreshold = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('batteryWarningThreshold', value);
  }

  // --- Setters for Criticality (Local) ---
  Future<void> toggleCriticalSOS(bool value) async {
    _criticalSOS = value;
    _saveBool('criticalSOS', value);
  }

  Future<void> toggleCriticalSuction(bool value) async {
    _criticalSuction = value;
    _saveBool('criticalSuction', value);
  }

  Future<void> toggleCriticalFood(bool value) async {
    _criticalFood = value;
    _saveBool('criticalFood', value);
  }

  Future<void> toggleCriticalWater(bool value) async {
    _criticalWater = value;
    _saveBool('criticalWater', value);
  }

  Future<void> _saveBool(String key, bool value) async {
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  // --- Setters (Remote Sync) ---
  Future<void> setScanSpeed(int value) async {
    _scanSpeed = value;
    notifyListeners();
    await _settingsRef.child('scanSpeed').set(value);
  }

  Future<void> setBlinkThreshold(double value) async {
    _blinkThreshold = value;
    notifyListeners();
    await _settingsRef.child('blinkThreshold').set(value);
  }

  Future<void> setRequiredBlinkTime(int value) async {
    _requiredBlinkTime = value;
    notifyListeners();
    await _settingsRef.child('requiredBlinkTime').set(value);
  }

  Future<void> addEmergencyContact(String contact) async {
    if (!_emergencyContacts.contains(contact)) {
      _emergencyContacts.add(contact);
      notifyListeners();
      await _settingsRef.child('emergencyContacts').set(_emergencyContacts);
    }
  }

  Future<void> removeEmergencyContact(String contact) async {
    _emergencyContacts.remove(contact);
    notifyListeners();
    await _settingsRef.child('emergencyContacts').set(_emergencyContacts);
  }

  // --- Private Helpers ---
  Future<void> _loadLocalSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _highContrastMode = prefs.getBool('highContrastMode') ?? false;
    _largeTextMode = prefs.getBool('largeTextMode') ?? false;
    _autoClearHours = prefs.getInt('autoClearHours') ?? 24;
    _batteryWarningThreshold =
        prefs.getDouble('batteryWarningThreshold') ?? 15.0;

    _criticalSOS = prefs.getBool('criticalSOS') ?? true;
    _criticalSuction = prefs.getBool('criticalSuction') ?? true;
    _criticalFood = prefs.getBool('criticalFood') ?? false;
    _criticalWater = prefs.getBool('criticalWater') ?? false;

    notifyListeners();
  }

  void _listenToRemoteSettings() {
    _settingsRef.onValue.listen((event) {
      if (event.snapshot.value != null) {
        final data = Map<String, dynamic>.from(event.snapshot.value as Map);
        _scanSpeed = (data['scanSpeed'] ?? 2500) as int;
        _blinkThreshold = (data['blinkThreshold'] ?? 0.012) as double;
        _requiredBlinkTime = (data['requiredBlinkTime'] ?? 1000) as int;

        if (data['emergencyContacts'] != null) {
          _emergencyContacts = List<String>.from(
            data['emergencyContacts'] as List,
          );
        } else {
          _emergencyContacts = [];
        }
        notifyListeners();
      }
    });
  }
}
