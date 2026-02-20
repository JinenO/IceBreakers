# IceBreakers

## Executive Summary

IRIS FLOW is a vision-based assistive communication system designed for patients with severe motor impairments (e.g., ALS, stroke, ICU conditions).

Unlike traditional eye-tracking systems that rely on precise gaze pointing and heavy calibration, IRIS FLOW adopts a Single-Switch Scanning paradigm. The patient functions as a binary input device (Eye Open / Eye Closed), dramatically reducing:

- Calibration complexity  
- Hardware cost  
- False activation (Midas Touch problem)  
- Cognitive overload  

The system is built around:

- A duration-based input model  
- A deterministic safety state machine  
- Multi-layer emergency validation  
- A configurable scanning engine  

The objective is simple:

Enable critical communication using minimal motor control.

---

# Installation & Setup
## Requirements
Make sure you have installed :
- Node.js (v18 or newer recommended)
- npm (comes with Node.js)
- Webcam (required for eye detection)

1. Clone the repository
```
git clone
cd IceBreakers
```

# Core Features

## Life-Critical Safety Systems

### Smart SOS Trigger

A multi-stage emergency alarm system designed to distinguish between:

- Natural blinking  
- Sleep state  
- Genuine distress signals  

The SOS mechanism is implemented as a deterministic state machine to ensure predictable and testable behavior.

### Quick Needs Dashboard

Single-blink access to essential care requests:

- Water  
- Food  
- Toilet  
- Suction  
- Positioning  

Designed for rapid caregiver notification with minimal navigation depth.

---

## Efficient Communication

### Frequency-Optimized Keyboard

Instead of a traditional QWERTY layout, the keyboard is arranged by letter frequency (E, A, I, O, T prioritized).

This reduces average scanning steps per character and improves typing efficiency under single-switch constraints.

### Smart Prediction

Dynamic word completion suggestions reduce required input cycles.

### Text-to-Speech (TTS)

Typed messages are instantly vocalized, enabling direct auditory communication with caregivers.

---

## Body & Pain Mapping

Patients can report localized discomfort by selecting:

- Body part (Head, Arm, Leg, etc.)
- Sensation (Pain, Itch, Hot, Cold, Pressure)

This structured reporting provides caregivers with actionable and specific information rather than vague alerts.

---

## Accessible Media

### Hands-Free Media Control

* **Integrated YouTube Search:**
    * Users can switch the predictive keyboard to **"Search Mode"**, allowing them to find and play generic YouTube content directly from the typing interface.
* **Curated Local Library:**
    * Includes built-in Audiobooks (e.g., *The Little Prince*) and Music for offline or quick access, ensuring entertainment is available even without complex searching.

### Eye-Controlled Playback

- Play  
- Pause  
- Volume adjustment  

All actions are performed using sustained eye closure through the scanning engine.

---

# System Architecture

## Vision-Based Single-Switch Engine

IRIS FLOW does not rely on gaze-point precision.

Instead, it implements a binary-state interaction model:

- Input: Eye Open / Eye Closed  
- Control: Duration-based validation  
- Output: Deterministic action trigger  

### Technology Stack

- MediaPipe FaceLandmarker  
- 478 facial landmarks  
- Real-time EAR (Eye Aspect Ratio) calculation  

EAR is continuously monitored to determine eye closure duration.

---

## Anti-Midas Touch Algorithm

Natural blinking must not trigger actions.

The system prevents accidental activation using:

### Signal Debouncing

- Natural blinks (typically <300ms) are inherently ignored as they do not meet the 1000ms activation threshold.

### Deliberate Activation Threshold

- Selection triggers only if Eye Closure Duration ≥ 1000ms.

### State Locking

- After activation, input is locked until full eye reopening.
- Prevents double-triggering or rapid unintended clicks.

---

# Core Operating Flow

## 1. System Activation

### Caregiver Initialization

The system starts with a “Click to Initialize” overlay.

This ensures:

- Browser AudioContext is unlocked  
- Camera access is confirmed  
- Audio alerts (beeps / alarms) are functional  

Only after initialization does patient control begin.

---

## 2. Auto-Scanning Loop

Once active, the interface continuously cycles through:

- Needs  
- Keyboard  
- Body  
- Media  
- Chat AI  

### Visual Feedback

A progress bar animates over the highlighted card.

### Audio Feedback

Optional soft beep at each scan step.

### Default Configuration

- Scan speed: 2500ms per item (configurable)

---

## 3. Selection Logic

To select the highlighted item:

1. User closes eyes  
2. Hold for ≥ 1000ms  
3. User reopens eyes  
4. Action is executed  

The system continuously monitors eye state transitions to ensure intentional input.

---

# Safety & SOS Mechanisms

Implemented using strict state-machine logic.

## SOS Trigger Flow

### Charging Phase (0s – 3s)

* User closes eyes.
* **Auditory cues escalate in pitch (200Hz → 400Hz → 600Hz)** as the SOS timer charges.
* This provides intuitive, non-visual feedback, letting the user know exactly how close they are to triggering the alarm without looking at the screen.

### Arming Phase (≥ 3s)

If eyes remain closed for 3 seconds:

- Pre-Alarm activates 
- Screen displays: “OPEN EYES NOW”  
- High-priority warning tone plays  

### Confirmation Phase

To confirm emergency:

1. User must reopen eyes  
2. System enters READY state  
3. If eyes remain open for 2 seconds → SOS is sent  

This ensures active confirmation rather than passive eye closure.

---

## Sleep Cancellation Logic

If eyes remain continuously closed for more than 8 seconds:

- System assumes sleep or fatigue  
- SOS is cancelled  
- System enters Sleep Mode  

This prevents false alarms during unintended long closure.

---

# Auto Sleep Mode

If no interaction occurs for an extended period:

- Scanning pauses  
- UI highlight stops  
- CPU load is reduced  

Reactivation requires a deliberate long blink.

---

# Camera Module

The camera module continuously monitors the patient’s eye state.

### Implemented:

- Real-time eye state detection (Open / Closed)  
- Blink duration tracking  
- Threshold-based filtering  
- Continuous state monitoring for:
  - Selection confirmation  
  - SOS detection  
  - Sleep mode activation  

The camera is positioned to face the patient’s eyes and does not require precise gaze direction tracking.

Only sustained eye closure duration is analyzed.

---

# Why Not Traditional Eye Tracking?

| Traditional Eye Tracking | IRIS FLOW |
|--------------------------|-----------|
| Requires calibration | No calibration required |
| Sensitive to drift | Robust to head movement |
| Suffers from Midas Touch problem | Duration-based intent validation |
| Expensive dedicated hardware | Works with standard webcam |
| Precision-dependent gaze pointing | Binary-state input model |

Traditional systems depend on accurate gaze coordinates.  
IRIS FLOW prioritizes robustness and safety over precision and speed.

---

# Configuration

Key parameters are configurable in `config.js`:

```javascript
export const AppConfig = {
    SCAN_SPEED: 2500,        // Time per item (ms)
    BLINK_THRESHOLD: 0.012,  // Sensitivity of eye closure
    REQUIRED_BLINK_TIME: 1000 // Duration to trigger selection (ms)
};
```
---

# Developer Mode

- For testing without a camera
- Append `?dev=1` to the application URL
- Example:

    http://127.0.0.1:5500/IceBreakers/frontend/index.html?dev=1

- Features
    - Mouse click simulates eye-triggered selection  
    - Enables rapid UI debugging  
    - Camera input is not required

Developer Mode allows safe testing of the navigation engine and state logic without relying on real-time vision input.

---


