/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onValueCreated } = require("firebase-functions/v2/database");
const admin = require('firebase-admin');

// Initialize the app with the Admin SDK
admin.initializeApp();

/**
 * Triggered when a new alert is created in Realtime Database.
 * Path: /alerts/{alertId}
 */
exports.sendAlertNotification = onValueCreated(
    {
        ref: "/alerts/{alertId}",
        instance: "irisflow-c7dba-default-rtdb",
        region: "asia-southeast1"
    },
    async (event) => {
        const alertData = event.data.val();
        const alertId = event.params.alertId;

        if (!alertData) {
            console.log("No data for alert:", alertId);
            return;
        }

        console.log("Processing new alert:", alertId, alertData);

        const commandId = alertData.commandId || "Unknown";
        const details = alertData.details || "";
        const type = alertData.type || "simple";

        // Notification payload
        const payload = {
            notification: {
                title: '⚠️ Patient Alert!',
                body: `Request: ${commandId} ${details ? `(${details})` : ''}`,
            },
            data: {
                alertId: alertId,
                commandId: commandId,
                type: type,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            topic: 'caregivers' // Send to all subscribed caregivers
        };

        try {
            const response = await admin.messaging().send(payload);
            console.log("Successfully sent message:", response);

            // Update the alert status to 'notified' if needed
            // await event.data.ref.update({ status: 'notified' });

        } catch (error) {
            console.log("Error sending message:", error);
        }
    });
