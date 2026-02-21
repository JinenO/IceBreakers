import 'package:flutter/material.dart';
import '../models/alert_model.dart';

class SosOverlay extends StatelessWidget {
  final AlertModel alert;
  final VoidCallback onDismiss;

  const SosOverlay({super.key, required this.alert, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.red.withOpacity(0.9),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.warning_amber_rounded,
              color: Colors.white,
              size: 150,
            ),
            const SizedBox(height: 20),
            const Text(
              'EMERGENCY SOS',
              style: TextStyle(
                color: Colors.white,
                fontSize: 40,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              alert.details.toUpperCase(),
              style: const TextStyle(color: Colors.white70, fontSize: 20),
            ),
            const SizedBox(height: 60),
            ElevatedButton(
              onPressed: onDismiss,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(
                  horizontal: 50,
                  vertical: 20,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'ACKNOWLEDGE NOW',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
