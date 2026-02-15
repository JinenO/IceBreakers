/* frontend/js/modules/keyboard-ui.js */

import { FREQUENCY_GROUPS } from './keyboard-logic.js';

const KB_SCAN_SELECTOR = '#kb-prediction-bar .predict-btn, #kb-grid .kb-card';

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

export function renderKeyboardMatrix(kbManager, gridUI) {
    const kbGrid = document.getElementById('kb-grid');
    const predictionBar = document.getElementById('kb-prediction-bar');
    if (!kbGrid) return;

    kbGrid.innerHTML = '';

    if (predictionBar) {
        updatePredictions(kbManager.currentPredictions || []);
    }

    FREQUENCY_GROUPS.forEach((group) => {
        const card = createKbCard('kb-card group', group.id, group.label, '');
        kbGrid.appendChild(card);
    });

    const isSearch = kbManager.mode === 'search';
    
    const sendCard = createKbCard(
        'kb-card send',
        'kb-send',
        isSearch ? 'SEARCH' : 'SEND',           
        isSearch ? 'YouTube' : 'To Caregiver',  
        isSearch ? 'youtube.png' : 'send.png'   
    );
    kbGrid.appendChild(sendCard);

    const bottomTools = [
        { id: 'kb-delete', label: 'DEL', sub: 'Backspace', type: 'delete', icon: 'delete.png' },
        { id: 'kb-space', label: 'SPACE', sub: 'Add Space', type: 'tool', icon: 'space.png' },
        { id: 'kb-tools', label: 'TOOLS', sub: 'More', type: 'tool', icon: 'tools.png' }
    ];

    bottomTools.forEach((tool) => {
        const card = createKbCard(
            `kb-card ${tool.type}`,
            tool.id,
            tool.label,
            tool.sub,
            tool.icon
        );
        kbGrid.appendChild(card);
    });

    kbManager.state = 'GROUP';
    const textLength = kbManager.currentText.length;

    setTimeout(() => {
        gridUI.refreshCards(KB_SCAN_SELECTOR);

        if (!kbManager.currentPredictions || kbManager.currentPredictions.length === 0) {
            gridUI.currentIndex = 2; 
        } else {
            gridUI.currentIndex = -1; 
        }
    }, 10);

    updateDisplay(kbManager);
}

export function renderLetters(groupId, kbManager, gridUI) {
    const group = FREQUENCY_GROUPS.find((item) => item.id === groupId);
    if (!group) return;

    const kbGrid = document.getElementById('kb-grid');
    kbGrid.innerHTML = '';

    group.letters.forEach((char) => {
        const card = createKbCard('kb-card group', `char-${char}`, char, '');
        kbGrid.appendChild(card);
    });

    const actions = [
        { id: 'kb-back-group', label: 'BACK', type: 'tool' },
        { id: 'kb-space', label: 'SPACE', type: 'tool' },
        { id: 'kb-delete', label: 'DEL', type: 'delete' }
    ];

    actions.forEach((action) => {
        const card = createKbCard(
            `kb-card ${action.type}`,
            action.id,
            action.label,
            ''
        );
        kbGrid.appendChild(card);
    });

    kbManager.state = 'LETTER';
    gridUI.refreshCards('#kb-grid .kb-card');
    gridUI.currentIndex = -1;
}

export function updateDisplay(kbManager) {
    const display = document.getElementById('kb-current-text');
    if (display) {
        display.innerText = kbManager.currentText;
    }
}

export function updatePredictions(words) {
    console.log("🎨 UI UPDATE: Trying to show ->", words);

    for (let i = 0; i < 3; i += 1) {
        const btn = document.getElementById(`pred-${i}`);

        // Safety Check: Do the buttons exist?
        if (!btn) {
            console.error(`❌ ERROR: Button #pred-${i} is missing from HTML!`);
            continue;
        }

        const wordSpan = btn.querySelector('.word');
        if (!wordSpan) {
            console.error(`❌ ERROR: .word span missing inside #pred-${i}`);
            continue;
        }

        // Apply the word
        if (words && words[i]) {
            wordSpan.innerText = words[i];

            // ✨ FORCE VISIBILITY (Fixes invisible text issues)
            wordSpan.style.color = "#4fd1c5";
            wordSpan.style.textShadow = "0px 0px 10px rgba(0,0,0,0.8)";
            wordSpan.style.display = "block";

            btn.classList.add('has-word');
            console.log(`✅ Painted "${words[i]}" on button ${i}`);
        } else {
            wordSpan.innerText = "";
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
        const card = createKbCard(
            `kb-card ${tool.type}`,
            tool.id,
            tool.label,
            tool.sub,
            tool.icon 
        );
        kbGrid.appendChild(card);
    });

    kbManager.state = 'TOOLS';
    gridUI.refreshCards('#kb-grid .kb-card');
}

/* frontend/js/modules/keyboard-ui.js */

export async function handleKeyboardAction(
    id,
    kbManager,
    gridUI,
    setScanTarget,
    callbacks
) {
    // --- SEND BUTTON ---
    if (id === 'kb-send') {
        const message = kbManager.currentText.trim();
        if (message.length === 0) return;

        kbManager.speak();
        if (window.showFeedback) window.showFeedback('MESSAGE SENT ✅', 'success');

        console.log(`📡 API CALL: Sending "${message}"...`);

        kbManager.clear();
        updateDisplay(kbManager);
        if (callbacks && callbacks.onExit) setTimeout(() => callbacks.onExit(), 3000);
        return;
    }

    // --- NAVIGATION TOOLS ---
    if (id === 'tool-back') {
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    if (id === 'kb-tools') {
        renderTools(kbManager, gridUI);
        setScanTarget('#kb-grid .kb-card');
        return;
    }

    if (id === 'tool-speak') {
        kbManager.speak();
        return;
    }

    if (id === 'tool-stop') {
        window.speechSynthesis.cancel();
        return;
    }

    if (id === 'tool-clear') {
        kbManager.clear();
        updateDisplay(kbManager);
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    if (id === 'tool-exit') {
        if (callbacks && callbacks.onExit) callbacks.onExit();
        return;
    }

    // --- QUICK REPLIES ---
    if (['tool-yes', 'tool-no', 'tool-thanks'].includes(id)) {
        const text = id === 'tool-yes' ? 'Yes' : id === 'tool-no' ? 'No' : 'Thank you';
        kbManager.speakText(text);
        return;
    }

    // --- DELETE ---
    if (id === 'kb-delete') {
        kbManager.deleteLast();
        updateDisplay(kbManager);
        // Clear predictions while waiting for new ones
        updatePredictions(["...", "...", "..."]);

        const words = await kbManager.getPredictions(kbManager.currentText);
        kbManager.currentPredictions = words;
        updatePredictions(words); // Update properly

        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    // --- SPACE ---
    if (id === 'kb-space') {
        kbManager.addChar(' ');
        updateDisplay(kbManager);
        kbManager.currentPredictions = [];
        updatePredictions(["", "", ""]); // Clear buttons
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    // --- BACK TO GROUPS ---
    if (id === 'kb-back-group') {
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    // --- CLICKING A PREDICTION ---
    if (id.startsWith('pred-')) {
        const index = Number(id.replace('pred-', ''));
        const word = kbManager.currentPredictions[index];
        if (!word) return;

        const lastIndex = kbManager.currentText.lastIndexOf(' ');
        kbManager.currentText = (lastIndex >= 0 ? kbManager.currentText.substring(0, lastIndex + 1) : '') + word + ' ';

        kbManager.currentPredictions = [];
        updateDisplay(kbManager);
        updatePredictions(["", "", ""]); // Clear used predictions
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    // --- SELECTING A LETTER GROUP ---
    if (id.startsWith('g')) {
        renderLetters(id, kbManager, gridUI);
        setScanTarget('#kb-grid .kb-card');
        return;
    }

    // --- TYPING A CHARACTER (Crucial Fix Here) ---
    if (id.startsWith('char-')) {
        const char = id.split('-')[1];
        kbManager.addChar(char);
        updateDisplay(kbManager);

        // 1. Show "..." immediately so user knows it's thinking
        kbManager.currentPredictions = ["...", "...", "..."];

        // 2. ✨ CRITICAL FIX: GO BACK TO MAIN SCREEN IMMEDIATELY
        // This puts the scanner back on the Main Grid + Prediction Bar
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);

        // 3. Fetch AI
        const words = await kbManager.getPredictions(kbManager.currentText);
        kbManager.currentPredictions = words;

        // 4. Update the buttons with real words (now that we are on the main screen)
        kbManager.currentPredictions = words;
        if (words.length > 0) {
            updatePredictions(words);
        } else {
            updatePredictions(["", "", ""]);
        }

        return;
    }
}
