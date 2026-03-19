import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';
import '../models/alert_model.dart';
import '../models/patient_status_model.dart';
import '../widgets/patient_status_card.dart';
import '../widgets/sos_overlay.dart';
import 'alert_detail_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseReference _alertsRef = FirebaseDatabase.instance.ref('alerts');
  final DatabaseReference _statusRef = FirebaseDatabase.instance.ref(
    'patient_status',
  );

  Future<void> _deleteOldAlerts(Map<dynamic, dynamic> data) async {
    final now = DateTime.now().millisecondsSinceEpoch;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    for(var entry in data.entries) {
      final key = entry.key;
      final value = Map<String, dynamic>.from(entry.value);

      if(value['timestamp'] != null) {
        final timestamp = value['timestamp'];

        if(now - timestamp > thirtyDays) {
          await _alertsRef.child(key).remove();
        }
      }
    }
  }

  Future<void> _acknowledgeAlert(String key) async {
    // 1. Mark as acknowledged
    await _alertsRef.child(key).update({
      'status': 'ack',
      'ackTimestamp': DateTime.now().millisecondsSinceEpoch,
    });

    // 2. Send live response back to patient web app
    await _alertsRef.child('$key/responses').push().set({
      'text': 'ACKNOWLEDGED',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });

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
        backgroundColor: const Color(0xFF121212), // Background Dark
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => setState(() {}),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          StreamBuilder(
            stream: _statusRef.onValue,
            builder: (context, AsyncSnapshot<DatabaseEvent> snapshot) {
              if (snapshot.hasData && snapshot.data!.snapshot.value != null) {
                final data =
                    snapshot.data!.snapshot.value as Map<dynamic, dynamic>;
                final status = PatientStatusModel.fromMap(data);
                return PatientStatusCard(status: status);
              }
              return const SizedBox.shrink();
            },
          ),
          Expanded(
            child: StreamBuilder(
              stream: _alertsRef
                  .orderByChild('timestamp')
                  .limitToLast(20)
                  .onValue,
              builder: (context, AsyncSnapshot<DatabaseEvent> snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (!snapshot.hasData ||
                    snapshot.data!.snapshot.value == null) {
                  return const Center(
                    child: Text(
                      'No active alerts',
                      style: TextStyle(color: Colors.grey),
                    ),
                  );
                }

                final data =
                    snapshot.data!.snapshot.value as Map<dynamic, dynamic>;

                // Display the recent 30 days alerts
                _deleteOldAlerts(data);

                final List<AlertModel> alerts = [];
                data.forEach((key, value) {
                  alerts.add(
                    AlertModel.fromMap(key, Map<String, dynamic>.from(value)),
                  );
                });

                alerts.sort((a, b) => b.timestamp.compareTo(a.timestamp));

                // Check for pending SOS to show overlay
                final AlertModel? pendingSos = alerts
                    .cast<AlertModel?>()
                    .firstWhere(
                      (a) => a!.commandId == 'SOS' && !a.isAck,
                      orElse: () => null,
                    );

                return Stack(
                  children: [
                    ListView.builder(
                      itemCount: alerts.length,
                      itemBuilder: (context, index) {
                        final alert = alerts[index];
                        final bool isAck = alert.isAck;
                        final String timeString =
                            "${alert.dateTime.hour}:${alert.dateTime.minute.toString().padLeft(2, '0')}";

                        Color getAlertColor(String commandId, bool isAck) {
                          if (isAck) {
                            return const Color(0xFF1E1E1E); // Surface Dark
                          }
                          final cmd = commandId.toLowerCase();
                          if (cmd == 'sos') {
                            return const Color(0xFFD32F2F); // SOS Red
                          }
                          if (['suction', 'pain', 'choking'].contains(cmd)) {
                            return const Color(0xFFFF5722); // Blood Orange
                          }
                          return const Color(0xFF29B6F6); // Sky Blue
                        }

                        return Card(
                          color: getAlertColor(alert.commandId, isAck),
                          margin: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: Colors.white10),
                          ),
                          child: ListTile(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      AlertDetailScreen(alert: alert),
                                ),
                              );
                            },
                            leading: Icon(
                              isAck
                                  ? Icons.check_circle
                                  : Icons.warning_amber_rounded,
                              color: Colors.white,
                              size: 40,
                            ),
                            title: Text(
                              alert.commandId.toUpperCase(),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                                color: Colors.white,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (alert.details.isNotEmpty)
                                  Text(
                                    alert.details,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
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
                                    onPressed: () =>
                                        _acknowledgeAlert(alert.key),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      foregroundColor: Colors.red,
                                    ),
                                    child: const Text('ACK'),
                                  ),
                          ),
                        );
                      },
                    ),
                    if (pendingSos != null)
                      SosOverlay(
                        alert: pendingSos,
                        onDismiss: () => _acknowledgeAlert(pendingSos.key),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
