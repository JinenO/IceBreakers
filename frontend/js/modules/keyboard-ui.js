/* frontend/js/modules/keyboard-ui.js */

import { FREQUENCY_GROUPS } from './keyboard-logic.js';

const KB_SCAN_SELECTOR = '#kb-prediction-bar .predict-btn, #kb-grid .kb-card';

function createKbCard(className, id, label, sub) {
    const div = document.createElement('div');
    div.className = className;
    div.id = id;
    div.innerHTML = `
        <div class="kb-label">${label}</div>
        ${sub ? `<div class="kb-sub">${sub}</div>` : ''}
        <div class="scan-bar"></div><div class="confirm-bar"></div>
    `;
    return div;
}

export function renderKeyboardMatrix(kbManager, gridUI) {
    const kbGrid = document.getElementById('kb-grid');
    const predictionBar = document.getElementById('kb-prediction-bar');
    if (!kbGrid) return;

    kbGrid.innerHTML = '';

    if (predictionBar && kbManager.currentPredictions?.length) {
        updatePredictions(kbManager.currentPredictions);
    }

    FREQUENCY_GROUPS.forEach((group) => {
        const card = createKbCard('kb-card group', group.id, group.label, 'Group');
        kbGrid.appendChild(card);
    });

    const tools = [
        { id: 'kb-space', label: 'SPACE', sub: 'Add Space', type: 'tool' },
        {
            id: 'kb-send',
            label: '🚀 SEND',
            sub: 'To Caregiver',
            type: 'send'
        },
        { id: 'kb-delete', label: 'DEL', sub: 'Backspace', type: 'delete' }
    ];

    tools.forEach((tool) => {
        const card = createKbCard(
            `kb-card ${tool.type}`,
            tool.id,
            tool.label,
            tool.sub
        );
        kbGrid.appendChild(card);
    });

    kbManager.state = 'GROUP';
    const textLength = kbManager.currentText.length;

    setTimeout(() => {
        gridUI.refreshCards(KB_SCAN_SELECTOR);

        if (textLength === 0) {
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
    for (let i = 0; i < 3; i += 1) {
        const btn = document.getElementById(`pred-${i}`);
        if (!btn) continue;

        const wordSpan = btn.querySelector('.word');
        if (!wordSpan) continue;

        if (words[i]) {
            wordSpan.innerText = words[i];
            btn.classList.add('has-word');
        } else {
            wordSpan.innerText = '';
            btn.classList.remove('has-word');
        }
    }
}

export function renderTools(kbManager, gridUI) {
    const kbGrid = document.getElementById('kb-grid');
    if (!kbGrid) return;

    kbGrid.innerHTML = '';

    const tools = [
        { id: 'tool-speak', label: '🔊 SPEAK', sub: 'Read Aloud', type: 'group' },
        { id: 'tool-clear', label: '🗑️ CLEAR', sub: 'Delete All', type: 'delete' },
        { id: 'tool-yes', label: '👍 YES', sub: 'Quick Reply', type: 'tool' },
        { id: 'tool-no', label: '👎 NO', sub: 'Quick Reply', type: 'tool' },
        { id: 'tool-exit', label: '🏠 EXIT', sub: 'Main Menu', type: 'delete' },
        { id: 'tool-thanks', label: '🙏 THANKS', sub: 'Quick Reply', type: 'tool' },
        { id: 'tool-stop', label: '🛑 STOP', sub: 'Stop Audio', type: 'tool' },
        { id: 'tool-back', label: '↩️ BACK', sub: 'To Keyboard', type: 'group' }
    ];

    tools.forEach((tool) => {
        const card = createKbCard(
            `kb-card ${tool.type}`,
            tool.id,
            tool.label,
            tool.sub
        );
        kbGrid.appendChild(card);
    });

    kbManager.state = 'TOOLS';
    gridUI.refreshCards('#kb-grid .kb-card');
}

export async function handleKeyboardAction(
    id,
    kbManager,
    gridUI,
    setScanTarget,
    callbacks
) {
    if (id === 'kb-send') {
        const message = kbManager.currentText.trim();
        if (message.length === 0) {
            return;
        }

        kbManager.speak();

        if (window.showFeedback) {
            window.showFeedback('MESSAGE SENT ✅', 'success');
        }

        console.log(
            `📡 API CALL: Sending "${message}" to Caregiver's Phone...`
        );

        kbManager.clear();
        updateDisplay(kbManager);

        if (callbacks && callbacks.onExit) {
            setTimeout(() => {
                callbacks.onExit();
            }, 3000);
        }
        return;
    }

    if (id === 'tool-back') {
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
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
        if (callbacks && callbacks.onExit) {
            callbacks.onExit();
        }
        return;
    }

    if (id === 'tool-yes') {
        kbManager.speakText('Yes');
        return;
    }

    if (id === 'tool-no') {
        kbManager.speakText('No');
        return;
    }

    if (id === 'tool-thanks') {
        kbManager.speakText('Thank you');
        return;
    }

    if (id === 'kb-delete') {
        kbManager.deleteLast();
        updateDisplay(kbManager);
        return;
    }
    if (id === 'kb-space') {
        kbManager.addChar(' ');
        updateDisplay(kbManager);
        return;
    }
    if (id === 'kb-back-group') {
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }
    if (id.startsWith('pred-')) {
        const index = Number(id.replace('pred-', ''));
        const word = kbManager.currentPredictions[index];
        if (!word) return;

        const lastIndex = kbManager.currentText.lastIndexOf(' ');
        kbManager.currentText =
            kbManager.currentText.substring(0, lastIndex + 1) + word + ' ';

        updateDisplay(kbManager);
        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }

    if (id.startsWith('g')) {
        renderLetters(id, kbManager, gridUI);
        setScanTarget('#kb-grid .kb-card');
        return;
    }

    if (id.startsWith('char-')) {
        const char = id.split('-')[1];
        kbManager.addChar(char);
        updateDisplay(kbManager);

        const words = await kbManager.getPredictions(kbManager.currentText);
        kbManager.currentPredictions = words;

        if (words.length > 0) {
            updatePredictions(words);
        }

        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(KB_SCAN_SELECTOR);
        return;
    }
}
