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
    } else if (viewManager.currentView === 'video-panel') {
        selector = '#video-control-grid .card'; 
    } else if (viewManager.currentView === 'audio-playing') {
        selector = '#audio-control-grid .card'; 
    }

    if (viewManager.currentView === 'video-playing') return; 

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
    if (isProcessingAction || isTriggering) return;

    isProcessingAction = true;
    isTriggering = true;
    stopScanning(); // Ensure scanning stops while processing

    // 🚨 FIX: privileged path
    // If a full-screen video is playing, skip selectedId checks and show the control panel directly
    if (viewManager.currentView === 'video-playing') {
        console.log("📺 Video Playing Mode: Waking up controls...");
        mediaManager.videoPlayer.showControlPanel(gridUI);
        viewManager.currentView = 'video-panel';
        
        // After showing the panel, restart scanning for panel buttons
        setTimeout(() => { 
            resetTriggerState(); 
            startScanning(); 
        }, 500);
        return;
    }

    // --- Standard mode checks ---
    const selectedId = gridUI.getCurrentId();

    // If not in video mode and nothing is selected, treat as an invalid trigger
    if (!selectedId) {
        resetTriggerState();
        startScanning(); // Resume scanning
        return;
    }

    SoundUtils.playBeep(880, 'sine', 0.1);

    // --- Keyboard View ---
    if (viewManager.currentView === 'keyboard') {
        const callbacks = {
            onExit: () => {
                 // If entered via YouTube search, exit back to YouTube search mode
                if (viewManager.keyboardMode === 'youtube-search') {
                     // Keep search mode
                } else {
                     viewManager.keyboardMode = 'speak';
                     const sendLabel = document.querySelector('#kb-send .kb-label');
                     if (sendLabel) sendLabel.innerText = 'SEND';
                }
                
                backToMain();
                sleepManager.resetTimer();
            }
        };

        if (selectedId === 'kb-send') {
            const text = kbManager.currentText;
            if (text.trim().length > 0) {
                if (viewManager.keyboardMode === 'youtube-search') {
                    console.log('🔍 Searching YouTube for:', text);
                    mediaManager.youtubePlayer.searchAndRender(text, gridUI);

                    viewManager.currentView = 'media-library';
                    setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
                } else {
                    console.log('🗣 Speaking:', text);
                    sosSystem.speak(text);
                    kbManager.clear();
                    renderKeyboardMatrix(kbManager, gridUI);

                    sleepManager.resetTimer();
                    setTimeout(() => {
                        resetTriggerState();
                        if (!sleepManager.isSleeping) {
                            startScanning();
                        }
                    }, 500);
                }
            } else {
                resetTriggerState();
                if (!sleepManager.isSleeping) {
                    startScanning();
                }
            }
            return;
        }

        handleKeyboardAction(selectedId, kbManager, gridUI, (newTarget) => {
            kbScanTarget = newTarget;
        }, callbacks).then(() => {
            sleepManager.resetTimer();
            isEyesClosed = false;
            eyesClosedStartTime = 0;
            gridUI.updateConfirmBar(0); // Clear progress

            setTimeout(() => {
                resetTriggerState();
                if (!sleepManager.isSleeping) {
                    startScanning();
                }
            }, 800); // Wait a bit before next scan
        });
        return;
    }

    // --- Main Menu ---
    if (viewManager.currentView === 'main') {
        if (selectedId === 'c-kb') {
            // Set to speak mode
            kbManager.setMode('speak');
            kbScanTarget = viewManager.goKeyboard('speak');

            sleepManager.resetTimer();
            setTimeout(() => {
                resetTriggerState();
                startScanning();
            }, 500);
            return;
        }

        if (SUB_MENU_DATA[selectedId]) {
            openSubMenu(selectedId);
            sleepManager.resetTimer();
            setTimeout(() => {
                resetTriggerState();
                startScanning();
            }, 500);
            return;
        }
    } 
    
    // --- Sub Menu ---
    else if (viewManager.currentView === 'sub') {
        if (selectedId === 'btn-back') {
            backToMain();
            sleepManager.resetTimer();
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }

        if (selectedId === 'cmd-youtube') {
            console.log("🎬 YouTube Triggered: Switching to Keyboard Search Mode");
            // Set to search mode
            kbManager.setMode('search');
            kbScanTarget = viewManager.goKeyboard('youtube-search');

            setTimeout(() => {
                resetTriggerState();
                startScanning();
            }, 500);
            return;
        }

        const mediaCommands = ['cmd-local', 'cmd-music', 'cmd-audiobook', 'cmd-photos'];
        if (mediaCommands.includes(selectedId)) {
            const appType = selectedId.replace('cmd-', '');
            mediaManager.open(appType, gridUI, sleepManager);
            viewManager.currentView = 'media-library';

            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }

        const simpleBodyCmds = ['cmd-roll', 'cmd-head', 'cmd-legs'];
        if (simpleBodyCmds.includes(selectedId)) {
            const action = selectedId.replace('cmd-', '');

            SoundUtils.playBeep(880, 'sine', 0.1);
            AlertService.sendSimpleAlert(action);
            showFeedback(`${action.toUpperCase()} SENT ✅`, 'success');

            setTimeout(() => {
                resetTriggerState();
                startScanning();
            }, 2000);
            return;
        }

        const syncBodyCmds = ['cmd-temp', 'cmd-itch'];
        if (syncBodyCmds.includes(selectedId)) {
            const action = selectedId.replace('cmd-', '');
            handleSyncRequest(action);
            return;
        }
        
        // Placeholder for other commands
        console.log(`🚀 COMMAND SENT: ${selectedId}`);
        const msg = `${selectedId.toUpperCase()} SENT ✅`;
        showFeedback(msg, 'success');

        setTimeout(() => {
            sleepManager.resetTimer();
            resetTriggerState();
            if (!sleepManager.isSleeping) startScanning();
        }, 3000);
        return;
    } 

    // --- Body Details ---
    else if (viewManager.currentView === 'body-details') {
        if (selectedId === 'body-back') {
            openSubMenu('c-body');
            return;
        }

        const detail = selectedId.replace('detail-', '');
        console.log(`📡 Sending Body Detail: ${detail}`);
        AlertService.sendSimpleAlert('body-update', detail);
        showFeedback(`UPDATED: ${detail.toUpperCase()} ✅`, 'success');

        setTimeout(() => {
            openSubMenu('c-body');
        }, 2000);
        return;
    }
    
    // --- Media Library ---
    else if (viewManager.currentView === 'media-library') {
        if (selectedId === 'yt-back') {
            kbManager.setMode('search');
            kbScanTarget = viewManager.goKeyboard('youtube-search');

            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        } else if (selectedId === 'media-lib-back') {
            mediaManager.exit();
            viewManager.currentView = 'sub';
            gridUI.refreshCards('#sub-grid .card');
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        } else if (selectedId.startsWith('vid-') || selectedId.startsWith('yt-')) {
            console.log('🎥 Video Selected:', selectedId);
            mediaManager.videoPlayer.playVideo(selectedId);
            viewManager.currentView = 'video-playing';
            stopScanning(); // Stop scanning to allow video playback
            setTimeout(() => { resetTriggerState(); }, 500);
            return;
        } else if (selectedId.startsWith('aud-')) {
            mediaManager.audioPlayer.openPlayer(selectedId, gridUI);
            viewManager.currentView = 'audio-playing';
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }
    } 
    
    // --- Video Control Panel ---
    else if (viewManager.currentView === 'video-panel') {
        const actionResult = mediaManager.videoPlayer.handleCommand(selectedId, gridUI, () => {
            console.log("🔙 Exiting Video... Force Hiding Everything!");

            // Exit logic
            viewManager.currentView = 'media-library'; 
            
            const playerContainer = document.getElementById('video-player-container');
            const iframeEl = document.getElementById('youtube-iframe');
            const controlOverlay = document.getElementById('video-control-overlay');
            const mediaView = document.getElementById('media-view');
            const libraryGrid = document.getElementById('video-library-grid');

            if (playerContainer) {
                playerContainer.style.display = 'none'; 
                playerContainer.classList.add('hidden'); 
            }
            if (iframeEl) {
                iframeEl.style.display = 'none'; 
                iframeEl.src = ''; 
            }
            if (controlOverlay) {
                controlOverlay.style.display = 'none'; 
                controlOverlay.classList.add('hidden');
            }

            if (mediaView) {
                mediaView.style.display = 'block'; 
                mediaView.classList.remove('hidden');
            }
            
            if (libraryGrid) {
                libraryGrid.style.display = 'grid'; 
                libraryGrid.classList.remove('hidden');
            }

            console.log("🔄 Refreshing cards for Media Library...");
            gridUI.refreshCards('#video-library-grid .card');

            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        });

        if (actionResult === 'RESUMED') {
            viewManager.currentView = 'video-playing';
            stopScanning();
            setTimeout(() => { resetTriggerState(); }, 500);
            return;
        } else if (actionResult === 'STAY_IN_PANEL') {
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }
    } 
    
    // --- Audio Player ---
    else if (viewManager.currentView === 'audio-playing') {
        const actionResult = mediaManager.audioPlayer.handleCommand(selectedId, gridUI, () => {
            viewManager.currentView = 'media-library';
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        });

        if (actionResult === 'STAY') {
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        }
        return;
    }

    // Default fallback
    setTimeout(() => {
        resetTriggerState();
        if (!document.hidden && !sleepManager.isSleeping) startScanning();
    }, 3000);
}

function resetTriggerState() {
    isProcessingAction = false;
    isTriggering = false;
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