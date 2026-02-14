/* frontend/js/api/alert-service.js */

export const AlertService = {
    // 1. Send simple commands (Roll, Head, Legs)
    // Returns a Promise to simulate a network request
    async sendSimpleAlert(commandId, details = '') {
        console.log(`📡 [API] Sending Alert: ${commandId} (${details})`);

        // Simulate network delay of 0.5 seconds
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('✅ [API] Alert Sent Successfully!');
                resolve({ status: 'success' });
            }, 500);
        });
    },

    // 2. Send synchronous requests (Temp, Itchy)
    // This requires entering "waiting mode"
    async requestCaregiverAssist(commandId) {
        console.log(`📡 [API] Requesting Assistance for: ${commandId}`);
        console.log('⏳ [API] Waiting for Caregiver App response...');

        // Here we use a "simulator":
        // In a real project, this would listen to WebSocket
        // In dev mode, we set a 3-second auto reply, or you can trigger it manually
        return new Promise((resolve) => {
            // Simulation: after 3 seconds, the caregiver clicks "Handle Request" on the phone
            setTimeout(() => {
                console.log(`📱 [Mock App] Caregiver clicked "Handle ${commandId}"`);
                resolve({ status: 'ready_to_interact' });
            }, 3000);
        });
    }
};
