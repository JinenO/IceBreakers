import { db, ref, onValue } from '../firebase-init.js';
import { AppConfig } from '../config.js';

export const SettingsService = {
    active: false,

    init() {
        if (this.active) return;
        this.active = true;

        console.log("⚙️ [SettingsService] Initializing Remote Configuration Sync...");
        const settingsRef = ref(db, 'patient_settings');

        onValue(settingsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log("⚙️ [SettingsService] Received new settings from Caregiver App:", data);

                // Dynamically override local AppConfig
                if (data.scanSpeed) {
                    AppConfig.SCAN_SPEED = parseInt(data.scanSpeed);
                    console.log(`⏱️ Setting Override: SCAN_SPEED = ${AppConfig.SCAN_SPEED}ms`);
                }

                if (data.blinkThreshold) {
                    AppConfig.BLINK_THRESHOLD = parseFloat(data.blinkThreshold);
                    console.log(`⏱️ Setting Override: BLINK_THRESHOLD = ${AppConfig.BLINK_THRESHOLD}`);
                }

                if (data.requiredBlinkTime) {
                    AppConfig.REQUIRED_BLINK_TIME = parseInt(data.requiredBlinkTime);
                    console.log(`⏱️ Setting Override: REQUIRED_BLINK_TIME = ${AppConfig.REQUIRED_BLINK_TIME}ms`);
                }

                // Let the user know the settings updated if they are using the app
                if (window.showFeedback) {
                    window.showFeedback('SETTINGS UPDATED ⚙️', 'info');
                }

                // Ideally we would want to actively restart scanning with the new speed here, 
                // but because the timers are managed inside main.js, we will just rely on the next 
                // natural stopScanning/startScanning cycle to pick up the new AppConfig.SCAN_SPEED.
            }
        });

        console.log("⚙️ [SettingsService] Remote Configuration Sync Active.");
    }
};
