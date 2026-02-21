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
                isOnline ? 'ONLINE' : 'OFFLINE',
                style: TextStyle(
                  color: isOnline
                      ? const Color(0xFF64FFDA)
                      : Colors.grey, // Teal
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
                '${status.batteryLevel}%',
                'BATTERY',
                status.batteryLevel < 20
                    ? const Color(0xFFFFC107)
                    : const Color(0xFF64FFDA), // Amber or Teal
              ),
              _buildMetric(
                context,
                Icons.remove_red_eye_rounded,
                status.eyeTrackerActive ? 'ACTIVE' : 'IDLE',
                'EYE TRACKER',
                status.eyeTrackerActive ? const Color(0xFF64FFDA) : Colors.grey,
              ),
              _buildMetric(
                context,
                Icons.history,
                _formatTime(status.lastSeenDate),
                'LAST SEEN',
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

  String _formatTime(DateTime dt) {
    return "${dt.hour}:${dt.minute.toString().padLeft(2, '0')}";
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
