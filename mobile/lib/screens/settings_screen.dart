import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../models/patient_status_model.dart';
import 'package:firebase_database/firebase_database.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SettingsProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Caregiver Settings'),
        backgroundColor: Theme.of(context).colorScheme.surface,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildHealthMonitor(context),
          const SizedBox(height: 24),
          _buildSectionHeader(
            context,
            'Patient Browser Configuration (Live Sync)',
          ),
          _buildRemoteSliders(context, provider),
          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Alert Criticality'),
          _buildCriticalityToggles(context, provider),
          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Emergency Contacts'),
          _buildEmergencyContacts(context, provider),
          const SizedBox(height: 24),
          _buildSectionHeader(context, 'Caregiver App Preferences'),
          _buildLocalPreferences(context, provider),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildHealthMonitor(BuildContext context) {
    final statusRef = FirebaseDatabase.instance.ref('patient_status');

    return StreamBuilder(
      stream: statusRef.onValue,
      builder: (context, AsyncSnapshot<DatabaseEvent> snapshot) {
        bool isActive = false;
        double batteryLevel = 0.0;

        if (snapshot.hasData && snapshot.data!.snapshot.value != null) {
          final data = snapshot.data!.snapshot.value as Map<dynamic, dynamic>;
          final status = PatientStatusModel.fromMap(data);
          isActive = status.eyeTrackerActive;
          batteryLevel = status.batteryLevel.toDouble();
        }

        return Card(
          color: Theme.of(context).colorScheme.surface,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Device Health',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Icon(
                      isActive ? Icons.videocam : Icons.videocam_off,
                      color: isActive ? Colors.green : Colors.red,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(
                      Icons.battery_charging_full,
                      size: 20,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Battery Level: ${(batteryLevel * 100).toStringAsFixed(0)}%',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.visibility, size: 20, color: Colors.grey[400]),
                    const SizedBox(width: 8),
                    Text(
                      'Scanner Status: ${isActive ? 'Linked' : 'Disconnected'}',
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRemoteSliders(BuildContext context, SettingsProvider provider) {
    return Card(
      color: Theme.of(context).colorScheme.surface,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _buildSliderRow(
              context,
              'Scanner Speed (${provider.scanSpeed}ms)',
              provider.scanSpeed.toDouble(),
              1000.0,
              5000.0,
              (val) => provider.setScanSpeed(val.toInt()),
            ),
            const Divider(),
            _buildSliderRow(
              context,
              'Required Blink Time (${provider.requiredBlinkTime}ms)',
              provider.requiredBlinkTime.toDouble(),
              500.0,
              3000.0,
              (val) => provider.setRequiredBlinkTime(val.toInt()),
              helpText:
                  'Time patient must hold eyes closed to trigger a click.',
            ),
            const Divider(),
            _buildSliderRow(
              context,
              'Blink Sensitivity (${provider.blinkThreshold.toStringAsFixed(3)})',
              provider.blinkThreshold,
              0.005,
              0.025,
              (val) => provider.setBlinkThreshold(val),
              helpText: 'Lower if patient struggles to fully close eyes.',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSliderRow(
    BuildContext context,
    String label,
    double value,
    double min,
    double max,
    Function(double) onChanged, {
    String? helpText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        if (helpText != null)
          Text(
            helpText,
            style: TextStyle(fontSize: 12, color: Colors.grey[400]),
          ),
        Slider(
          value: value,
          min: min,
          max: max,
          activeColor: Theme.of(context).colorScheme.primary,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildCriticalityToggles(
    BuildContext context,
    SettingsProvider provider,
  ) {
    return Card(
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('SOS'),
            subtitle: const Text(
              'Override Do-Not-Disturb and play loud alarm siren.',
              style: TextStyle(fontSize: 12),
            ),
            value: provider.criticalSOS,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (val) => provider.toggleCriticalSOS(val),
          ),
          SwitchListTile(
            title: const Text('Suction / Breathing'),
            value: provider.criticalSuction,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (val) => provider.toggleCriticalSuction(val),
          ),
          SwitchListTile(
            title: const Text('WaterRequest'),
            value: provider.criticalWater,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (val) => provider.toggleCriticalWater(val),
          ),
          SwitchListTile(
            title: const Text('Food Request'),
            value: provider.criticalFood,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (val) => provider.toggleCriticalFood(val),
          ),
        ],
      ),
    );
  }

  Widget _buildEmergencyContacts(
    BuildContext context,
    SettingsProvider provider,
  ) {
    final contacts = provider.emergencyContacts;
    return Card(
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        children: [
          if (contacts.isEmpty)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Text(
                "No emergency contacts saved.",
                style: TextStyle(color: Colors.grey),
              ),
            ),
          ...contacts.map(
            (contact) => ListTile(
              leading: const Icon(Icons.phone),
              title: Text(contact),
              trailing: IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () => provider.removeEmergencyContact(contact),
              ),
            ),
          ),
          TextButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Add Contact'),
            onPressed: () {
              // Simple dialog to add contact
              String newContact = '';
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Add Contact'),
                  content: TextField(
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      hintText: '+1 234 567 8900',
                    ),
                    onChanged: (val) => newContact = val,
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        if (newContact.isNotEmpty) {
                          provider.addEmergencyContact(newContact);
                        }
                        Navigator.pop(context);
                      },
                      child: const Text('Add'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLocalPreferences(
    BuildContext context,
    SettingsProvider provider,
  ) {
    return Card(
      color: Theme.of(context).colorScheme.surface,
      child: Column(
        children: [
          SwitchListTile(
            title: const Text('High Contrast Mode'),
            subtitle: const Text(
              'Yellow/Black UI for visibility',
              style: TextStyle(fontSize: 12),
            ),
            value: provider.highContrastMode,
            activeColor: Colors.yellow,
            onChanged: (val) => provider.toggleHighContrast(val),
          ),
          SwitchListTile(
            title: const Text('Large Text Mode'),
            value: provider.largeTextMode,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (val) => provider.toggleLargeText(val),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Auto-Clear Alerts After:'),
                DropdownButton<int>(
                  value: provider.autoClearHours,
                  dropdownColor: Theme.of(context).colorScheme.surface,
                  items: const [
                    DropdownMenuItem(value: 1, child: Text('1 Hour')),
                    DropdownMenuItem(value: 6, child: Text('6 Hours')),
                    DropdownMenuItem(value: 24, child: Text('24 Hours')),
                  ],
                  onChanged: (val) {
                    if (val != null) provider.setAutoClearHours(val);
                  },
                ),
              ],
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: _buildSliderRow(
              context,
              'Low Battery Warning (<${provider.batteryWarningThreshold.toInt()}%)',
              provider.batteryWarningThreshold,
              5.0,
              30.0,
              (val) => provider.setBatteryWarningThreshold(val),
            ),
          ),
        ],
      ),
    );
  }
}
