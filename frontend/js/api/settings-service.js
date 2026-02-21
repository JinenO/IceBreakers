import { db, ref, onValue, set } from '../firebase-init.js';
import { AppConfig } from '../config.js';

export const SettingsService = {
    active: false,
    settingsRef: null,

    init() {
        if (this.active) return;
        this.active = true;

        console.log("⚙️ [SettingsService] Initializing Remote Configuration Sync...");
        this.settingsRef = ref(db, 'patient_settings');

        // Listen for Caregiver App changes
        onValue(this.settingsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                console.log("⚙️ [SettingsService] Received new settings:", data);
                if (data.scanSpeed) AppConfig.SCAN_SPEED = parseInt(data.scanSpeed);
                if (data.blinkThreshold) AppConfig.BLINK_THRESHOLD = parseFloat(data.blinkThreshold);
                if (data.requiredBlinkTime) AppConfig.REQUIRED_BLINK_TIME = parseInt(data.requiredBlinkTime);

                this.updateUI(); // Sync the sliders strictly if the modal is open
            }
        });

        this.initUI();
        console.log("⚙️ [SettingsService] Remote Configuration Sync Active.");
    },

    initUI() {
        const btn = document.getElementById('web-settings-btn');
        const modal = document.getElementById('web-settings-modal');
        const closeBtn = document.getElementById('close-settings-btn');

        if (!btn || !modal) return;

        const scanSlider = document.getElementById('set-scan-slider');
        const holdSlider = document.getElementById('set-hold-slider');
        const threshSlider = document.getElementById('set-thresh-slider');

        const scanVal = document.getElementById('set-scan-val');
        const holdVal = document.getElementById('set-hold-val');
        const threshVal = document.getElementById('set-thresh-val');

        // Open Modal
        btn.addEventListener('click', () => {
            this.updateUI(); // load current config
            modal.classList.remove('hidden');
        });

        // Live slider updates
        scanSlider.addEventListener('input', (e) => scanVal.innerText = e.target.value);
        holdSlider.addEventListener('input', (e) => holdVal.innerText = e.target.value);
        threshSlider.addEventListener('input', (e) => threshVal.innerText = e.target.value);

        // Save & Close
        closeBtn.addEventListener('click', () => {
            // Update local config
            AppConfig.SCAN_SPEED = parseInt(scanSlider.value);
            AppConfig.REQUIRED_BLINK_TIME = parseInt(holdSlider.value);
            AppConfig.BLINK_THRESHOLD = parseFloat(threshSlider.value);

            // Hide modal
            modal.classList.add('hidden');

            // Send to Firebase so mobile picks it up
            if (this.settingsRef) {
                set(this.settingsRef, {
                    scanSpeed: AppConfig.SCAN_SPEED,
                    requiredBlinkTime: AppConfig.REQUIRED_BLINK_TIME,
                    blinkThreshold: AppConfig.BLINK_THRESHOLD
                }).catch(err => console.error("Error saving settings to Firebase:", err));
            }

            console.log("⚙️ Settings Saved & Synced Locally:", AppConfig);
            if (window.showFeedback) window.showFeedback('SETTINGS SAVED ✅', 'success');
        });
    },

    updateUI() {
        const scanSlider = document.getElementById('set-scan-slider');
        const holdSlider = document.getElementById('set-hold-slider');
        const threshSlider = document.getElementById('set-thresh-slider');

        if (scanSlider) {
            scanSlider.value = AppConfig.SCAN_SPEED;
            document.getElementById('set-scan-val').innerText = AppConfig.SCAN_SPEED;
        }
        if (holdSlider) {
            holdSlider.value = AppConfig.REQUIRED_BLINK_TIME;
            document.getElementById('set-hold-val').innerText = AppConfig.REQUIRED_BLINK_TIME;
        }
        if (threshSlider) {
            threshSlider.value = AppConfig.BLINK_THRESHOLD;
            document.getElementById('set-thresh-val').innerText = AppConfig.BLINK_THRESHOLD;
        }
    }
};
