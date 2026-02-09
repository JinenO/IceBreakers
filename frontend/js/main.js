/* ============================================
   IRIS FLOW - Main Controller
   ============================================ */
import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';

// 1. Initialize modules
const gridUI = new GridUI();
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

// 4. Simulate confirmation (Space key)
function handleSelection() {
    stopScanning();
    const selectedId = gridUI.getCurrentId();

    console.log(`User Selected: ${selectedId}`);

    const card = document.getElementById(selectedId);
    if (card) {
        card.style.borderColor = 'white';
        setTimeout(() => {
            card.style.borderColor = '';
        }, 200);
    }

    setTimeout(() => {
        startScanning();
    }, 2000);
}

// 5. Entry point
document.addEventListener('DOMContentLoaded', () => {
    startScanning();

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            handleSelection();
        }
        if (event.code === 'Enter') {
            if (isScanning) stopScanning();
            else startScanning();
        }
    });
});
