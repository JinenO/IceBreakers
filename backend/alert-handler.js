import { db } from "./firebase-admin.js";

export async function sendSimpleAlert(commandId, datails='') {
  const newRef = db.ref('alerts').push();
  await newRef.set({
    commandId: commandId,
    details: datails,
    status: 'pending',
    timestamp: Date.now()
  });

  return { success: true };
}

export async function requestCaregiverAssist(commandId) {
  const newRef = db.ref('alerts').push();

  await newRef.set({
    commandId: commandId,
    status: 'waiting',
    timestamp: Date.now()
  });

  return { alertId: newRef.key };
}