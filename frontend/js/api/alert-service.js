/* frontend/js/api/alert-service.js */
import { db } from './firebase-config.js';
import { ref, push, set, onValue, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export const AlertService = {
    // 1. Send simple commands (Roll, Head, Legs)
    // Returns a Promise to simulate a network request
    async sendSimpleAlert(commandId, details = '') {
        const alertsRef = ref(db, 'alerts');
        const newAlertRef = push(alertsRef);

        console.log(`📡 [API] Sending Alert: ${commandId} (${details})`);

        return set(newAlertRef, {
            command: commandId,
            details: details,
            status: 'pending',
            timestamp: serverTimestamp()
        });
    },

    // 2. Send synchronous requests (Temp, Itchy)
    // This requires entering "waiting mode"
    async requestCaregiverAssist(commandId) {
        const alertsRef = ref(db, 'alerts');
        const newAlertRef = push(alertsRef);

        console.log(`📡 [API] Requesting Assistance for: ${commandId}`);
        console.log('⏳ [API] Waiting for Caregiver App response...');

        // Write the request to Firebase
        await set(newAlertRef, {
            command: commandId,
            status: 'waiting',
            timestamp: serverTimestamp()
        });

        // Return a promise that resolves when the caregiver app updates the status
        return new Promise((resolve) => {
            const statusRef = ref(db, `alerts/${newAlertRef.key}/status`);
            onValue(statusRef, (snapshot) => {
                if(snapshot.val() === 'ready_to_interact') {
                    resolve({ status: 'ready_to_interact' });
                }
            });
        })
    }
};
