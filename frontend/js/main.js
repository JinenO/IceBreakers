import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';
import { SOSSystem } from './modules/sos.js';
import { SleepManager } from './modules/sleep-manager.js';
import { KeyboardManager } from './modules/keyboard-logic.js';
import { renderKeyboardMatrix, handleKeyboardAction } from './modules/keyboard-ui.js';
import { SUB_MENU_DATA, BODY_DETAILS_DATA } from './data.js';
import { AlertService } from './api/alert-service.js';
import { MediaManager } from './modules/media/media-manager.js';
import { ViewManager } from './modules/view-manager.js';
import { renderMainGrid, showFeedback } from './modules/ui-utils.js';
import { ActionController } from './core/action-controller.js';

// ==========================================
// 0. Render main menu
// ==========================================
renderMainGrid();

// Module instances
const gridUI = new GridUI();
const eyeEngine = new EyeEngine();
const sosSystem = new SOSSystem();
const kbManager = new KeyboardManager();
const mediaManager = new MediaManager();
const viewManager = new ViewManager(gridUI, kbManager, renderKeyboardMatrix);

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
let isProcessingAction = false;
const KB_SCAN_SELECTOR = '#kb-prediction-bar .predict-btn, #kb-grid .kb-card';
const MAIN_SCAN_SELECTOR = '#main-grid .card';
const SUB_SCAN_SELECTOR = '#sub-grid .card';
let kbScanTarget = KB_SCAN_SELECTOR;

// Initialize ActionController
const actionController = new ActionController({
    gridUI,
    viewManager,
    sleepManager,
    kbManager,
    mediaManager,
    sosSystem,
    onStopScanning: () => stopScanning(),
    onStartScanning: () => startScanning(),
    onResetTriggerState: () => resetTriggerState(),
    helpers: {
        backToMain,
        openSubMenu,
        handleSyncRequest,
        renderKeyboardMatrix,
        handleKeyboardAction,
        setKbScanTarget: (target) => { kbScanTarget = target; },
        setEyeState: (closed, time) => { 
            isEyesClosed = closed; 
            eyesClosedStartTime = time; 
        }
    }
});

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

    let selector;
    if (viewManager.currentView === 'keyboard') {
        selector = kbScanTarget;
    } else if (viewManager.currentView === 'main') {
        selector = MAIN_SCAN_SELECTOR;
    } else if (viewManager.currentView === 'sub') {
        selector = SUB_SCAN_SELECTOR;
    } else if (viewManager.currentView === 'body-details') {
        selector = '#sub-grid .card';
    } else if (viewManager.currentView === 'media-library') {
        selector = '#video-library-grid .card'; 
    } else if (viewManager.currentView === 'audio-panel') {
        selector = '#audio-control-grid .card';
    } else if (viewManager.currentView === 'video-panel') {
        selector = '#video-control-grid .card'; 
    }

    if (viewManager.currentView === 'video-playing' || viewManager.currentView === 'audio-playing') return; 

    gridUI.refreshCards(selector, true);

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

    // Clear old highlights before rendering new view
    gridUI.clearHighlights();

    const subGrid = document.getElementById('sub-grid');
    subGrid.innerHTML = '';

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

    viewManager.goSubMenu(menuData.title);
    gridUI.refreshCards(SUB_SCAN_SELECTOR);

    stopScanning();
    setTimeout(startScanning, 500);
}

// ✨ Added: handle synchronous requests (Temp / Itch)
async function handleSyncRequest(commandId) {
    // 1. Pause scanning
    stopScanning();

    // 2. Show waiting overlay
    const waitOverlay = document.getElementById('caregiver-wait-overlay');
    if (waitOverlay) {
        waitOverlay.classList.remove('hidden');
    }

    // 3. Call API (simulated app request)
    try {
        await AlertService.requestCaregiverAssist(commandId);

        // 4. Hide waiting overlay
        if (waitOverlay) {
            waitOverlay.classList.add('hidden');
        }

        // 5. Open the corresponding detail menu (Too Hot / Body Parts)
        openBodyDetailMenu(commandId);
    } catch (err) {
        console.error('Sync failed:', err);
        if (waitOverlay) {
            waitOverlay.classList.add('hidden');
        }
        startScanning();
    } finally {
        resetTriggerState();
    }
}

// ✨ Added: open detail menu (render Hot/Cold or Body Parts)
function openBodyDetailMenu(type) {
    const detailData = BODY_DETAILS_DATA[type];
    if (!detailData) return;

    // Clear old highlights before rendering detail menu
    gridUI.clearHighlights();

    const subGrid = document.getElementById('sub-grid');
    subGrid.innerHTML = '';

    detailData.items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'card';
        card.id = item.id === 'back' ? 'body-back' : `detail-${item.id}`;

        card.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/${item.icon}" alt=""></div>
            <div class="label">${item.label}</div>
            <div class="sub-label">${item.sub}</div>
            <div class="confirm-bar"></div>
        `;
        subGrid.appendChild(card);
    });

    viewManager.currentView = 'body-details';
    gridUI.refreshCards('#sub-grid .card');
    startScanning();
}

function openKeyboard() {
    // Clear old highlights before entering keyboard
    gridUI.clearHighlights();

    kbScanTarget = viewManager.goKeyboard('speak');

    stopScanning();
    setTimeout(() => {
        const selector = '#kb-prediction-bar .predict-btn, #kb-grid .kb-card';
        gridUI.refreshCards(selector);
        gridUI.currentIndex = 2;
        startScanning();
    }, 100);
}

function backToMain() {
    // Clear old highlights before returning to main
    gridUI.clearHighlights();

    viewManager.goMain();
    gridUI.refreshCards(MAIN_SCAN_SELECTOR);

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
                if (!isProcessingAction) {
                    eyesClosedStartTime = Date.now() + 5000;
                    triggerSelection();
                }
            }
        }
    } else {
        if (eyeIcon) eyeIcon.classList.remove('active');
        isEyesClosed = false;
        gridUI.updateConfirmBar(0);
    }
}

// ==========================================
// 3. Trigger selection (Fixed for Video Mode)
// ==========================================
let isTriggering = false;

function triggerSelection() {
    actionController.triggerSelection();
}

function resetTriggerState() {
    isProcessingAction = false;
    isTriggering = false;
    actionController.isProcessingAction = false;
    actionController.isTriggering = false;
}

// ==========================================
// 4. Entry point (Modified for ALS Context)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const startOverlay = document.getElementById('start-overlay');

    const initSystem = async () => {
        // 1. Play a very short silent sound to unlock AudioContext
        SoundUtils.unlock();
        SoundUtils.playBeep(440, 'sine', 0.1);

        // 2. Hide the start overlay
        startOverlay.style.opacity = '0';
        startOverlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            startOverlay.classList.add('hidden');
        }, 500);

        // 3. Start camera and eye tracking only after user interaction
        try {
            console.log('🚀 System Initialized by User Interaction');
            await eyeEngine.init(handleEyeFrame);
            startScanning();
        } catch (err) {
            console.error('Init failed:', err);
            alert(`Camera Error: ${err.message}`);
        }
    };

    // Listen for click
    startOverlay.addEventListener('click', initSystem, { once: true });
});

// ==========================================
// 5. Developer Mode (Mouse Click Support)
// ==========================================

function initDevMode() {
    // Enable only when URL has ?dev=1, e.g., http://localhost:3000/?dev=1
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('dev')) return;

    console.warn("🛠️ DEVELOPER MODE ACTIVE: Mouse Click Trigger Enabled");
    
    document.body.style.cursor = "auto";
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.card, .kb-card, .predict-btn');
        if (!target) return;

        console.log(`🖱️ Dev Clicked: ${target.id}`);

        const index = gridUI.cards.findIndex(card => card.id === target.id);

        if (index !== -1) {
            stopScanning();

            gridUI.currentIndex = index;
            
            gridUI.highlightCard(index);

            setTimeout(() => {
                triggerSelection();
            }, 10);
        } else {
            console.warn("⚠️ Clicked element is not in the current scanning list.");
        }
    }, true); 
}

// Do not forget to call this on startup!
document.addEventListener('DOMContentLoaded', () => {
    // ... (your existing initSystem logic) ...
    
    // ✨ Add this at the end
    initDevMode();
});