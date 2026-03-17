import 'package:firebase_database/firebase_database.dart';
import 'package:flutter/material.dart';
import '../models/alert_model.dart';

class AlertDetailScreen extends StatelessWidget {
  final AlertModel alert;
  const AlertDetailScreen({super.key, required this.alert});

  Future<void> _sendResponse(BuildContext context, String responseText) async {
    final DatabaseReference ref = FirebaseDatabase.instance.ref(
      'alerts/${alert.key}/responses',
    );
    await ref.push().set({
      'text': responseText,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });

    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Sent: $responseText')));
    }
  }

  Future<void> _acknowledgeAlert(BuildContext context) async {
    final DatabaseReference ref = FirebaseDatabase.instance.ref('alerts/${alert.key}');
    await ref.update({
      'status': 'ack',
      'ackTimestamp': DateTime.now().millisecondsSinceEpoch,
    });

    await _sendResponse(context, 'ACKNOWLEDGED');

    if (context.mounted) {
      Navigator.pop(context); // Go back to home screen
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(alert.commandId.toUpperCase()),
        backgroundColor: alert.isAck
            ? const Color(0xFF2D3748)
            : const Color(0xFFC53030),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoCard(),
            const SizedBox(height: 30),
            if (!alert.isAck) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _acknowledgeAlert(context),
                  icon: const Icon(Icons.check_circle, size: 24),
                  label: const Text(
                    'ACKNOWLEDGE ALERT',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 30),
            ],
            const Text(
              'QUICK RESPONSES',
              style: TextStyle(
                color: Colors.grey,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 15),
            _buildQuickActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard() {
    return Card(
      color: const Color(0xFF2D3748),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'STATUS',
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: alert.isAck ? Colors.teal : Colors.red,
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    alert.status.toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 15),
            Text(
              alert.details.isNotEmpty
                  ? alert.details
                  : 'No additional details provided.',
              style: const TextStyle(fontSize: 18, color: Colors.white),
            ),
            const Divider(height: 40, color: Colors.white10),
            _buildDetailRow(
              Icons.access_time,
              'Alert Triggered',
              _formatDate(alert.dateTime),
            ),
            if (alert.isAck && alert.ackDateTime != null)
              _buildDetailRow(
                Icons.check_circle_outline,
                'Acknowledged',
                _formatDate(alert.ackDateTime!),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.teal),
          const SizedBox(width: 10),
          Text('$label: ', style: const TextStyle(color: Colors.white54)),
          Text(value, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      {'label': 'On my way!', 'icon': Icons.directions_run},
      {'label': 'ETA: 5 mins', 'icon': Icons.timer},
      {'label': 'ETA: 10 mins', 'icon': Icons.timer_outlined},
      {'label': 'I am busy', 'icon': Icons.block},
      {'label': 'Need backup!', 'icon': Icons.group_add},
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: actions.map((action) {
        return ElevatedButton.icon(
          onPressed: () => _sendResponse(context, action['label'] as String),
          icon: Icon(action['icon'] as IconData, size: 18),
          label: Text(action['label'] as String),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.teal.withOpacity(0.1),
            foregroundColor: Colors.teal,
            side: const BorderSide(color: Colors.teal),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        );
      }).toList(),
    );
  }

  String _formatDate(DateTime dt) {
    return "${dt.hour}:${dt.minute.toString().padLeft(2, '0')} on ${dt.day}/${dt.month}";
  }
}
