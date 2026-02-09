/* ============================================
   EYE ENGINE - The AI Core
   Wraps MediaPipe FaceMesh to detect blinks.
   ============================================ */

export class EyeEngine {
    constructor() {
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasCtx = null;
        this.faceMesh = null;
        this.camera = null;

        this.onBlink = null;

        this.isBlinking = false;
        this.blinkCooldown = false;
    }

    /**
     * Initialize engine.
     * @param {Function} blinkCallback - Called on blink.
     */
    async init(blinkCallback) {
        console.log('EyeEngine: Initializing...');
        this.onBlink = blinkCallback;

        // 1. Hidden video element for raw stream
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);

        // 2. Canvas for drawing inside the monitor screen
        const overlayContainer = document.querySelector('.face-mesh-overlay');
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.width = 320;
        this.canvasElement.height = 240;
        this.canvasElement.style.width = '100%';
        this.canvasElement.style.height = '100%';
        overlayContainer.appendChild(this.canvasElement);
        this.canvasCtx = this.canvasElement.getContext('2d');

        // 3. Configure FaceMesh
        this.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults(this.onResults.bind(this));

        // 4. Start camera
        this.camera = new Camera(this.videoElement, {
            onFrame: async () => {
                await this.faceMesh.send({ image: this.videoElement });
            },
            width: 320,
            height: 240
        });

        await this.camera.start();
        console.log('EyeEngine: Camera Started');
    }

    /**
     * MediaPipe results callback.
     */
    onResults(results) {
        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];

            this.drawEyeLandmarks(landmarks);
            this.detectBlink(landmarks);
        }
        this.canvasCtx.restore();
    }

    /**
     * Calculate EAR and determine blink.
     */
    detectBlink(landmarks) {
        const leftEye = [33, 160, 158, 133, 153, 144];
        const rightEye = [362, 385, 387, 263, 373, 380];

        const earLeft = this.calculateEAR(landmarks, leftEye);
        const earRight = this.calculateEAR(landmarks, rightEye);
        const avgEAR = (earLeft + earRight) / 2;

        const BLINK_THRESHOLD = 0.25;

        if (avgEAR < BLINK_THRESHOLD) {
            if (!this.blinkCooldown) {
                this.isBlinking = true;
                this.blinkCooldown = true;

                console.log('Blink Detected! EAR:', avgEAR.toFixed(2));

                if (this.onBlink) this.onBlink();

                setTimeout(() => {
                    this.blinkCooldown = false;
                }, 400);
            }
        }
    }

    /**
     * Eye aspect ratio.
     */
    calculateEAR(landmarks, indices) {
        const p1 = landmarks[indices[0]];
        const p2 = landmarks[indices[1]];
        const p3 = landmarks[indices[2]];
        const p4 = landmarks[indices[3]];
        const p5 = landmarks[indices[4]];
        const p6 = landmarks[indices[5]];

        const v1 = this.euclideanDist(p2, p6);
        const v2 = this.euclideanDist(p3, p5);
        const h = this.euclideanDist(p1, p4);

        return (v1 + v2) / (2.0 * h);
    }

    euclideanDist(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    }

    drawEyeLandmarks(landmarks) {
        this.canvasCtx.fillStyle = '#00e676';
        const eyeIndices = [33, 133, 362, 263, 159, 145, 386, 374];
        eyeIndices.forEach((idx) => {
            const x = landmarks[idx].x * this.canvasElement.width;
            const y = landmarks[idx].y * this.canvasElement.height;
            this.canvasCtx.beginPath();
            this.canvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
            this.canvasCtx.fill();
        });
    }
}
