import 'package:flutter/material.dart';
import '../models/patient_status_model.dart';

class PatientStatusCard extends StatelessWidget {
  final PatientStatusModel status;

  const PatientStatusCard({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final bool isOnline = status.currentlyOnline;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E), // Surface Dark
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  HeartbeatIndicator(isOnline: isOnline),
                  const SizedBox(width: 10),
                  const Text(
                    'PATIENT STATUS',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.1,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
              Text(
                isOnline
                    ? (status.isResting ? 'RESTING' : 'ONLINE')
                    : 'OFFLINE',
                style: TextStyle(
                  color: isOnline
                      ? (status.isResting
                            ? Colors.orangeAccent
                            : const Color(0xFF64FFDA))
                      : Colors.grey,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 25),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildMetric(
                context,
                Icons.battery_charging_full,
                '${status.batteryLevel.toInt()}%',
                'BATTERY',
                status.batteryLevel < 20
                    ? const Color(0xFFFFC107)
                    : const Color(0xFF64FFDA),
              ),
              _buildMetric(
                context,
                status.isResting
                    ? Icons.nights_stay_rounded
                    : Icons.remove_red_eye_rounded,
                status.isResting ? 'REST MODE' : 'SCANNERS',
                'MODE',
                status.isResting
                    ? Colors.orangeAccent
                    : const Color(0xFF64FFDA),
              ),
              _buildMetric(
                context,
                status.eyeTrackerActive
                    ? Icons.visibility
                    : Icons.visibility_off,
                status.eyeTrackerActive ? 'TRACKING' : 'IDLE',
                'EYE ENGINE',
                status.eyeTrackerActive ? const Color(0xFF64FFDA) : Colors.grey,
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white10),
          const SizedBox(height: 15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildMetric(
                context,
                Icons.psychology,
                status.stressLevel.toUpperCase(),
                'STRESS LVL',
                status.stressLevel == 'high'
                    ? Colors.redAccent
                    : (status.stressLevel == 'medium'
                        ? Colors.orangeAccent
                        : const Color(0xFF64FFDA)),
              ),
              _buildMetric(
                context,
                Icons.track_changes,
                status.focalQuadrant.toUpperCase(),
                'GAZE FOCUS',
                const Color(0xFF64FFDA),
              ),
              _buildMetric(
                context,
                Icons.history,
                'NORMAL', // Placeholder for "Trend"
                'TREND',
                const Color(0xFF64FFDA),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetric(
    BuildContext context,
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.white38, fontSize: 10),
        ),
      ],
    );
  }
}

class HeartbeatIndicator extends StatefulWidget {
  final bool isOnline;
  const HeartbeatIndicator({super.key, required this.isOnline});

  @override
  _HeartbeatIndicatorState createState() => _HeartbeatIndicatorState();
}

class _HeartbeatIndicatorState extends State<HeartbeatIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    );
    _animation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    if (widget.isOnline) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(HeartbeatIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isOnline && !oldWidget.isOnline) {
      _controller.repeat(reverse: true);
    } else if (!widget.isOnline && oldWidget.isOnline) {
      _controller.stop();
      _controller.value = 0.5;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: widget.isOnline ? const Color(0xFF64FFDA) : Colors.grey,
            shape: BoxShape.circle,
            boxShadow: widget.isOnline
                ? [
                    BoxShadow(
                      color: const Color(
                        0xFF64FFDA,
                      ).withOpacity(0.5 * _animation.value),
                      blurRadius: 10 * _animation.value,
                      spreadRadius: 3 * _animation.value,
                    ),
                  ]
                : null,
          ),
        );
      },
    );
  }
}
