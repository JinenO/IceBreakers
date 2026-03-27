# IRIS FLOW: Research Evidence for Competition

### 1. Cost Comparison (Accessibility)
*   **Traditional Eye Trackers (e.g., Tobii Dynavox):** Typically cost between **$5,000 and $20,000** for a full system. Most medical-grade systems require insurance funding and specialized hardware.
*   **IRIS FLOW:** Uses a standard built-in webcam ($0 additional hardware cost). This makes it accessible to low-resource settings and developing nations.

### 2. ICU Challenges (Environmental Robustness)
*   **Lighting**: Clinical eye trackers often use Near-Infrared (NIR). Other ICU medical devices (halogen lamps, monitors) can emit NIR interference. IRIS FLOW uses **MediaPipe Vision (Visible Light)**, making it more resilient in varied hospital lighting.
*   **Posture**: ICU patients are often in supine or semi-recumbent positions. Traditional eye tracking requires the patient to be parallel to the screen to maintain calibration. IRIS FLOW's **Single-Switch model** is calibration-free and works regardless of the patient's head angle or posture.
*   **Fatigue**: Sustained gaze calibration is mentally exhausting. IRIS FLOW's binary input (Open/Closed) is intuitive and allows the user to rest their gaze without triggering the "Midas Touch" (accidental selection).

### 3. Reliability vs. Speed
*   While eye-pointing is "faster" in ideal lab settings (~10-15 wpm), it suffers from "drift" over time.
*   **Single-switch scanning** (IRIS FLOW) provides a **significant accuracy advantage** for ALS and stroke patients. It prioritizes **Reliability (getting the message right)** over raw speed, which is critical in emergency care.

### 4. Technical Edge: State-Machine Safety
*   Iris Flow implements a **deterministic state machine** for SOS triggers. This prevents false alarms from natural blinking or "sleep closure" (8-second timeout), ensuring that every alarm sent to the caregiver is a genuine distress signal.
