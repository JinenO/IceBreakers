import { AppConfig, GEMINI_API_KEY } from './config.js';

/**
 * Gemini AI Intent Expansion
 * Expands short text (e.g. "Cold") into a full intent (e.g. "I am too cold, please help me warm up")
 */
window.expandIntentWithAI = async function (text) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PASTE_YOUR_GEMINI_KEY_HERE') {
        console.warn("⚠️ Gemini API Key missing. Skipping expansion.");
        return text;
    }

    console.log(`🤖 AI: Expanding intent for "${text}"...`);

    // --- DEMO MODE FALLBACK ---
    const demoMap = {
        'water': 'I would like some water, please.',
        'food': 'I am feeling hungry, could I have something to eat?',
        'toilet': 'I need to use the bathroom, please help me.',
        'meds': 'I am in pain, can I have my medication?',
        'suction': 'My throat needs suctioning, I am having trouble breathing.',
        'roll': 'I need to be rolled over to a different position.',
        'legs': 'Could you please help me move my legs?',
        'too-cold': 'I am too cold, please help me warm up.',
        'too-hot': 'I am too hot, please help me cool down.',
        'just-right': 'I am feeling much better now, thank you.',
        'itch': 'I have an itch, could you help me scratch it?',
        'head': 'My head is feeling itchy, could you please scratch it?',
        'back': 'My back is itchy, please help me scratch it.',
        'arm': 'My arm is itchy, please help me scratch it.',
        'leg': 'My leg is itchy, please help me scratch it.',
        'yes': 'Yes, that is correct.',
        'no': 'No, thank you.',
        'hello': 'Hello, how are you today?',
        'thanks': 'Thank you so much for your help.',
        'love': 'I love you!'
    };
    const key = text.toLowerCase().trim();
    if (demoMap[key]) {
        console.log(`✨ Demo expansion: "${demoMap[key]}"`);
        return demoMap[key];
    }

    try {
        // v1beta is often required for the latest flash models
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        console.log(`🔗 AI URL: ${url.replace(GEMINI_API_KEY, 'API_KEY_HIDDEN')}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an assistive communication assistant for a patient with severe motor impairment. 
                        The patient has typed a short keyword or selected a category. 
                        Expand this into a short, clear, and polite sentence describing their intent to a caregiver.
                        Keep it under 15 words.
                        
                        Input: "Cold" -> Output: "I am feeling too cold, please help me warm up."
                        Input: "Water" -> Output: "I would like some water, please."
                        Input: "${text}" -> Output:`
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ Gemini API Error (${response.status}):`, JSON.stringify(errorData, null, 2));

            // If 404, maybe the model name is different? Try a fallback if needed in future
            return text;
        }

        const data = await response.json();
        const expanded = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
        console.log(`✨ AI Expanded: "${expanded}"`);
        return expanded;
    } catch (err) {
        console.error("❌ Gemini Error:", err);
        return text;
    }
};
/**
 * Global TTS Helper
 * Speaks the provided text using the Web Speech API
 */
window.speakText = function (text) {
    if (!text) return;
    try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find((voice) => voice.lang.includes('en'));
        if (enVoice) utterance.voice = enVoice;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error('TTS Error:', e);
    }
};

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
import { AlertService } from './api/alert-service.js';

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
    () => {
        stopScanning();
        StatusService.updateStatus({ isResting: true });
    },
    () => {
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(600, 'sine', 0.1);
        gridUI.currentIndex = -1;
        startScanning();
        StatusService.updateStatus({ isResting: false });
    }
);

window.showFeedback = showFeedback;

// State
let scanTimer = null;
let isScanning = false;
let eyesClosedStartTime = 0;
let isEyesClosed = false;
let isProcessingAction = false;

// Scan Target Setup
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
    if (!menuData) {
        // ✨ SAFETY NET: Prevents system freeze if an invalid menu ID is passed
        resetTriggerState();
        startScanning();
        return;
    }

    gridUI.clearHighlights();
    const subGrid = document.getElementById('sub-grid');
    subGrid.innerHTML = '';

    menuData.items.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'card';

        // Ensure nav back button is properly identified
        let cardId = `cmd-${item.id}`;
        if ((item.id === 'back' || item.label === 'BACK') && index === menuData.items.length - 1) {
            cardId = 'btn-back';
        }

        card.id = cardId;
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

    // ✨ FIX: Wait for DOM to draw cards before scanning
    requestAnimationFrame(() => {
        gridUI.refreshCards(SUB_SCAN_SELECTOR);
        gridUI.currentIndex = -1;
        stopScanning();
        setTimeout(() => {
            resetTriggerState();
            startScanning();
        }, 50);
    });
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
        resetTriggerState();
        startScanning();
    }
}

function openBodyDetailMenu(type) {
    const detailData = BODY_DETAILS_DATA[type];
    if (!detailData) {
        resetTriggerState();
        startScanning();
        return;
    }

    gridUI.clearHighlights();
    const subGrid = document.getElementById('sub-grid');
    subGrid.innerHTML = '';

    detailData.items.forEach((item, index) => {
        const card = document.createElement('article');
        card.className = 'card';

        // ✨ BUG FIX: Prevent ID collision between body part "Back" and nav "Back"
        // This ensures ONLY the last item gets the 'body-back' ID.
        let cardId = `detail-${item.id}`;
        if ((item.id === 'back' || item.label === 'BACK') && index === detailData.items.length - 1) {
            cardId = 'body-back';
        }

        card.id = cardId;
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

    // ✨ FIX: Wait for DOM to draw cards before scanning
    requestAnimationFrame(() => {
        gridUI.refreshCards('#sub-grid .card');
        gridUI.currentIndex = -1;
        stopScanning();
        setTimeout(() => {
            resetTriggerState();
            startScanning();
        }, 50);
    });
}

function openKeyboard() {
    gridUI.clearHighlights();
    kbScanTarget = viewManager.goKeyboard('speak');

    stopScanning();
    requestAnimationFrame(() => {
        const selector = '#kb-grid .kb-card';
        gridUI.refreshCards(selector);
        gridUI.currentIndex = -1;
        resetTriggerState();
        startScanning();
    });
}

function backToMain() {
    gridUI.clearHighlights();
    viewManager.goMain();

    requestAnimationFrame(() => {
        gridUI.refreshCards(MAIN_SCAN_SELECTOR);
        gridUI.currentIndex = -1;
        stopScanning();
        setTimeout(() => {
            resetTriggerState();
            startScanning();
        }, 50);
    });
}

// ==========================================
// 2. Eye frame callback (Blink Logic)
// ==========================================
let blinkCount = 0;
let blinkCommandTimer = null;
const BLINK_TIMEOUT = 600;
const CLICK_HOLD_TIME = 1000;

async function handleEyeFrame(data) {
    const isNowClosed = data.eyeOpenness < AppConfig.BLINK_THRESHOLD;
    const now = Date.now();

    // ✨ FIX 1: Pause normal 3-second SOS while in Audio Rest Mode
    if (viewManager.currentView === 'audio-playing') {
        sosSystem.update(false); // Trick SOS into thinking eyes are open so patient can sleep
    } else {
        sosSystem.update(isNowClosed); // Normal SOS behavior everywhere else
    }

    if (now % 5000 < 100) {
        StatusService.updateStatus({ eyeTrackerActive: !isNowClosed });
    }

    if (isNowClosed) {
        if (!isEyesClosed) {
            isEyesClosed = true;
            eyesClosedStartTime = now;
        } else {
            const elapsed = now - eyesClosedStartTime;

            let holdTimeRequired = CLICK_HOLD_TIME;

            if (viewManager.currentView === 'video-playing') {
                holdTimeRequired = 2000; // 2 seconds to pop out video settings
            } else if (viewManager.currentView === 'audio-playing') {
                holdTimeRequired = 9999999; // AUDIO REST MODE: Ignore held eyes
            }

            if (elapsed >= holdTimeRequired && !isProcessingAction) {
                if (sosSystem.state === 'CHARGING' || sosSystem.state === 'IDLE') {
                    console.log('✅ Long Blink: Triggering Click');
                    gridUI.updateConfirmBar(100);
                    await triggerSelection();
                    isProcessingAction = true;
                    blinkCount = 0;
                }
            } else {
                const progress = Math.min((elapsed / holdTimeRequired) * 100, 100);
                gridUI.updateConfirmBar(progress);
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

                // ✨ FIX 2: SAFETY FEATURE: The Panic Flutter (4 rapid blinks = INSTANT SOS)
                // ✨ UPDATED SAFETY: The Panic Flutter (Only active during Audio/Music)
                // This prevents accidental SOS while the user is typing or browsing.
                if (blinkCount >= 4 && viewManager.currentView === 'audio-playing') {
                    console.log("🚨 AUDIO PANIC FLUTTER DETECTED!");
                    if (blinkCommandTimer) clearTimeout(blinkCommandTimer);
                    blinkCount = 0;

                    // 1. Send Alert instantly to Caregiver Dashboard
                    AlertService.sendSimpleAlert('sos', 'emergency');

                    // 2. Show massive red feedback on the screen
                    showFeedback("🚨 EMERGENCY ALARM SENT 🚨", "error");

                    // 3. Scream for help out loud using the speakers
                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Emergency! Caregiver needed immediately!"));

                    return;
                }

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
    // ✨ VIDEO MODE: 2 Blinks to Play/Pause
    if (viewManager.currentView === 'video-playing') {
        if (count === 2) {
            console.log("⚡ COMMAND: TOGGLE PLAY/PAUSE (Double Blink)");
            const state = mediaManager.videoPlayer.togglePlayPause();
            showFeedback(state, "info");
        }
        return;
    }

    // ✨ AUDIO MODE (New!)
    if (viewManager.currentView === 'audio-playing') {
        if (count === 2) {
            console.log("⚡ COMMAND: AUDIO PLAY/PAUSE");
            const audioEl = document.getElementById('main-audio');
            if (audioEl) {
                if (audioEl.paused) { audioEl.play(); showFeedback("PLAYING", "success"); }
                else { audioEl.pause(); showFeedback("PAUSED", "info"); }
            }
        } else if (count === 3) {
            console.log("⚡ COMMAND: WAKE AUDIO MENU");
            triggerSelection(); // Wakes up the UI panel
        }
        return;
    }

    if (viewManager.currentView !== 'keyboard') return;

    const ZONE_DOWN = '#kb-grid .kb-card';
    const ZONE_UP = '#kb-prediction-bar .predict-btn';

    if (count === 2) {
        console.log("⚡ COMMAND: SPACE");
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(500, 'sine', 0.05);

        handleKeyboardAction('kb-space', kbManager, gridUI, (target) => {
            kbScanTarget = target;
        });
    }
    else if (count === 3) {
        console.log("⚡ COMMAND: TOGGLE ZONE");
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
    else if (count === 4) {
        console.log("🚨 PANIC FLUTTER: High Priority SOS");

        // Instant visual & audio feedback
        if (SoundUtils && SoundUtils.playBeep) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => SoundUtils.playBeep(1200, 'square', 0.2), i * 150);
            }
        }

        // Wake up system if resting
        if (sleepManager.isSleeping) {
            sleepManager.wakeUp();
            showFeedback("WAKING UP - PANIC SOS", "emergency");
        }

        // Trigger high-priority alert
        AlertService.sendSimpleAlert('SOS', 'PANIC FLUTTER: Immediate assistance required!');
        showFeedback("PANIC ALERT SENT! 🚨", "emergency");
    }
}

// ==========================================
// 4. Trigger selection & Developer Mode
// ==========================================
let isTriggering = false;

async function triggerSelection() {
    await actionController.triggerSelection();
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

        console.log(`Mouse Clicked: ${target.id}`);
        const index = gridUI.cards.findIndex(card => card.id === target.id);

        if (index !== -1) {
            stopScanning();
            gridUI.currentIndex = index;
            gridUI.highlightCard(index);

            setTimeout(async () => {
                await triggerSelection();
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
            SettingsService.init();
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