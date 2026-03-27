# IRIS FLOW: Enhancement Overview

This document summarizes the new "Explosive" features added to IRIS FLOW for the competition final.

### 1. Quadrant-Aware Adaptive Scanning
*   **How it works**: Uses MediaPipe to track head pose (Yaw/Pitch) and identifies which of 4 screen quadrants the user is facing.
*   **Proactive Scan**: Boosts scan speed (Reduces interval) for items in that quadrant.
*   **Feedback**: Subtle shadow glow on the focal quadrant card.

### 2. Blink Sentiment Analysis
*   **How it works**: Monitors "Micro-blinks" (< 150ms) to detect restlessness and stress.
*   **Metrics**: Calculates a "Well-being Index" (Low/Medium/High Stress).
*   **Cloud Sync**: Status is pushed to Firebase for real-time caregiver monitoring.

### 3. ICU Night Mode
*   **How it works**: Ambient light sensor $(< 15)$ triggers an optimized interface.
*   **Colors**: High-contrast Reds and Blacks.
*   **Purpose**: Melatonin preservation and night-vision protection for both patient and caregiver.
