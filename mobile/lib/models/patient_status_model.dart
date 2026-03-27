class PatientStatusModel {
  final bool isOnline;
  final double batteryLevel;
  final bool isCharging;
  final bool eyeTrackerActive;
  final bool isResting;
  final int lastSeen;

  final String stressLevel;
  final String focalQuadrant;

  PatientStatusModel({
    required this.isOnline,
    required this.batteryLevel,
    required this.isCharging,
    required this.eyeTrackerActive,
    required this.isResting,
    required this.lastSeen,
    required this.stressLevel,
    required this.focalQuadrant,
  });

  factory PatientStatusModel.fromMap(Map<dynamic, dynamic> data) {
    return PatientStatusModel(
      isOnline: data['isOnline'] as bool? ?? false,
      batteryLevel:
          (data['batteryLevel'] as num?)?.toDouble().roundToDouble() ?? 0.0,
      isCharging: data['isCharging'] as bool? ?? false,
      eyeTrackerActive: data['eyeTrackerActive'] as bool? ?? false,
      isResting: data['isResting'] as bool? ?? false,
      lastSeen: data['lastSeen'] as int? ?? 0,
      stressLevel: data['stressLevel'] as String? ?? 'low',
      focalQuadrant: data['focalQuadrant'] as String? ?? 'center',
    );
  }

  DateTime get lastSeenDate => DateTime.fromMillisecondsSinceEpoch(lastSeen);

  bool get currentlyOnline {
    // If not seen in the last 2 minutes, consider offline
    final diff = DateTime.now().millisecondsSinceEpoch - lastSeen;
    return isOnline && diff < 120000;
  }
}
