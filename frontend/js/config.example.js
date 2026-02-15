/* frontend/js/config.example.js */
// Configuration Template
// Copy this file as config.js and insert your real API keys.

export const AppConfig = {
    SCAN_SPEED: 2500,
    BLINK_THRESHOLD: 0.012,
    REQUIRED_BLINK_TIME: 1000,
    SOUND_ON: true,
    // Get it from: https://aistudio.google.com/
    GEMINI_API_KEY: "PASTE_YOUR_GEMINI_KEY_HERE"
};

// YouTube API Key — Get it from https://console.cloud.google.com
// Steps:
// 1. Create a new project
// 2. Enable "YouTube Data API v3"
// 3. Create an API Key (Application type: Web browser)
// 4. Paste the key below (DO NOT commit your real key to GitHub)
export const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY_HERE";
