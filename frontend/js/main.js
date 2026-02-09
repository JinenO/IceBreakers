/* ============================================
   IRIS FLOW - Main Controller
   ============================================ */
import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';

// 1. Initialize modules
const gridUI = new GridUI();
const eyeEngine = new EyeEngine();
let scanTimer = null;
let isScanning = false;

// 2. Start scanning
function startScanning() {
    if (isScanning) return;
    isScanning = true;
    console.log('%c SYSTEM: Scanning Started ', 'background: #00e676; color: black');

    gridUI.highlightNext();

    scanTimer = setInterval(() => {
        gridUI.highlightNext();
    }, AppConfig.SCAN_SPEED);
}

// 3. Stop scanning
function stopScanning() {
    if (!isScanning) return;
    isScanning = false;
    clearInterval(scanTimer);
    console.log('%c SYSTEM: Scanning Stopped ', 'background: #ff1744; color: white');
}

function handleBlinkAction() {
    if (isScanning) {
        handleSelection();
    }
}

// 4. Simulate confirmation (Space key)
function handleSelection() {
    stopScanning();
    const selectedId = gridUI.getCurrentId();

    console.log(`👁️ EYE SELECTION: ${selectedId}`);

    const card = document.getElementById(selectedId);
    if (card) {
        card.style.borderColor = '#00e676';
        card.style.boxShadow = '0 0 30px #00e676';
    }

    setTimeout(() => {
        if (card) {
            card.style.borderColor = '';
            card.style.boxShadow = '';
        }
        startScanning();
    }, 2000);
}

// 5. Entry point
document.addEventListener('DOMContentLoaded', async () => {
    startScanning();

    try {
        await eyeEngine.init(handleBlinkAction);
    } catch (err) {
        console.error('Camera Init Failed:', err);
        alert('Unable to start camera. Check permissions. Space key will simulate.');
    }

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            handleBlinkAction();
        }
        if (event.code === 'Enter') {
            if (isScanning) stopScanning();
            else startScanning();
        }
    });
});
