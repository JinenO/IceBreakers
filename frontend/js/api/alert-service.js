/* frontend/js/api/alert-service.js */
import { db, ref, push, set, onValue, update } from '../firebase-init.js';

export const AlertService = {
    // 1. Send simple command (Roll, Head, Legs)
    async sendSimpleAlert(commandId, details = '') {
        console.log(`📡 [API] Sending Alert: ${commandId} (${details})`);

        try {
            const alertsRef = ref(db, 'alerts');
            const newAlertRef = push(alertsRef);
            await set(newAlertRef, {
                commandId,
                details,
                timestamp: Date.now(),
                status: 'pending', // pending, ack, completed
                type: 'simple'
            });
            console.log('✅ [API] Alert Sent to Firebase!');
            return { status: 'success' };
        } catch (error) {
            console.error('❌ [API] Firebase Error:', error);
            // Fallback or re-throw
            return { status: 'error', error };
        }
    },

    // 2. Request assistance (Temp, Itchy) - enters waiting mode
    async requestCaregiverAssist(commandId) {
        console.log(`📡 [API] Requesting Assistance for: ${commandId}`);
        console.log('⏳ [API] Waiting for Caregiver App response...');

        return new Promise((resolve, reject) => {
            try {
                const alertsRef = ref(db, 'alerts');
                const newAlertRef = push(alertsRef);
                const alertId = newAlertRef.key;

                set(newAlertRef, {
                    commandId,
                    details: 'Requesting Assistance',
                    timestamp: Date.now(),
                    status: 'pending',
                    type: 'sync_request'
                });

                // Listen for changes to this specific alert
                const specificAlertRef = ref(db, `alerts/${alertId}`);
                const unsubscribe = onValue(specificAlertRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data && data.status === 'ack') {
                        // Caregiver acknowledged
                        console.log(`📱 [App] Caregiver acknowledged ${commandId}`);
                        // unsubscribe(); // Optional: stop listening if we only care about ack
                        // resolve({ status: 'ready_to_interact' });
                    }
                    if (data && data.status === 'ready_to_interact') {
                        console.log(`📱 [App] Caregiver ready for ${commandId}`);
                        resolve({ status: 'ready_to_interact' });
                    }
                });

                // Set a timeout just in case (optional, but good for UX)
                // setTimeout(() => {
                //    resolve({ status: 'timeout' }); // Or handle timeout logic
                // }, 60000);

            } catch (error) {
                console.error('❌ [API] Firebase Error:', error);
                reject(error);
            }
        });
    }
};
