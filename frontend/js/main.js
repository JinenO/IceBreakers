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
        AlertService.toggleRoomLights(false);
        updateSystemMode('RESTING');
    },
    () => {
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(600, 'sine', 0.1);
        gridUI.currentIndex = -1;
        StatusService.updateStatus({ isResting: false });
        AlertService.toggleRoomLights(true);
        updateSystemMode('SCANNING');

        // ✨ FIX: Small delay for state (isEyesClosed) to settle after wake-up blink
        setTimeout(() => {
            startScanning();
        }, 50);
    }
);

window.showFeedback = showFeedback;

function updateSystemMode(mode) {
    const modeEl = document.getElementById('system-mode');
    const header = document.getElementById('status-bar');
    const footer = document.getElementById('sos-bar');

    if (!modeEl) return;
    modeEl.innerText = mode.toUpperCase();

    // Sync to Firebase for Mobile App
    if (typeof StatusService !== 'undefined') {
        StatusService.updateStatus({
            isResting: (mode === 'RESTING'),
            currentMode: mode
        });
    }

    // ✨ GLOBAL UI COLOR MANAGEMENT (Fixes "Stuck Panic" UI)
    if (mode === 'SOS' || mode === 'PANIC') {
        modeEl.style.background = 'rgba(255, 0, 0, 0.2)';
        modeEl.style.color = '#ff4d4d';
        modeEl.style.borderColor = 'rgba(255, 0, 0, 0.5)';
        if (header) header.style.background = '#8B0000'; // Dark Red
        if (footer) footer.style.background = '#8B0000';
    } else if (mode === 'RESTING') {
        modeEl.style.background = 'rgba(160, 174, 192, 0.2)';
        modeEl.style.color = '#a0aec0';
        modeEl.style.borderColor = 'rgba(160, 174, 192, 0.5)';
        if (header) header.style.background = '#0a0a0a';
        if (footer) footer.style.background = 'rgba(40, 0, 0, 0.8)';
    } else if (mode === 'FREEZE') {
        modeEl.style.background = 'rgba(255, 100, 100, 0.2)';
        modeEl.style.color = '#ff6464';
        modeEl.style.borderColor = 'rgba(255, 100, 100, 0.5)';
        if (header) header.style.background = 'rgba(100, 0, 0, 0.3)';
    } else {
        // Normal (SCANNING)
        modeEl.style.background = 'rgba(79, 209, 197, 0.1)';
        modeEl.style.color = '#4fd1c5';
        modeEl.style.borderColor = 'rgba(79, 209, 197, 0.3)';
        if (header) header.style.background = '#0a0a0a';
        if (footer) footer.style.background = 'rgba(40, 0, 0, 0.8)';
    }
}

// State
let scanTimer = null;
let isScanning = false;
let eyesClosedStartTime = 0;
let isEyesClosed = false;
let isProcessingAction = false;
let isFrozen = false;

// Panic Flutter State
let panicCountdownTimer = null;
let panicCountdownValue = 0;
let isPanicCountdownActive = false;
let lastPredictedHour = -1;

// --- Explosive Features State ---
let currentFocalQuadrant = 'center';
let blinkHistory = []; // Timestamps of recent blinks
let currentStressLevel = 'low'; // low, medium, high

const aiOverlay = document.getElementById('ai-prediction-overlay');
const aiActionText = document.getElementById('ai-predicted-action');
const aiProgress = document.getElementById('ai-confirm-progress');

let isPredicting = false;
let aiIgnoreTimer = null;
let aiConfirmAccumulator = 0;
let currentPredictedAction = '';

function showAIPrediction(actionName) {
    if (!aiOverlay || !aiActionText || !aiProgress) return;
    if (isPredicting || sleepManager.isSleeping || !actionName) return;

    currentPredictedAction = actionName;
    aiActionText.innerText = actionName;
    aiOverlay.classList.remove('hidden');
    isPredicting = true;
    aiConfirmAccumulator = 0;
    aiProgress.style.width = '0%';

    stopScanning();

    const utterance = new SpeechSynthesisUtterance(`Do you need ${actionName}?`);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    aiIgnoreTimer = setTimeout(() => {
        closeAIPrediction();
    }, 6000);
}

function closeAIPrediction() {
    if (!aiOverlay || !aiProgress) return;

    aiOverlay.classList.add('hidden');
    isPredicting = false;
    currentPredictedAction = '';
    aiConfirmAccumulator = 0;
    aiProgress.style.width = '0%';

    clearTimeout(aiIgnoreTimer);
    aiIgnoreTimer = null;

    if (!sleepManager.isSleeping && !isPanicCountdownActive && !document.hidden) {
        startScanning();
    }
}

window.showAIPrediction = showAIPrediction;

function handleAIPredictionInput(isNowClosed) {
    if (!isPredicting || !aiProgress) return false;

    if (isNowClosed) {
        aiConfirmAccumulator += 33;

        const percent = (aiConfirmAccumulator / 1000) * 100;
        aiProgress.style.width = `${Math.min(percent, 100)}%`;

        if (aiConfirmAccumulator >= 1000) {
            const confirmedAction = currentPredictedAction;
            closeAIPrediction();
            console.log('AI prediction confirmed:', confirmedAction);

            if (confirmedAction) {
                AlertService.sendSimpleAlert('AI_PREDICTED', confirmedAction);
                showFeedback(`PREDICTED: ${confirmedAction.toUpperCase()} ✅`, 'success');
                window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Confirmed. ${confirmedAction}`));
            }
        }
    } else {
        aiConfirmAccumulator = 0;
        aiProgress.style.width = '0%';
    }

    return true;
}

// Scan Target Setup
const KB_SCAN_SELECTOR = '#kb-grid .kb-card';
const MAIN_SCAN_SELECTOR = '#main-grid .card';
const SUB_SCAN_SELECTOR = '#sub-grid .card';
let kbScanTarget = KB_SCAN_SELECTOR;

// ==========================================
// ✨ NEW: IoT Device Control (Firebase Bridge)
// ==========================================
async function triggerIoTDevice() {
    console.log("⚡ Sending IoT Command to Firebase...");
    showFeedback("ACTIVATING DEVICE...", "info");

    try {
        // Send alert via your existing AlertService API to trigger the device
        AlertService.sendSimpleAlert('IOT_TRIGGER', 'Activating physical servo motor');

        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(800, 'sine', 0.2);
        showFeedback("DEVICE ACTIVATED", "success");
        window.speakText("Device activated.");

    } catch (err) {
        console.error("❌ IoT Trigger Failed:", err);
        showFeedback("FAILED TO CONNECT", "error");
    }
}

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
        triggerIoTDevice, // ✨ ADDED IOT FUNCTION HERE
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
    // 🛡️ SAFETY: Always clear old intervals before starting a new one
    // This prevents the "stuck" or "duplicate" scanner bugs.
    if (isScanning || scanTimer) stopScanning();

    isScanning = true;
    updateSystemMode('SCANNING');

    runScanStep();
}

function runScanStep() {
    if (!isScanning) return;
    
    if (sleepManager.isSleeping || isEyesClosed || sosSystem.state === 'ARMING') {
        scanTimer = setTimeout(runScanStep, 100); // Check again soon
        return;
    }

    // --- 🚀 QUADRANT-AWARE SPEED BOOST ---
    let scanSpeed = AppConfig.SCAN_SPEED;
    const currentCard = gridUI.cards[gridUI.currentIndex + 1] || gridUI.cards[0];
    
    if (currentCard && currentFocalQuadrant !== 'center') {
        const rect = currentCard.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const isLeft = rect.left < centerX;
        const isRight = rect.right > centerX;
        const isTop = rect.top < centerY;
        const isBottom = rect.bottom > centerY;
        
        let match = false;
        if (currentFocalQuadrant === 'top-left' && isTop && isLeft) match = true;
        if (currentFocalQuadrant === 'top-right' && isTop && isRight) match = true;
        if (currentFocalQuadrant === 'bottom-left' && isBottom && isLeft) match = true;
        if (currentFocalQuadrant === 'bottom-right' && isBottom && isRight) match = true;
        if (currentFocalQuadrant === 'top' && isTop) match = true;
        if (currentFocalQuadrant === 'bottom' && isBottom) match = true;
        if (currentFocalQuadrant === 'left' && isLeft) match = true;
        if (currentFocalQuadrant === 'right' && isRight) match = true;

        if (match) {
            scanSpeed = Math.max(800, scanSpeed - 1200); // Boost speed by 1.2s
            currentCard.style.boxShadow = '0 0 20px rgba(79, 209, 197, 0.6)';
        } else {
            currentCard.style.boxShadow = 'none';
        }
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
    gridUI.startScanBarAnimation(scanSpeed);
    sleepManager.recordRound(gridUI.currentIndex, gridUI.cards.length);

    // Schedule next step with dynamic speed
    scanTimer = setTimeout(runScanStep, scanSpeed);
}

function stopScanning() {
    isScanning = false;
    clearTimeout(scanTimer);
    scanTimer = null;
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
        card.dataset.index = index;
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
        card.dataset.index = index;
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
const WAKE_UP_OPEN_TIME = 2000;
let lastHeadMoveTime = 0;
let smoothedBrightness = 100;
let wakeUpOpenStartTime = 0;

async function handleEyeFrame(data) {
    // --- GAZE & FACE LOSS FREEZE MODE ---
    // If head is turned too far (Yaw > 25) or tilted too far (Pitch > 25), 
    // it means the patient is looking AWAY from the screen.
    const isLookingAway = data.headYaw !== undefined && (Math.abs(data.headYaw) > 25 || Math.abs(data.headPitch) > 20);

    if (data.faceVisible === false || isLookingAway) {
        if (!isFrozen) {
            console.log(data.faceVisible === false ? "❄️ SYSTEM FROZEN: Face not detected" : "❄️ SYSTEM FROZEN: Looking away");
            isFrozen = true;
            stopScanning();
            updateSystemMode('FREEZE');

            // Hard Reset Alarms
            sosSystem.reset();
            isEyesClosed = false;
            eyesClosedStartTime = 0;
            blinkCount = 0;
            gridUI.updateConfirmBar(0);

            if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(200, 'sine', 0.2);
        }
        return;
    }

    // Unfreeze logic
    if (isFrozen) {
        console.log("☀️ SYSTEM UN-FROZEN");
        isFrozen = false;
        if (sleepManager.isSleeping) {
            updateSystemMode('RESTING');
        } else {
            updateSystemMode('SCANNING');
            startScanning();
        }
    }

    const isNowClosed = data.eyeOpenness < 0.22;
    const now = Date.now();

    if (handleAIPredictionInput(isNowClosed)) {
        return;
    }

    // Update global quadrant for proactive scanning
    currentFocalQuadrant = data.focalQuadrant || 'center';

    // --- 🌙 ICU NIGHT MODE (Explosive Feature) ---
    if (data.ambientLight !== undefined && data.ambientLight < 15) {
        document.body.classList.add('icu-night-mode');
    } else {
        document.body.classList.remove('icu-night-mode');
    }

    // While resting, require continuously open eyes for 2 seconds to wake.
    if (sleepManager.isSleeping) {
        if (!isNowClosed) {
            if (wakeUpOpenStartTime === 0) {
                wakeUpOpenStartTime = now;
            } else if (now - wakeUpOpenStartTime >= WAKE_UP_OPEN_TIME) {
                sleepManager.wakeUp();
                wakeUpOpenStartTime = 0;
            }
        } else {
            // Any eye closure interrupts the wake-up cast.
            wakeUpOpenStartTime = 0;
        }
        return;
    }

    // --- 1. Auto-Brightness (Ward Lighting Compensation) ---
    if (data.ambientLight !== undefined) {
        const light = data.ambientLight;

        // Map to brightness range (dark -> brighter UI, bright -> dim UI) 
        const targetBrightness = 120 - (light / 255) * 40; 

        // Smooth transition (prevents flicker)
        smoothedBrightness += (targetBrightness - smoothedBrightness) * 0.1;

        // Clamp to safe range
        smoothedBrightness = Math.min(Math.max(smoothedBrightness, 90), 120);

        // Apply
        document.body.style.filter = `brightness(${smoothedBrightness.toFixed(0)}% `;
    }

    // --- 2. Head Pose Navigation (For users with slight neck mobility) ---
    if (data.headYaw !== undefined && viewManager.currentView === 'grid') {
        if (now - lastHeadMoveTime > 800) { // 800ms cooldown
            if (data.headYaw < -18) { // Turned Right
                console.log("🗣️ Head Tilt Right: Next Item");
                gridUI.navigate(1);
                lastHeadMoveTime = now;
                if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(400, 'sine', 0.05);
            } else if (data.headYaw > 18) { // Turned Left
                console.log("🗣️ Head Tilt Left: Prev Item");
                gridUI.navigate(-1);
                lastHeadMoveTime = now;
                if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(300, 'sine', 0.05);
            }
        }
    }

    // ✨ NEW: Panic Flutter Countdown Override
    if (isPanicCountdownActive) {
        if (isNowClosed) {
            if (!isEyesClosed) {
                isEyesClosed = true;
                eyesClosedStartTime = now;
            } else {
                const elapsed = now - eyesClosedStartTime;
                if (elapsed >= 1500) { // 1.5 seconds to cancel
                    clearInterval(panicCountdownTimer);
                    isPanicCountdownActive = false;


                    const countdownOverlay = document.getElementById('sos-countdown-overlay');
                    if (countdownOverlay) {
                        countdownOverlay.classList.remove('active');
                        setTimeout(() => countdownOverlay.classList.add('hidden'), 300);
                    }


                    window.speechSynthesis.cancel();
                    window.speakText("Emergency call cancelled.");
                    showFeedback("SOS CANCELLED", "info");


                    // ✨ FIX: Revert from 'PANIC' mode back to normal
                    updateSystemMode(sleepManager.isSleeping ? 'RESTING' : 'SCANNING');

                    isEyesClosed = false;
                    gridUI.updateConfirmBar(0);
                } else {
                    const progress = Math.min((elapsed / 1500) * 100, 100);
                    gridUI.updateConfirmBar(progress);
                }
            }
        } else {
            if (isEyesClosed) {
                isEyesClosed = false;
                gridUI.updateConfirmBar(0);
            }
        }
        return; // Skip normal eye processing
    }

    // ✨ FIX 1: Pause normal 3-second SOS while in Audio Rest Mode
    if (viewManager.currentView === 'audio-playing') {
        sosSystem.update(false); // Trick SOS into thinking eyes are open so patient can sleep
    } else {
        sosSystem.update(isNowClosed); // Normal SOS behavior everywhere else
    }

    if (now % 5000 < 100) {
        StatusService.updateStatus({ 
            eyeTrackerActive: !isNowClosed,
            stressLevel: currentStressLevel,
            focalQuadrant: currentFocalQuadrant
        });
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
                // ✨ SLEEP CANCELLATION LOGIC
                // If eyes remain continuously closed for more than 8 seconds,
                // assume sleep/fatigue and cancel SOS/enter Sleep Mode.
                if (elapsed >= 8000) {
                    console.log("💤 EXPLICIT SLEEP: Eyes closed for 8s");
                    sosSystem.reset();
                    sleepManager.enterSleep();

                    // Reset local counters to prevent multiple triggers
                    isEyesClosed = false;
                    eyesClosedStartTime = 0;
                    blinkCount = 0;
                    gridUI.updateConfirmBar(0);
                    return;
                }

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

            // Debounce: A real human blink takes at least 100ms (tuned up from 60ms).
            // Anything faster is usually 1-frame camera noise or jitter.
            if (elapsed > 100 && elapsed < 500) {
                blinkCount++;

                // --- 🧠 BLINK SENTIMENT ANALYSIS (Explosive Feature) ---
                blinkHistory.push(now);
                // Keep only last 30 seconds
                blinkHistory = blinkHistory.filter(ts => now - ts < 30000);
                
                if (blinkHistory.length > 15) currentStressLevel = 'high';
                else if (blinkHistory.length > 8) currentStressLevel = 'medium';
                else currentStressLevel = 'low';

                // Immediate trigger for Panic Flutter on the 4th blink!
                if (blinkCount === 4) {
                    if (blinkCommandTimer) clearTimeout(blinkCommandTimer);
                    executeBlinkCommand(4);
                    blinkCount = 0;
                    return;
                }

                if (blinkCommandTimer) clearTimeout(blinkCommandTimer);

                // Extended timeout to make stringing blinks easier
                blinkCommandTimer = setTimeout(() => {
                    executeBlinkCommand(blinkCount);
                    blinkCount = 0;
                }, 800); // Increased from 600ms to 800ms
            }
        }
    }
}

// ==========================================
// 3. EXECUTE COMMANDS (2x = Space, 3x = Toggle, 4x = Panic Flutter)
// ==========================================
async function executeBlinkCommand(count) {
    if (count === 4) {
        console.log("🚨 PANIC FLUTTER: Countdown Initiated");
        updateSystemMode('PANIC');

        isPanicCountdownActive = true;
        panicCountdownValue = 3;


        const countdownOverlay = document.getElementById('sos-countdown-overlay');
        const timerEl = document.getElementById('sos-countdown-timer');


        if (countdownOverlay) {
            countdownOverlay.classList.remove('hidden');
            setTimeout(() => countdownOverlay.classList.add('active'), 10);
        }
        if (timerEl) timerEl.innerText = panicCountdownValue;


        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("Emergency call triggered, sending in 3 seconds. To cancel, please keep your eyes closed once for a long period."));


        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(800, 'square', 0.2);

        panicCountdownTimer = setInterval(() => {
            panicCountdownValue--;
            if (timerEl) timerEl.innerText = panicCountdownValue;
            if (SoundUtils && SoundUtils.playBeep && panicCountdownValue > 0) SoundUtils.playBeep(800, 'square', 0.2);


            if (panicCountdownValue <= 0) {
                clearInterval(panicCountdownTimer);
                if (!isPanicCountdownActive) return; // Prevent race condition
                isPanicCountdownActive = false;


                if (countdownOverlay) {
                    countdownOverlay.classList.remove('active');
                    setTimeout(() => countdownOverlay.classList.add('hidden'), 300);
                }


                // Wake up system if resting
                if (sleepManager.isSleeping) {
                    sleepManager.wakeUp();
                    showFeedback("WAKING UP - PANIC SOS", "emergency");
                }

                // Trigger high-priority alert
                AlertService.sendSimpleAlert('SOS', 'PANIC FLUTTER: Immediate assistance required!');
                showFeedback("PANIC ALERT SENT! 🚨", "emergency");


                if (SoundUtils && SoundUtils.playBeep) {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => SoundUtils.playBeep(1200, 'square', 0.2), i * 150);
                    }
                }
                updateSystemMode('SOS');
            }
        }, 1000);
        return; // Exit here since we executed Panic Flutter
    }

    // ✨ VIDEO MODE: 2 Blinks to Play/Pause
    if (viewManager.currentView === 'video-playing') {
        if (count === 2) {
            console.log("⚡ COMMAND: TOGGLE PLAY/PAUSE (Double Blink)");
            const state = mediaManager.videoPlayer.togglePlayPause();
            showFeedback(state, "info");
        }
        return;
    }

    // ✨ AUDIO MODE
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

    const ZONE_DOWN = '#kb-grid .kb-card';
    const ZONE_UP = '#kb-prediction-bar .predict-btn';

    if (count === 2) {
        // Only inject space while keyboard is active to avoid accidental text edits.
        if (viewManager.currentView !== 'keyboard') {
            return;
        }

        console.log("⚡ COMMAND: SPACE");
        if (SoundUtils && SoundUtils.playBeep) SoundUtils.playBeep(500, 'sine', 0.05);

        handleKeyboardAction('kb-space', kbManager, gridUI, (target) => {
            kbScanTarget = target;
        });
    }
    else if (count === 3) {
        // Option A: KB Zone Toggle
        if (viewManager.currentView === 'keyboard') {
            console.log("⚡ COMMAND: TOGGLE ZONE");
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

// Predict the most likely action for the current hour using local behavior logs.
function getPredictedActionForCurrentTime() {
    let aiHistory = [];

    try {
        aiHistory = JSON.parse(localStorage.getItem('iris_ai_history')) || [];
    } catch (error) {
        console.warn('AI prediction parse failed:', error);
        return null;
    }

    if (aiHistory.length === 0) return null;

    const currentHour = new Date().getHours();
    const pastActionsInThisHour = aiHistory.filter((log) => log.hour === currentHour && typeof log.action === 'string');
    if (pastActionsInThisHour.length === 0) return null;

    const counts = {};
    pastActionsInThisHour.forEach((log) => {
        counts[log.action] = (counts[log.action] || 0) + 1;
    });

    let bestAction = null;
    let maxCount = 0;
    Object.entries(counts).forEach(([action, count]) => {
        if (count > maxCount) {
            maxCount = count;
            bestAction = action;
        }
    });

    const probability = maxCount / pastActionsInThisHour.length;
    if (probability >= 0.5 && maxCount >= 2) {
        console.log(
            `AI predicts [${bestAction}] this hour (probability: ${Math.round(probability * 100)}%)`
        );
        return bestAction;
    }

    return null;
}

function startAIClock() {
    console.log('AI prediction clock started. Checking once per minute...');

    setInterval(() => {
        const currentHour = new Date().getHours();
        const canPredict =
            currentHour !== lastPredictedHour &&
            !isPredicting &&
            !sleepManager.isSleeping &&
            !isPanicCountdownActive;

        if (!canPredict) return;

        const predictedAction = getPredictedActionForCurrentTime();
        if (predictedAction) {
            showAIPrediction(predictedAction);
            lastPredictedHour = currentHour;
        }
    }, 60000);
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

        try {
            console.log('🚀 System Initializing AI Engine...');
            await eyeEngine.init(handleEyeFrame);

            // Pass a restart callback so remote setting changes take effect immediately
            SettingsService.init(() => {
                if (isScanning) {
                    stopScanning();
                    startScanning();
                }
            });
            startScanning();
            console.log('✅ System Ready');
        } catch (err) {
            console.error('Init failed:', err);
            updateSystemMode('ERROR');
            alert(`Camera Error: ${err.message}`);
            throw err; // Re-throw to be caught by the click handler
        }
    };

    // Start Overlay Handler
    document.getElementById('start-overlay').addEventListener('click', async () => {
        const overlay = document.getElementById('start-overlay');
        overlay.style.display = 'none'; // Hide immediately for snappy feel

        try {
            await initSystem();
            updateSystemMode('SCANNING');
        } catch (err) {
            console.error(err);
        }
    }, { once: true }); // Use { once: true } to ensure it only runs once

    StatusService.startHeartbeat();
    initDevMode();

    startAIClock();

    updateSystemMode('STANDBY');
});