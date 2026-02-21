import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';
import { SOSSystem } from './modules/sos.js';
import { SleepManager } from './modules/sleep-manager.js';
import { KeyboardManager } from './modules/keyboard-logic.js';
import { renderKeyboardMatrix, handleKeyboardAction } from './modules/keyboard-ui.js';
import { SUB_MENU_DATA, BODY_DETAILS_DATA } from './data.js';
import { MediaManager } from './modules/media/media-manager.js';
import { ViewManager } from './modules/view-manager.js';
import { renderMainGrid, showFeedback } from './modules/ui-utils.js';
import { ActionController } from './core/action-controller.js';
import { StatusService } from './api/status-service.js';
import { SettingsService } from './api/settings-service.js';

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
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(600, 'sine', 0.1);
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

// ✨ FIX: Start keyboard scanner ONLY on the letters by default, not both zones
const KB_SCAN_SELECTOR = '#kb-grid .kb-card';
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
    if (!menuData) return;

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

async function handleSyncRequest(commandId) {
    stopScanning();
    const waitOverlay = document.getElementById('caregiver-wait-overlay');
    if (waitOverlay) waitOverlay.classList.remove('hidden');

    try {
        if (waitOverlay) waitOverlay.classList.add('hidden');
        openBodyDetailMenu(commandId);
    } catch (err) {
        console.error('Sync failed:', err);
        if (waitOverlay) waitOverlay.classList.add('hidden');
        startScanning();
    } finally {
        resetTriggerState();
    }
}

function openBodyDetailMenu(type) {
    const detailData = BODY_DETAILS_DATA[type];
    if (!detailData) return;

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
    gridUI.clearHighlights();
    kbScanTarget = viewManager.goKeyboard('speak');

    stopScanning();
    setTimeout(() => {
        // ✨ FIX: Start scanner only on the Letters grid initially
        const selector = '#kb-grid .kb-card';
        gridUI.refreshCards(selector);
        gridUI.currentIndex = 2;
        startScanning();
    }, 100);
}

function backToMain() {
    gridUI.clearHighlights();
    viewManager.goMain();
    gridUI.refreshCards(MAIN_SCAN_SELECTOR);
    stopScanning();
    setTimeout(startScanning, 500);
}

// ==========================================
// 2. Eye frame callback (Blink Logic)
// ==========================================
let blinkCount = 0;
let blinkCommandTimer = null;
const BLINK_TIMEOUT = 600;
const CLICK_HOLD_TIME = 1000;

function handleEyeFrame(data) {
    const isNowClosed = data.eyeOpenness < AppConfig.BLINK_THRESHOLD;
    const now = Date.now();

    sosSystem.update(isNowClosed);

    // Update real-time eye-tracker status (e.g., if user is blinking/active)
    if (now % 5000 < 100) { // Throttled update approx every 5s during the loop
        StatusService.updateStatus({ eyeTrackerActive: !isNowClosed });
    }

    if (isNowClosed) {
        if (!isEyesClosed) {
            isEyesClosed = true;
            eyesClosedStartTime = now;
        } else {
            const elapsed = now - eyesClosedStartTime;

            // A. Long Blink (Standard Click / Long Hold)
            let holdTimeRequired = CLICK_HOLD_TIME; // Default 1000ms
            if (viewManager.currentView === 'video-playing') {
                holdTimeRequired = 2000; // 2 seconds to pop out settings
            }

            if (elapsed >= holdTimeRequired && !isProcessingAction) {
                if (sosSystem.state === 'CHARGING' || sosSystem.state === 'IDLE') {
                    console.log('✅ Long Blink: Triggering Click');
                    triggerSelection();
                    isProcessingAction = true;
                    blinkCount = 0;
                }
            }
        }
    } else {
        if (isEyesClosed) {
            const elapsed = now - eyesClosedStartTime;
            isEyesClosed = false;
            isProcessingAction = false;
            gridUI.updateConfirmBar(0);

            if (elapsed < 500) {
                blinkCount++;
                if (blinkCommandTimer) clearTimeout(blinkCommandTimer);

                blinkCommandTimer = setTimeout(() => {
                    executeBlinkCommand(blinkCount);
                    blinkCount = 0;
                }, BLINK_TIMEOUT);
            }
        }
    }
}

// ==========================================
// 3. EXECUTE COMMANDS (2x = Space, 3x = Toggle)
// ==========================================
function executeBlinkCommand(count) {
    // Check if we are in video mode for single blink
    if (viewManager.currentView === 'video-playing') {
        if (count === 1) {
            console.log("⚡ COMMAND: TOGGLE PLAY/PAUSE (Blink)");
            const state = mediaManager.videoPlayer.togglePlayPause();
            showFeedback(state, "info");
        }
        return; // No other blink commands in video playing mode
    }

    if (viewManager.currentView !== 'keyboard') return;

    const ZONE_DOWN = '#kb-grid .kb-card';
    const ZONE_UP = '#kb-prediction-bar .predict-btn';

    if (count === 2) {
        console.log("⚡ COMMAND: SPACE");

        // Add a safe beep sound so the user knows it registered
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(500, 'sine', 0.05);

        handleKeyboardAction('kb-space', kbManager, gridUI, (target) => {
            kbScanTarget = target;
        });
    }
    else if (count === 3) {
        console.log("⚡ COMMAND: TOGGLE ZONE");

        // Add a distinct double beep to indicate a mode switch
        if (SoundUtils && SoundUtils.playBeep) {
            SoundUtils.playBeep(700, 'square', 0.05);
            setTimeout(() => SoundUtils.playBeep(900, 'square', 0.05), 100);
        }

        document.querySelectorAll('.kb-card, .predict-btn').forEach(el => {
            el.classList.remove('highlight', 'active');
        });

        if (kbScanTarget === ZONE_UP) {
            kbScanTarget = ZONE_DOWN;
            gridUI.refreshCards(ZONE_DOWN);
            gridUI.currentIndex = -1;

            const bar = document.getElementById('kb-prediction-bar');
            if (bar) {
                bar.style.borderColor = 'transparent';
                bar.style.boxShadow = 'none';
            }
            document.getElementById('kb-grid').style.opacity = '1';
        }
        else {
            if (document.querySelectorAll(ZONE_UP).length === 0) return;

            kbScanTarget = ZONE_UP;
            gridUI.refreshCards(ZONE_UP);
            gridUI.currentIndex = -1;

            const bar = document.getElementById('kb-prediction-bar');
            if (bar) {
                bar.style.borderColor = '#4fd1c5';
                bar.style.boxShadow = '0 0 15px #4fd1c5';
            }
            document.getElementById('kb-grid').style.opacity = '0.4';
        }
    }
}

// ==========================================
// 4. Trigger selection & Developer Mode
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

function initDevMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.has('dev')) return;

    console.warn("🛠️ DEVELOPER MODE ACTIVE: Mouse Click Trigger Enabled");

    document.body.style.cursor = "auto";
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.card, .kb-card, .predict-btn');
        if (!target) return;

        console.log(`鼠标点选: ${target.id}`);
        const index = gridUI.cards.findIndex(card => card.id === target.id);

        if (index !== -1) {
            stopScanning();
            gridUI.currentIndex = index;
            gridUI.highlightCard(index);

            setTimeout(() => {
                triggerSelection();
            }, 10);
        }
    }, true);
}
// ==========================================
// 5. Entry point
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const startOverlay = document.getElementById('start-overlay');

    const initSystem = async () => {
        SoundUtils.unlock();
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(440, 'sine', 0.1);

        startOverlay.style.opacity = '0';
        startOverlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            startOverlay.classList.add('hidden');
        }, 500);

        try {
            console.log('🚀 System Initialized by User Interaction');
            await eyeEngine.init(handleEyeFrame);
            SettingsService.init(); // Listen for caregiver remote config
            startScanning();
        } catch (err) {
            console.error('Init failed:', err);
            alert(`Camera Error: ${err.message}`);
        }
    };

    startOverlay.addEventListener('click', initSystem, { once: true });

    StatusService.startHeartbeat();
    initDevMode();
});