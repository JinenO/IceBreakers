/* ============================================
   IRIS FLOW - Main Controller
   ============================================ */
import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';

// Module instances
const gridUI = new GridUI();
const eyeEngine = new EyeEngine();

// State
let scanTimer = null;
let isScanning = false;
let eyesClosedStartTime = 0;
let isEyesClosed = false;

// ==========================================
// 1. Scanning control
// ==========================================
function startScanning() {
    if (isScanning) return;
    isScanning = true;

    runScanStep();
    scanTimer = setInterval(runScanStep, AppConfig.SCAN_SPEED);
}

function runScanStep() {
    if (isEyesClosed) return;

    gridUI.highlightNext();
    gridUI.startScanBarAnimation(AppConfig.SCAN_SPEED);
}

function stopScanning() {
    isScanning = false;
    clearInterval(scanTimer);
}

// ==========================================
// 2. Eye frame callback
// ==========================================
function handleEyeFrame(data) {
    const openness = data.eyeOpenness;
    const eyeIcon = document.getElementById('eye-icon');

    if (openness < AppConfig.BLINK_THRESHOLD) {
        if (eyeIcon) eyeIcon.classList.add('active');

        if (!isEyesClosed) {
            isEyesClosed = true;
            eyesClosedStartTime = Date.now();
        } else {
            const elapsed = Date.now() - eyesClosedStartTime;
            const progress = Math.min(
                (elapsed / AppConfig.REQUIRED_BLINK_TIME) * 100,
                100
            );

            gridUI.updateConfirmBar(progress);

            if (elapsed >= AppConfig.REQUIRED_BLINK_TIME) {
                triggerSelection();
            }
        }
    } else {
        if (eyeIcon) eyeIcon.classList.remove('active');
        isEyesClosed = false;
        gridUI.updateConfirmBar(0);
    }
}

// ==========================================
// 3. Trigger selection
// ==========================================
let isTriggering = false;

function triggerSelection() {
    if (isTriggering) return;
    isTriggering = true;

    stopScanning();

    const selectedId = gridUI.getCurrentId();
    console.log(`✅ SELECTED: ${selectedId}`);

    SoundUtils.playBeep(600, 'triangle', 0.2);

    setTimeout(() => {
        isTriggering = false;
        isEyesClosed = false;
        startScanning();
    }, 1500);
}

// ==========================================
// 4. Entry point
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await eyeEngine.init(handleEyeFrame);
        startScanning();
    } catch (err) {
        console.error('Init failed:', err);
        alert(`Camera Error: ${err.message}`);
    }
});
