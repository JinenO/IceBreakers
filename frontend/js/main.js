/* ============================================
   IRIS FLOW - Main Controller
   ============================================ */
import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';
import { SOSSystem } from './modules/sos.js';
import { SleepManager } from './modules/sleep-manager.js';
import { SUB_MENU_DATA, MAIN_MENU_DATA } from './data.js';

function showFeedback(message, type = 'success') {
    const overlay = document.getElementById('feedback-overlay');
    const text = document.getElementById('fb-text');

    if (!overlay || !text) return;

    text.innerText = message;

    overlay.className = 'feedback-overlay';
    overlay.classList.add(type);
    overlay.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 3000);
}

// ==========================================
// 0. Render main menu
// ==========================================
function renderMainGrid() {
    const mainGrid = document.getElementById('main-grid');
    mainGrid.innerHTML = '';

    MAIN_MENU_DATA.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.id = item.id;
        card.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/${item.icon}" alt=""></div>
            <div class="label">${item.label}</div>
            <div class="sub-label">${item.sub}</div>
            <div class="confirm-bar"></div>
        `;
        mainGrid.appendChild(card);
    });

    const cameraPanel = document.createElement('div');
    cameraPanel.className = 'monitor-panel';
    cameraPanel.id = 'camera-monitor';
    cameraPanel.innerHTML = `
        <div class="monitor-screen">
            <div class="face-mesh-overlay"></div>
            <div class="monitor-text">SYSTEM ONLINE</div>
        </div>
        <div class="monitor-label">EYE TRACKER</div>
    `;
    mainGrid.appendChild(cameraPanel);
}

renderMainGrid();

// Module instances
const gridUI = new GridUI();
const eyeEngine = new EyeEngine();
const sosSystem = new SOSSystem();
const statusText = document.getElementById('status-text');

const sleepManager = new SleepManager(
    () => stopScanning(),
    () => {
        SoundUtils.playBeep(600, 'sine', 0.1);
        startScanning();
    }
);

window.showFeedback = showFeedback;

// State
let scanTimer = null;
let isScanning = false;
let eyesClosedStartTime = 0;
let isEyesClosed = false;
let currentView = 'main';
let isProcessingAction = false;

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
    if (sleepManager.isSleeping || isEyesClosed || sosSystem.state === 'ARMING') {
        return;
    }

    gridUI.refreshCards(currentView === 'main' ? '#main-grid' : '#sub-grid', true);

    gridUI.highlightNext();
    gridUI.startScanBarAnimation(AppConfig.SCAN_SPEED);

    sleepManager.recordRound(gridUI.currentIndex, gridUI.cards.length);
}

function stopScanning() {
    isScanning = false;
    clearInterval(scanTimer);
}

// ==========================================
// Navigation logic
// ==========================================
function openSubMenu(menuId) {
    const menuData = SUB_MENU_DATA[menuId];
    if (!menuData) {
        console.warn('No sub-menu found for:', menuId);
        return;
    }

    const subGrid = document.getElementById('sub-grid');
    subGrid.innerHTML = '';

    if (statusText) {
        statusText.innerText = menuData.title;
        statusText.style.color = '#4fd1c5';
    }

    menuData.items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.id = item.id === 'back' ? 'btn-back' : `cmd-${item.id}`;

        card.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/${item.icon}" alt=""></div>
            <div class="label">${item.label}</div>
            <div class="sub-label">${item.sub}</div>
            <div class="confirm-bar"></div>
        `;
        subGrid.appendChild(card);
    });

    document.getElementById('main-grid').classList.add('hidden');
    document.getElementById('view-container').classList.remove('hidden');

    currentView = 'sub';
    gridUI.refreshCards('#sub-grid');

    stopScanning();
    setTimeout(startScanning, 500);
}

function backToMain() {
    document.getElementById('view-container').classList.add('hidden');
    document.getElementById('main-grid').classList.remove('hidden');

    if (statusText) {
        statusText.innerText = 'SYSTEM READY';
        statusText.style.color = '';
    }

    currentView = 'main';
    gridUI.refreshCards('#main-grid');

    stopScanning();
    setTimeout(startScanning, 500);
}

// ==========================================
// 2. Eye frame callback
// ==========================================
function handleEyeFrame(data) {
    const isNowClosed = data.eyeOpenness < AppConfig.BLINK_THRESHOLD;
    const eyeIcon = document.getElementById('eye-icon');

    sosSystem.update(isNowClosed);

    if (sosSystem.state === 'ARMING') {
        return;
    }

    if (sleepManager.isSleeping) {
        if (isNowClosed) {
            if (!isEyesClosed) {
                isEyesClosed = true;
                eyesClosedStartTime = Date.now();
            } else if (Date.now() - eyesClosedStartTime >= 1000) {
                sleepManager.wakeUp();
            }
        } else {
            isEyesClosed = false;
        }
        return;
    }

    if (isNowClosed) {
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
    if (isProcessingAction || isTriggering) return;
    isProcessingAction = true;
    isTriggering = true;

    stopScanning();

    const selectedId = gridUI.getCurrentId();
    if (!selectedId) {
        isProcessingAction = false;
        isTriggering = false;
        return;
    }

    console.log(`✅ SELECTED: ${selectedId}`);

    SoundUtils.playBeep(880, 'sine', 0.1);

    if (currentView === 'main') {
        if (SUB_MENU_DATA[selectedId]) {
            openSubMenu(selectedId);
            sleepManager.resetTimer();
            setTimeout(() => {
                isProcessingAction = false;
            }, 1000);
        } else {
            console.log('No sub-menu for this item, maybe direct action.');
            sleepManager.resetTimer();
            isProcessingAction = false;
        }
    } else if (currentView === 'sub') {
        if (selectedId === 'btn-back') {
            backToMain();
            sleepManager.resetTimer();
            setTimeout(() => {
                isProcessingAction = false;
            }, 1000);
        } else {
            console.log(`🚀 COMMAND SENT: ${selectedId}`);
            const msg = `${selectedId.toUpperCase()} SENT ✅`;
            showFeedback(msg, 'success');

            setTimeout(() => {
                    sleepManager.resetTimer();
                isProcessingAction = false;
                isEyesClosed = false;
                    if (!sleepManager.isSleeping) startScanning();
            }, 3000);
        }
    }

    setTimeout(() => {
        isTriggering = false;
           if (!document.hidden && !sleepManager.isSleeping) startScanning();
    }, 3000);
}

// ==========================================
// 4. Entry point
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    document.body.addEventListener(
        'click',
        () => {
            SoundUtils.unlock();
            SoundUtils.playBeep(600, 'sine', 0.05);
        },
        { once: true }
    );

    try {
        await eyeEngine.init(handleEyeFrame);
        startScanning();
    } catch (err) {
        console.error('Init failed:', err);
        alert(`Camera Error: ${err.message}`);
    }
});
