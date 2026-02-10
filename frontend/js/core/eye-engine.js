/* frontend/js/core/eye-engine.js */

import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js";

export class EyeEngine {
    constructor() {
        this.faceLandmarker = null;
        this.video = null;
        this.lastVideoTime = -1;
        this.onFrameCallback = null;
        this.running = false;
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
                numFaces: 1
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

                const leftEyeOpen = mesh[145].y - mesh[159].y;
                const rightEyeOpen = mesh[374].y - mesh[386].y;
                const eyeOpenness =
                    (Math.abs(leftEyeOpen) + Math.abs(rightEyeOpen)) / 2;

                if (this.onFrameCallback) {
                    this.onFrameCallback({
                        eyeOpenness: eyeOpenness,
                        raw: mesh
                    });
                }
            }
        }

        requestAnimationFrame(() => this.predictLoop());
    }
}
