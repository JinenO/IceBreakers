import { db, ref, update } from '../firebase-init.js';

export const StatusService = {
    /**
     * Update the patient's real-time status in Firebase.
     * Node: /patient_status
     */
    async updateStatus(statusData) {
        const statusRef = ref(db, 'patient_status');
        const dataWithTimestamp = {
            ...statusData,
            lastSeen: Date.now()
        };

        try {
            await update(statusRef, dataWithTimestamp);
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    },

    /**
     * Start a background heartbeat to keep the "Online" status fresh.
     */
    startHeartbeat() {
        // Initial update
        this.pushCurrentMetrics();

        // Heartbeat every 60 seconds
        setInterval(() => {
            this.pushCurrentMetrics();
        }, 60000);
    },

    async pushCurrentMetrics() {
        const metrics = {
            isOnline: true,
            eyeTrackerActive: true // This will be updated by eye-engine events
        };

        // Try to get battery level
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                metrics.batteryLevel = Math.floor(battery.level * 100);
                metrics.isCharging = battery.charging;
            }
        } catch (e) {
            console.warn('Battery API not available');
        }

        this.updateStatus(metrics);
    }
};
