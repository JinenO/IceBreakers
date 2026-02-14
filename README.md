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

- Integrated YouTube search  
- Local audio playback  

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

- Blinks shorter than 300ms are filtered as noise.

### Deliberate Activation Threshold

- Selection triggers only if Eye Closure Duration ≥ 1200ms.

### State Locking

- After activation, input is locked until full eye reopening.
- Prevents double-triggering or rapid unintended clicks.

---
