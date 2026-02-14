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
