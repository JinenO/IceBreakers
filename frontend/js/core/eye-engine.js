/* frontend/js/core/eye-engine.js */

import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

function getDistance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

export class EyeEngine {
    constructor() {
        this.faceLandmarker = null;
        this.video = null;
        this.lastVideoTime = -1;
        this.onFrameCallback = null;
        this.running = false;

        this.GAZE_THRESHOLD = 0.45;

        // Empathy Features: Ambient Light & Head Pose
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = 32; // Low res for speed
        this.lightCanvas.height = 32;
        this.lightCtx = this.lightCanvas.getContext('2d', { willReadFrequently: true });
    }

    async init(onFrame) {
        this.onFrameCallback = onFrame;
        console.log('EyeEngine: 1. Loading AI Models...');

        try {
            const vision = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
            );

            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numFaces: 1,
                refineLandmarks: true,
                outputFacialTransformationMatrixes: true // Required for Head Pose (yaw/pitch)
            });
            console.log('EyeEngine: 2. AI Model Loaded!');

            await this.setupCamera();

            this.running = true;
            this.predictLoop();
        } catch (error) {
            console.error('EyeEngine Init Failed:', error);
            alert(`Camera/AI Init Failed: ${error.message}`);
        }
    }

    async setupCamera() {
        console.log('EyeEngine: 3. Requesting Camera...');

        this.video = document.createElement('video');
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('playsinline', '');

        const monitor = document.querySelector('.face-mesh-overlay');
        if (monitor) {
            monitor.innerHTML = '';
            this.video.style.width = '100%';
            this.video.style.height = '100%';
            this.video.style.transform = 'scaleX(-1)';
            this.video.style.objectFit = 'cover';
            monitor.appendChild(this.video);
        } else {
            console.warn('Warning: .face-mesh-overlay not found in DOM');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });

        this.video.srcObject = stream;

        return new Promise((resolve) => {
            this.video.onloadedmetadata = () => {
                this.video.play();
                console.log('EyeEngine: 4. Camera Playing!');
                resolve();
            };
        });
    }

    predictLoop() {
        if (!this.running) return;

        if (this.video && this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;

            const results = this.faceLandmarker.detectForVideo(
                this.video,
                performance.now()
            );

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                const mesh = results.faceLandmarks[0];

                // Left eye landmarks: width (33,133), vertical pairs (160,144) and (158,153)
                const leftV1 = getDistance(mesh[160], mesh[144]);
                const leftV2 = getDistance(mesh[158], mesh[153]);
                const leftH = getDistance(mesh[33], mesh[133]);
                const leftEAR = (leftV1 + leftV2) / (2.0 * leftH);

                // Right eye landmarks: width (362,263), vertical pairs (385,380) and (387,373)
                const rightV1 = getDistance(mesh[385], mesh[380]);
                const rightV2 = getDistance(mesh[387], mesh[373]);
                const rightH = getDistance(mesh[362], mesh[263]);
                const rightEAR = (rightV1 + rightV2) / (2.0 * rightH);

                const eyeOpenness = (leftEAR + rightEAR) / 2;

                // --- 1. Ambience Tracker (Auto-Brightness) ---
                let ambientLight = 100; // Default brightness percentage
                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    this.lightCtx.drawImage(this.video, 0, 0, 32, 32);
                    const imgData = this.lightCtx.getImageData(0, 0, 32, 32).data;
                    let colorSum = 0;
                    // Sample every 4th pixel (r,g,b,a)
                    for (let i = 0; i < imgData.length; i += 16) {
                        // rgb average
                        colorSum += (imgData[i] + imgData[i + 1] + imgData[i + 2]) / 3;
                    }
                    const brightness = Math.floor(colorSum / (imgData.length / 16));
                    // Map 0-255 brightness to a safe UI percentage (min 65% floor)
                    // High-gain: (brightness / 150) * 55 + 65. Max 120% for "Vivid" daylight.
                    ambientLight = Math.max(65, Math.min(120, (brightness / 150) * 55 + 65));
                }

                // --- 2. Head Pose Tracker (Yaw/Pitch/Roll) ---
                let headYaw = 0;
                let headPitch = 0;
                let headRoll = 0;
                let focalQuadrant = 'center';

                if (results.facialTransformationMatrixes && results.facialTransformationMatrixes.length > 0) {
                    const matrix = results.facialTransformationMatrixes[0].data;
                    
                    // Yaw (Left/Right): Rotation around Y axis
                    headYaw = Math.atan2(matrix[4], matrix[0]) * (180 / Math.PI);
                    
                    // Pitch (Up/Down): Rotation around X axis
                    headPitch = Math.atan2(-matrix[9], matrix[10]) * (180 / Math.PI);

                    // Roll (Tilt): Rotation around Z axis
                    headRoll = Math.atan2(matrix[1], matrix[5]) * (180 / Math.PI);

                    // --- 3. Focal Quadrant Logic (Explosive Feature) ---
                    // Yaw < -8: Right, Yaw > 8: Left
                    // Pitch < -8: Down, Pitch > 8: Up
                    const hDir = headYaw < -8 ? 'right' : (headYaw > 8 ? 'left' : '');
                    const vDir = headPitch < -8 ? 'bottom' : (headPitch > 8 ? 'top' : '');
                    
                    if (hDir && vDir) focalQuadrant = `${vDir}-${hDir}`;
                    else if (hDir) focalQuadrant = hDir;
                    else if (vDir) focalQuadrant = vDir;
                }

                if (this.onFrameCallback) {
                    this.onFrameCallback({
                        eyeOpenness: eyeOpenness,
                        ambientLight: ambientLight,
                        headYaw: headYaw,
                        headPitch: headPitch,
                        headRoll: headRoll,
                        focalQuadrant: focalQuadrant,
                        raw: mesh,
                        faceVisible: true
                    });
                }
            } else {
                // Not enough light / face lost
                if (this.onFrameCallback) {
                    this.onFrameCallback({ 
                        faceVisible: false,
                        eyeOpenness: 1.0 // Force open to avoid accidental SOS in main.js
                    });
                }
            }
        } else if (!this.video || this.video.paused) {
             // Camera disconnected or paused
             if (this.onFrameCallback) {
                this.onFrameCallback({ faceVisible: false, eyeOpenness: 1.0 });
             }
        }

        requestAnimationFrame(() => this.predictLoop());
    }
}
