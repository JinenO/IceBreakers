import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';
import { SOSSystem } from './modules/sos.js';
import { SleepManager } from './modules/sleep-manager.js';
import { KeyboardManager } from './modules/keyboard-logic.js';
import { renderKeyboardMatrix, handleKeyboardAction } from './modules/keyboard-ui.js';
import { SUB_MENU_DATA, MAIN_MENU_DATA } from './data.js';
import { MediaManager } from './modules/media/media-manager.js';

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

function createCard(id, label, sub, icon) {
    const card = document.createElement('article');
    card.className = 'card';
    card.id = id;
    card.innerHTML = `
        <div class="scan-bar"></div>
        <div class="icon"><img src="assets/icons/${icon}" alt=""></div>
        <div class="label">${label}</div>
        <div class="sub-label">${sub}</div>
        <div class="confirm-bar"></div>
    `;
    return card;
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
const kbManager = new KeyboardManager();
const mediaManager = new MediaManager();
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
let keyboardMode = 'speak';
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
    if (currentView === 'keyboard') {
        selector = kbScanTarget;
    } else if (currentView === 'main') {
        selector = MAIN_SCAN_SELECTOR;
    } else if (currentView === 'sub') {
        selector = SUB_SCAN_SELECTOR;
    } else if (currentView === 'media-library') {
        selector = '#video-library-grid .card'; 
    } else if (currentView === 'video-panel') {
        selector = '#video-control-grid .card'; 
    } else if (currentView === 'audio-playing') {
        selector = '#audio-control-grid .card'; 
    }

    if (currentView === 'video-playing') return; 

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

    document.getElementById('keyboard-view').classList.add('hidden');

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
    gridUI.refreshCards(SUB_SCAN_SELECTOR);

    stopScanning();
    setTimeout(startScanning, 500);
}

function openKeyboard() {
    currentView = 'keyboard';
    kbManager.state = 'GROUP';
    kbScanTarget = KB_SCAN_SELECTOR;

    renderKeyboardMatrix(kbManager, gridUI);

    document.getElementById('main-grid').classList.add('hidden');
    document.getElementById('view-container').classList.add('hidden');
    document.getElementById('keyboard-view').classList.remove('hidden');

    stopScanning();
    setTimeout(() => {
        const selector = '#kb-prediction-bar .predict-btn, #kb-grid .kb-card';
        gridUI.refreshCards(selector);
        gridUI.currentIndex = 2;
        startScanning();
    }, 100);
}

function backToMain() {
    document.getElementById('view-container').classList.add('hidden');
    document.getElementById('main-grid').classList.remove('hidden');
    document.getElementById('keyboard-view').classList.add('hidden');

    if (statusText) {
        statusText.innerText = 'SYSTEM READY';
        statusText.style.color = '';
    }

    currentView = 'main';
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
        resetTriggerState();
        startScanning();
        return;
    }

    SoundUtils.playBeep(880, 'sine', 0.1);

    if (currentView === 'keyboard') {
        const callbacks = {
            onExit: () => {
                keyboardMode = 'speak';
                const sendLabel = document.querySelector('#kb-send .kb-label');
                if (sendLabel) sendLabel.innerText = 'SEND';
                backToMain();
                sleepManager.resetTimer();
            }
        };

        if (selectedId === 'kb-send') {
            const text = kbManager.currentText;
            if (text.trim().length > 0) {
                if (keyboardMode === 'youtube-search') {
                    mediaManager.youtubePlayer.searchAndRender(text, gridUI);

                    currentView = 'media-library';
                    setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
                } else {
                    sosSystem.speak(text);

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
            gridUI.updateConfirmBar(0);

            setTimeout(() => {
                resetTriggerState();
                if (!sleepManager.isSleeping) {
                    startScanning();
                }
            }, 800);
        });
        return;
    }

    if (currentView === 'main') {
        if (selectedId === 'c-kb') {
            openKeyboard();
            sleepManager.resetTimer();
            setTimeout(() => {
                isProcessingAction = false;
                isTriggering = false;
                startScanning();
            }, 500);
            return;
        }

        if (SUB_MENU_DATA[selectedId]) {
            openSubMenu(selectedId);
            sleepManager.resetTimer();
            setTimeout(() => {
                isProcessingAction = false;
                isTriggering = false;
                startScanning();
            }, 500);
            return;
        }
    } else if (currentView === 'sub') {
        if (selectedId === 'btn-back') {
            backToMain();
            sleepManager.resetTimer();
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }

        if (selectedId === 'cmd-youtube') {
            console.log('YouTube Triggered: Switching to Keyboard Search Mode');
            keyboardMode = 'youtube-search';
            currentView = 'keyboard';

            document.getElementById('view-container').classList.add('hidden');
            document.getElementById('keyboard-view').classList.remove('hidden');

            const sendLabel = document.querySelector('#kb-send .kb-label');
            if (sendLabel) sendLabel.innerText = 'SEARCH';

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
            currentView = 'media-library';

            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }
        
        console.log(`🚀 COMMAND SENT: ${selectedId}`);
        const msg = `${selectedId.toUpperCase()} SENT ✅`;
        showFeedback(msg, 'success');

        setTimeout(() => {
            sleepManager.resetTimer();
            isProcessingAction = false;
            isTriggering = false;
            isEyesClosed = false;
            if (!sleepManager.isSleeping) startScanning();
        }, 3000);
        return;
    } else if (currentView === 'media-library') {
        if (selectedId === 'media-lib-back') {
            mediaManager.exit();
            currentView = 'sub';
            gridUI.refreshCards('#sub-grid .card');
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        } else if (selectedId === 'yt-back-to-search') {
            keyboardMode = 'youtube-search';
            currentView = 'keyboard';

            document.getElementById('media-view').classList.add('hidden');
            document.getElementById('keyboard-view').classList.remove('hidden');

            renderKeyboardMatrix(kbManager, gridUI);
            kbScanTarget = KB_SCAN_SELECTOR;

            const sendLabel = document.querySelector('#kb-send .kb-label');
            if (sendLabel) sendLabel.innerText = 'SEARCH';

            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        } else if (selectedId.startsWith('vid-')) {
            mediaManager.videoPlayer.playVideo(selectedId);
            currentView = 'video-playing';
            stopScanning();
            setTimeout(() => { resetTriggerState(); }, 500);
            return;
        } else if (selectedId.startsWith('aud-')) {
            mediaManager.audioPlayer.openPlayer(selectedId, gridUI);
            currentView = 'audio-playing';
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }
    } else if (currentView === 'video-playing') {
        mediaManager.videoPlayer.showControlPanel(gridUI);
        currentView = 'video-panel';
        setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        return;
    } else if (currentView === 'video-panel') {
        const actionResult = mediaManager.videoPlayer.handleCommand(selectedId, gridUI, () => {
            currentView = 'media-library';
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        });

        if (actionResult === 'RESUMED') {
            currentView = 'video-playing';
            stopScanning();
            setTimeout(() => { resetTriggerState(); }, 500);
            return;
        } else if (actionResult === 'STAY_IN_PANEL') {
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }
    } else if (currentView === 'audio-playing') {
        const actionResult = mediaManager.audioPlayer.handleCommand(selectedId, gridUI, () => {
            currentView = 'media-library';
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        });

        if (actionResult === 'STAY') {
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        }
        return;
    }

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
