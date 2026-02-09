/* ============================================
   IRIS FLOW - Main Controller
   ============================================ */
import { AppConfig } from './config.js';
import { GridUI } from './modules/grid-ui.js';
import { EyeEngine } from './core/eye-engine.js';
import { SoundUtils } from './utils/sound.js';
import { SUB_MENU_DATA, MAIN_MENU_DATA } from './data.js';

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

// State
let scanTimer = null;
let isScanning = false;
let eyesClosedStartTime = 0;
let isEyesClosed = false;
let currentView = 'main';

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
    if (isEyesClosed) return;

    gridUI.highlightNext();
    gridUI.startScanBarAnimation(AppConfig.SCAN_SPEED);
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
    const viewTitle = document.getElementById('view-title');

    subGrid.innerHTML = '';
    viewTitle.innerText = menuData.title;

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

    currentView = 'main';
    gridUI.refreshCards('#main-grid');

    stopScanning();
    setTimeout(startScanning, 500);
}

// ==========================================
// 2. Eye frame callback
// ==========================================
function handleEyeFrame(data) {
    const openness = data.eyeOpenness;
    const eyeIcon = document.getElementById('eye-icon');

    if (openness < AppConfig.BLINK_THRESHOLD) {
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
    if (isTriggering) return;
    isTriggering = true;

    stopScanning();

    const selectedId = gridUI.getCurrentId();
    console.log(`✅ SELECTED: ${selectedId}`);

    SoundUtils.playBeep(880, 'sine', 0.1);

    if (currentView === 'main') {
        if (SUB_MENU_DATA[selectedId]) {
            openSubMenu(selectedId);
        } else {
            console.log('No sub-menu for this item, maybe direct action.');
        }
    } else if (currentView === 'sub') {
        if (selectedId === 'btn-back') {
            backToMain();
        } else {
            console.log(`🚀 SENDING COMMAND: ${selectedId}`);

            const card = document.getElementById(selectedId);
            if (card) card.style.background = '#00e676';

            setTimeout(() => {
                if (card) card.style.background = '';
                startScanning();
            }, 1000);
        }
    }

    setTimeout(() => {
        isTriggering = false;
        if (!isScanning) startScanning();
    }, 1500);
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
