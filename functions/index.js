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
const twilio = require('twilio');

// Initialize the app with the Admin SDK
admin.initializeApp();

// Twilio Setup (Using environment variables or placeholders for demo)
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID || "AC_PLACEHOLDER_SID",
    process.env.TWILIO_AUTH_TOKEN || "PLACEHOLDER_TOKEN"
);

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
                title: commandId === 'SOS' ? '🚨 EMERGENCY SOS!' : '⚠️ IRIS FLOW',
                body: commandId === 'SOS'
                    ? 'Patient needs immediate assistance!'
                    : (details || `New Request: ${commandId.toUpperCase()}`),
            },
            data: {
                alertId: alertId,
                commandId: commandId,
                type: type,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: commandId === 'SOS' ? 'sos_channel' : 'high_importance_channel',
                    priority: 'high',
                    sticky: commandId === 'SOS',
                    visibility: 'public'
                }
            },
            apns: {
                headers: {
                    'apns-priority': commandId === 'SOS' ? '10' : '5',
                    'apns-expiration': '0' // Try to deliver immediately, don't store
                },
                payload: {
                    aps: {
                        sound: 'default',
                        critical: commandId === 'SOS' ? 1 : 0
                    }
                }
            },
            topic: 'caregivers'
        };

        try {
            const response = await admin.messaging().send(payload);
            console.log("Successfully sent message (Tier 1):", response);

            // TIERED ESCALATION FOR SOS
            if (commandId === 'SOS') {
                // Tier 2: 15 Seconds Unresponsive -> Smart Home / IoT Warning
                setTimeout(async () => {
                    try {
                        const alertSnap = await admin.database().ref(`alerts/${alertId}`).once('value');
                        const currentAlert = alertSnap.val();
                        
                        if (currentAlert && currentAlert.status !== 'acknowledged') {
                            console.log(`[Tier 2] Alert ${alertId} unacknowledged after 15s. Triggering IoT Linkage.`);
                            await admin.database().ref('iot/state').set({
                                device: 'smart_bulb',
                                light: 'red_flash',
                                active: true,
                                timestamp: Date.now()
                            });
                        }
                    } catch (e) {
                        console.error("[Tier 2] IoT Linkage failed:", e);
                    }
                }, 15000);

                // Tier 3: 30 Seconds Unresponsive -> Third-Party SMS (Twilio)
                setTimeout(async () => {
                    try {
                        const alertSnap = await admin.database().ref(`alerts/${alertId}`).once('value');
                        const currentAlert = alertSnap.val();
                        
                        if (currentAlert && currentAlert.status !== 'acknowledged') {
                            console.log(`[Tier 3] Alert ${alertId} unacknowledged after 30s. Triggering Twilio SMS.`);
                            
                            try {
                                const message = await twilioClient.messages.create({
                                    body: "URGENT SOS: Patient requires immediate assistance and Caregiver has not responded to the App alert!",
                                    from: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
                                    to: process.env.EMERGENCY_CONTACT_PHONE || "+1987654321" 
                                });
                                console.log("[Tier 3] Twilio SMS sent with SID: ", message.sid);
                                
                                await admin.database().ref(`alerts/${alertId}`).update({
                                    escalated: true,
                                    escalationTier: 3,
                                    escalationTime: Date.now()
                                });
                            } catch (twilioErr) {
                                console.error("[Tier 3] Failed to send Twilio SMS:", twilioErr.message);
                            }
                        }
                    } catch (e) {
                        console.error("[Tier 3] Twilio check failed:", e);
                    }
                }, 30000);
            }

        } catch (error) {
            console.log("Error sending message:", error);
        }
    });
