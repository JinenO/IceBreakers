import { MAIN_MENU_DATA } from '../data.js';

let feedbackTimer = null; // ✨ FIX: Prevents messages from deleting each other

export function showFeedback(message, type = 'success') {
    const overlay = document.getElementById('feedback-overlay');
    const text = document.getElementById('fb-text');

    if (!overlay || !text) return;

    text.innerText = message;

    overlay.className = 'feedback-overlay';
    overlay.classList.add(type);
    overlay.classList.remove('hidden');

    // ✨ FIX: Clear the old timer so the new message stays for the full 6 seconds
    if (feedbackTimer) clearTimeout(feedbackTimer);

    feedbackTimer = setTimeout(() => {
        overlay.classList.add('hidden');
    }, 2000);
}

export function renderMainGrid() {
    const mainGrid = document.getElementById('main-grid');
    if (!mainGrid) return;

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