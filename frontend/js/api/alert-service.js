import { db, ref, onValue, push, set } from '../firebase-init.js';
import { showFeedback } from '../modules/ui-utils.js';

export const AlertService = {
  activeListeners: {},

  // Listener for caregiver responses
  listenForResponses(alertId) {
    if (this.activeListeners[alertId]) return;

    console.log(`📡 [API] Listening for responses on alert: ${alertId}`);
    const responsesRef = ref(db, `alerts/${alertId}/responses`);

    // Store the listener so we can detach it later (if needed)
    this.activeListeners[alertId] = onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Get the latest response
        const keys = Object.keys(data);
        const lastKey = keys[keys.length - 1];
        const latestResponse = data[lastKey];

        console.log(`💬 [API] Received Caregiver Response: ${latestResponse.text}`);

        // Show the feedback to the patient
        if (window.showFeedback) {
          window.showFeedback(latestResponse.text.toUpperCase(), 'info');
        } else {
          showFeedback(latestResponse.text.toUpperCase(), 'info');
        }
      }
    });
  },

  async sendSimpleAlert(commandId, details = '') {
    try {
      console.log(`🚀 [API] Sending Simple Alert: ${commandId}`);
      const alertsRef = ref(db, 'alerts');
      const newAlertRef = push(alertsRef);

      await set(newAlertRef, {
        commandId: commandId,
        details: details,
        status: 'pending',
        timestamp: Date.now()
      });

      const alertId = newAlertRef.key;
      this.listenForResponses(alertId);

      if (window.showFeedback) window.showFeedback('SENT ✅', 'success');
      return { success: true, alertId: alertId };
    } catch (error) {
      console.error("❌ Alert Sync Failed:", error);
      if (window.showFeedback) window.showFeedback('SYNC FAILED ❌', 'error');
      return { error: error.message };
    }
  },

  async requestCaregiverAssist(commandId) {
    try {
      console.log(`🚀 [API] Requesting Assist: ${commandId}`);
      const alertsRef = ref(db, 'alerts');
      const newAlertRef = push(alertsRef);

      await set(newAlertRef, {
        commandId: commandId,
        status: 'waiting',
        timestamp: Date.now()
      });

      const alertId = newAlertRef.key;
      this.listenForResponses(alertId);
      return { success: true, alertId: alertId };
    } catch (error) {
      console.error("❌ Request Failed:", error);
      return { error: error.message };
    }
  },

  async toggleRoomLights(turnOn) {
    try {
      console.log(`💡 [IoT] Toggling Room Lights to: ${turnOn ? 'ON' : 'OFF'}`);
      const lightRef = ref(db, 'iot/room_lights');
      await set(lightRef, {
        active: turnOn,
        brightness: turnOn ? 100 : 0,
        timestamp: Date.now()
      });
      return { success: true };
    } catch (error) {
      console.error("❌ IoT Light Toggle Failed:", error);
      return { error: error.message };
    }
  }
};
