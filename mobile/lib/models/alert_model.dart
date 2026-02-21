import 'package:firebase_database/firebase_database.dart';

class AlertModel {
  final String key;
  final String commandId;
  final String details;
  final String status;
  final int timestamp;
  final int? ackTimestamp;
  final Map<String, dynamic>? responses;

  AlertModel({
    required this.key,
    required this.commandId,
    required this.details,
    required this.status,
    required this.timestamp,
    this.ackTimestamp,
    this.responses,
  });

  factory AlertModel.fromSnapshot(DataSnapshot snapshot) {
    final Map<dynamic, dynamic> data = snapshot.value as Map<dynamic, dynamic>;
    return AlertModel(
      key: snapshot.key ?? '',
      commandId: data['commandId']?.toString() ?? 'ALERT',
      details: data['details']?.toString() ?? '',
      status: data['status']?.toString() ?? 'pending',
      timestamp:
          data['timestamp'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      ackTimestamp: data['ackTimestamp'] as int?,
      responses: data['responses'] != null
          ? Map<String, dynamic>.from(data['responses'])
          : null,
    );
  }

  factory AlertModel.fromMap(String key, Map<dynamic, dynamic> data) {
    return AlertModel(
      key: key,
      commandId: data['commandId']?.toString() ?? 'ALERT',
      details: data['details']?.toString() ?? '',
      status: data['status']?.toString() ?? 'pending',
      timestamp:
          data['timestamp'] as int? ?? DateTime.now().millisecondsSinceEpoch,
      ackTimestamp: data['ackTimestamp'] as int?,
      responses: data['responses'] != null
          ? Map<String, dynamic>.from(data['responses'])
          : null,
    );
  }

  bool get isAck => status == 'ack';

  DateTime get dateTime => DateTime.fromMillisecondsSinceEpoch(timestamp);
  DateTime? get ackDateTime => ackTimestamp != null
      ? DateTime.fromMillisecondsSinceEpoch(ackTimestamp!)
      : null;
}
