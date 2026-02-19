/* frontend/js/modules/keyboard-ui.js */

import { FREQUENCY_GROUPS } from './keyboard-logic.js';
import { AlertService } from '../api/alert-service.js';
import { showFeedback as _showFeedback } from '../modules/ui-utils.js';
window.showFeedback = _showFeedback;  


// Zones
const ZONE_DOWN = '#kb-grid .kb-card';
const ZONE_UP = '#kb-prediction-bar .predict-btn';

// Offline Dictionary
const OFFLINE_PREDICTIONS = {
    "I": ["I AM HUNGRY", "I WANT WATER", "I NEED HELP"],
    "YOU": ["YOU ARE KIND", "CAN YOU HELP ME?", "HOW ARE YOU?"],
    "HE": ["HE IS HERE", "WHO IS HE?", "HE IS HELPING"],
    "SHE": ["SHE IS HERE", "WHO IS SHE?", "SHE IS HELPING"],
    "WE": ["WE ARE READY", "CAN WE GO?", "WE NEED TIME"],
    "IT": ["IT HURTS", "IT IS GOOD", "IT IS OKAY"],
    "THIS": ["THIS IS GOOD", "I WANT THIS", "WHAT IS THIS?"],
    "THAT": ["I WANT THAT", "THAT IS GOOD", "THAT IS WRONG"],
    "THE": ["THE TIME IS NOW", "WHERE IS THE NURSE?", "OPEN THE DOOR"],
    "A": ["I NEED A BREAK", "JUST A MOMENT", "IT IS A GOOD DAY"],
    "HELLO": ["HELLO THERE", "HELLO FRIEND", "HELLO WORLD"],
    "THANK": ["THANK YOU", "THANKS A LOT", "THANK YOU SO MUCH"],
    "YES": ["YES PLEASE", "YES I DO", "YES THAT IS CORRECT"],
    "NO": ["NO THANK YOU", "NO PROBLEM", "NO NOT NOW"]
};

// Helper: Safe Predictions
async function getSafePredictions(kbManager) {
    const text = kbManager.currentText.trim();
    try {
        console.log("☁️ Asking Google API...");
        const words = await kbManager.getPredictions(kbManager.currentText);

        if (words && words.length > 0) {
            return words.map(w => w.toUpperCase());
        }
        throw new Error("Empty API result");
    } catch (err) {
        console.warn("⚠️ API Limit/Error. Using Dictionary.");
        const lastWord = text.split(' ').pop().toUpperCase();
        return OFFLINE_PREDICTIONS[lastWord] || ["IS", "AND", "THE"];
    }
}

function createKbCard(className, id, label, sub, icon) {
    const div = document.createElement('div');
    div.className = className;
    div.id = id;
    const iconHtml = icon ? `<div class="kb-icon"><img src="assets/icons/${icon}" alt="${label}"></div>` : '';
    div.innerHTML = `
        ${iconHtml}
        <div class="kb-text">
            <div class="kb-label">${label}</div>
            ${sub ? `<div class="kb-sub">${sub}</div>` : ''}
        </div>
        <div class="scan-bar"></div><div class="confirm-bar"></div>
    `;
    return div;
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================

export function renderKeyboardMatrix(kbManager, gridUI) {
    const kbGrid = document.getElementById('kb-grid');
    if (!kbGrid) return;
    kbGrid.innerHTML = '';

    FREQUENCY_GROUPS.forEach((group) => {
        const card = createKbCard('kb-card group', group.id, group.label.toUpperCase(), '');
        kbGrid.appendChild(card);
    });

    const sendCard = createKbCard('kb-card send', 'kb-send', 'SEND', 'To Caregiver', 'send.png');
    kbGrid.appendChild(sendCard);

    const bottomTools = [
        { id: 'kb-delete', label: 'DEL', sub: 'Backspace', type: 'delete', icon: 'delete.png' },
        { id: 'kb-space', label: 'SPACE', sub: 'Add Space', type: 'tool', icon: 'space.png' },
        { id: 'kb-tools', label: 'TOOLS', sub: 'More', type: 'tool', icon: 'tools.png' }
    ];

    bottomTools.forEach((tool) => {
        const card = createKbCard(`kb-card ${tool.type}`, tool.id, tool.label, tool.sub, tool.icon);
        kbGrid.appendChild(card);
    });

    kbManager.state = 'GROUP';
    updatePredictions(kbManager.currentPredictions || []);

    setTimeout(() => {
        gridUI.refreshCards(ZONE_DOWN);
        gridUI.currentIndex = -1;
    }, 10);
    updateDisplay(kbManager);
}

export function renderLetters(groupId, kbManager, gridUI) {
    const group = FREQUENCY_GROUPS.find((item) => item.id === groupId);
    if (!group) return;
    const kbGrid = document.getElementById('kb-grid');
    kbGrid.innerHTML = '';

    group.letters.forEach((char) => {
        const upperChar = char.toUpperCase();
        const card = createKbCard('kb-card group', `char-${upperChar}`, upperChar, '');
        kbGrid.appendChild(card);
    });

    const actions = [
        { id: 'kb-back-group', label: 'BACK', type: 'tool', icon: 'back.png' },
        { id: 'kb-space', label: 'SPACE', type: 'tool', icon: 'space.png' },
        { id: 'kb-delete', label: 'DEL', type: 'delete', icon: 'delete.png' }
    ];

    actions.forEach((action) => {
        const card = createKbCard(`kb-card ${action.type}`, action.id, action.label, '', action.icon);
        kbGrid.appendChild(card);
    });

    kbManager.state = 'LETTER';
    gridUI.refreshCards(ZONE_DOWN);
    gridUI.currentIndex = -1;
}

// ✨ UPDATED DISPLAY: Makes Spaces Visible!
export function updateDisplay(kbManager) {
    const display = document.getElementById('kb-current-text');
    if (display) {
        let text = kbManager.currentText;

        // 1. Prevent HTML Injection
        let safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // 2. Make ALL spaces wide (Non-Breaking Spaces)
        safeText = safeText.replace(/ /g, "&nbsp;");

        // 3. ✨ VISUAL CURSOR: If the last char is a space, UNDERLINE IT
        // This makes "Hello " look like "Hello_" so you know the space is there.
        if (text.endsWith(' ')) {
            // Remove the last &nbsp; and replace it with a styled one
            safeText = safeText.slice(0, -6) + '<span style="border-bottom: 3px solid #4fd1c5; display:inline-block; min-width:10px;">&nbsp;</span>';
        }

        display.innerHTML = safeText;
    }
}

export function updatePredictions(words) {
    const bar = document.getElementById('kb-prediction-bar');
    if (!bar) return;
    if (!document.getElementById('pred-0')) {
        bar.innerHTML = `
            <div class="kb-card predict-btn" id="pred-0"><span class="word"></span><div class="scan-bar"></div><div class="confirm-bar"></div></div>
            <div class="kb-card predict-btn" id="pred-1"><span class="word"></span><div class="scan-bar"></div><div class="confirm-bar"></div></div>
            <div class="kb-card predict-btn" id="pred-2"><span class="word"></span><div class="scan-bar"></div><div class="confirm-bar"></div></div>
        `;
    }
    for (let i = 0; i < 3; i += 1) {
        const btn = document.getElementById(`pred-${i}`);
        if (!btn) continue;
        const wordSpan = btn.querySelector('.word');

        if (words && words[i] && words[i] !== "...") {
            wordSpan.innerText = words[i].toUpperCase();
            btn.classList.add('has-word');
        } else {
            wordSpan.innerText = (words && words[i] === "...") ? "..." : "";
            btn.classList.remove('has-word');
        }
    }
}

export function renderTools(kbManager, gridUI) {
    const kbGrid = document.getElementById('kb-grid');
    if (!kbGrid) return;
    kbGrid.innerHTML = '';

    const tools = [
        { id: 'tool-exit', label: 'EXIT', sub: 'Main Menu', type: 'delete', icon: 'exit.png' },
        { id: 'tool-speak', label: 'SPEAK', sub: 'Read Aloud', type: 'tool', icon: 'speak.png' },
        { id: 'tool-clear', label: 'CLEAR', sub: 'Delete All', type: 'delete', icon: 'clear.png' },
        { id: 'tool-yes', label: 'YES', sub: 'Quick Reply', type: 'tool', icon: 'yes.png' },
        { id: 'tool-no', label: 'NO', sub: 'Quick Reply', type: 'tool', icon: 'no.png' },
        { id: 'tool-thanks', label: 'THANKS', sub: 'Quick Reply', type: 'tool', icon: 'thank.png' },
        { id: 'tool-stop', label: 'STOP', sub: 'Stop Audio', type: 'tool', icon: 'stop.png' },
        { id: 'tool-back', label: 'BACK', sub: 'To Keyboard', type: 'group', icon: 'back.png' }
    ];

    tools.forEach((tool) => {
        const card = createKbCard(`kb-card ${tool.type}`, tool.id, tool.label, tool.sub, tool.icon);
        kbGrid.appendChild(card);
    });

    kbManager.state = 'TOOLS';
    gridUI.refreshCards(ZONE_DOWN);
}

// ==========================================
// HANDLE ACTION
// ==========================================
export async function handleKeyboardAction(id, kbManager, gridUI, setScanTarget, callbacks) {

    // --- SEND ---
    if (id === 'kb-send') {
        const message = kbManager.currentText.trim();
        if (!message) return;

        try {
            AlertService.sendSimpleAlert('message', message);
            console.log("✅ SENT TO ALERT SERVICE");
            window.showFeedback(`MESSAGE SENT ✅`, 'success');  
        } catch(e) {
            console.error("❌ ALERT ERROR:", e);
        }

        kbManager.speak();
        kbManager.clear();
        updateDisplay(kbManager);

        if (callbacks && callbacks.onExit)
            setTimeout(() => callbacks.onExit(), 3000);
    }

    // --- NAVIGATION ---
    if (id === 'tool-back' || id === 'kb-tools' || id === 'kb-back-group') {
        if (id === 'kb-tools') renderTools(kbManager, gridUI);
        else renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }

    // --- DELETE ---
    if (id === 'kb-delete') {
        kbManager.deleteLast();
        updateDisplay(kbManager);
        updatePredictions(["", "", ""]);
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }

    // --- SPACE ---
    if (id === 'kb-space') {
        kbManager.addChar(' ');
        updateDisplay(kbManager);

        // ✨ VISUAL FEEDBACK: Show user they clicked space
        if (window.showFeedback) window.showFeedback('SPACE ADDED ␣', 'success');

        updatePredictions(["...", "...", "..."]);
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);

        getSafePredictions(kbManager).then(words => {
            kbManager.currentPredictions = words;
            updatePredictions(words);
        });
        return;
    }

    // --- CLICKING A PREDICTION ---
    if (id.startsWith('pred-')) {
        const index = Number(id.replace('pred-', ''));
        const sentence = kbManager.currentPredictions[index];

        if (sentence) {
            // SENTENCE MODE: Replace text with selected sentence
            kbManager.currentText = sentence.toUpperCase() + ' ';

            kbManager.currentPredictions = [];
            updateDisplay(kbManager);

            // 1. Reset Matrix
            renderKeyboardMatrix(kbManager, gridUI);

            // 2. Force Scanner Down
            setScanTarget(ZONE_DOWN);

            // 3. Force Visual Cleanup
            const bar = document.getElementById('kb-prediction-bar');
            if (bar) {
                bar.style.borderColor = 'transparent';
                bar.style.boxShadow = 'none';
            }
            document.getElementById('kb-grid').style.opacity = '1';
            gridUI.refreshCards(ZONE_DOWN);
            gridUI.currentIndex = -1;

            updatePredictions(["", "", ""]);
        }
        return;
    }

    // --- GROUPS ---
    if (id.startsWith('g')) {
        renderLetters(id, kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }

    // --- CHARACTERS ---
    if (id.startsWith('char-')) {
        const char = id.split('-')[1];
        kbManager.addChar(char);

        updateDisplay(kbManager);
        updatePredictions(["", "", ""]);
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }

    if (id === 'tool-speak') { kbManager.speak(); return; }
    if (id === 'tool-stop') { window.speechSynthesis.cancel(); return; }
    if (id === 'tool-clear') {
        kbManager.clear();
        updateDisplay(kbManager);
        updatePredictions(["", "", ""]);
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }
    if (id === 'tool-exit') { if (callbacks && callbacks.onExit) callbacks.onExit(); return; }
    if (['tool-yes', 'tool-no', 'tool-thanks'].includes(id)) {
        const text = id === 'tool-yes' ? 'YES' : id === 'tool-no' ? 'NO' : 'THANK YOU';
        kbManager.speakText(text);
        return;
    }
}