import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';
import { SOSSystem } from './modules/sos.js';
import { SleepManager } from './modules/sleep-manager.js';
import { KeyboardManager } from './modules/keyboard-logic.js';
import { renderKeyboardMatrix, handleKeyboardAction } from './modules/keyboard-ui.js';
import { SUB_MENU_DATA } from './data.js';
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

    if (viewManager.currentView === 'keyboard') {
        const callbacks = {
            onExit: () => {
                viewManager.keyboardMode = 'speak';
                const sendLabel = document.querySelector('#kb-send .kb-label');
                if (sendLabel) sendLabel.innerText = 'SEND';
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

    if (viewManager.currentView === 'main') {
        if (selectedId === 'c-kb') {
            kbScanTarget = viewManager.goKeyboard('speak');

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
    } else if (viewManager.currentView === 'sub') {
        if (selectedId === 'btn-back') {
            backToMain();
            sleepManager.resetTimer();
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }

        // 🔴 2. 核心拦截：如果是 YouTube，直接去键盘部门
        if (selectedId === 'cmd-youtube') {
            console.log("🎬 YouTube Triggered: Switching to Keyboard Search Mode");
            kbScanTarget = viewManager.goKeyboard('youtube-search');

            // 重新启动键盘扫描
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
    } else if (viewManager.currentView === 'media-library') {
        if (selectedId === 'yt-back') {
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
            stopScanning();
            setTimeout(() => { resetTriggerState(); }, 500);
            return;
        } else if (selectedId.startsWith('aud-')) {
            mediaManager.audioPlayer.openPlayer(selectedId, gridUI);
            viewManager.currentView = 'audio-playing';
            setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
            return;
        }
    } else if (viewManager.currentView === 'video-playing') {
        mediaManager.videoPlayer.showControlPanel(gridUI);
        viewManager.currentView = 'video-panel';
        setTimeout(() => { resetTriggerState(); startScanning(); }, 500);
        return;
    } else if (viewManager.currentView === 'video-panel') {
        const actionResult = mediaManager.videoPlayer.handleCommand(selectedId, gridUI, () => {
            console.log("🔙 Exiting Video... Force Hiding Everything!");

            // 1. 切换逻辑状态
            viewManager.currentView = 'media-library'; 
            
            // 2. 获取所有"嫌疑人"元素
            const playerContainer = document.getElementById('video-player-container');
            const iframeEl = document.getElementById('youtube-iframe');
            const controlOverlay = document.getElementById('video-control-overlay');
            const mediaView = document.getElementById('media-view');
            const libraryGrid = document.getElementById('video-library-grid');

            // 3. ☢️ 核武器攻击：直接修改 style.display，无视 CSS Class
            // 强制隐藏播放器
            if (playerContainer) {
                playerContainer.style.display = 'none'; // 强制消失
                playerContainer.classList.add('hidden'); // 双重保险
            }
            if (iframeEl) {
                iframeEl.style.display = 'none'; // 强制消失
                iframeEl.src = ''; // 停止加载
            }
            if (controlOverlay) {
                controlOverlay.style.display = 'none'; 
                controlOverlay.classList.add('hidden');
            }

            // 4. 强制显示选片列表
            if (mediaView) {
                mediaView.style.display = 'block'; // 确保父容器显示
                mediaView.classList.remove('hidden');
            }
            
            // 5. 确保 Grid 也是显示的 (有些布局可能会把它隐藏)
            if (libraryGrid) {
                libraryGrid.style.display = 'grid'; // 确保网格布局恢复
                libraryGrid.classList.remove('hidden');
            }

            // 6. 重新让扫描器工作
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
    } else if (viewManager.currentView === 'audio-playing') {
        const actionResult = mediaManager.audioPlayer.handleCommand(selectedId, gridUI, () => {
            viewManager.currentView = 'media-library';
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
// 4. Entry point (Modified for ALS Context)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const startOverlay = document.getElementById('start-overlay');

    const initSystem = async () => {
        // 1. 播放一个极短的静音，骗过浏览器，解锁 AudioContext
        SoundUtils.unlock();
        SoundUtils.playBeep(440, 'sine', 0.1);

        // 2. 隐藏启动屏
        startOverlay.style.opacity = '0';
        startOverlay.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            startOverlay.classList.add('hidden');
        }, 500);

        // 3. 只有点击后，才启动摄像头和眼动追踪
        try {
            console.log('🚀 System Initialized by User Interaction');
            await eyeEngine.init(handleEyeFrame);
            startScanning();
        } catch (err) {
            console.error('Init failed:', err);
            alert(`Camera Error: ${err.message}`);
        }
    };

    // 监听点击
    startOverlay.addEventListener('click', initSystem, { once: true });
});
