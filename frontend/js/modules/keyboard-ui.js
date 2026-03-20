/* frontend/js/modules/keyboard-ui.js */

import { FREQUENCY_GROUPS } from './keyboard-logic.js';
import { AlertService } from '../api/alert-service.js';
import { getLocalPredictions, dictionaryEngine } from './dictionary.js';

const ZONE_DOWN = '#kb-grid .kb-card';
const ZONE_UP = '#kb-prediction-bar .predict-btn';

// ✨ INSTANT OFFLINE PREDICTIONS
async function getSafePredictions(kbManager) {
    const words = getLocalPredictions(kbManager.currentText);
    if (!words || words.length === 0) return ["", "", ""];
    return words;
}

function createKbCard(className, id, label, sub, icon, index) {
    const div = document.createElement('div');
    div.className = className;
    div.id = id;
    if (index !== undefined) div.dataset.index = index;
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
    if (!kbGrid) return;
    kbGrid.innerHTML = '';

    FREQUENCY_GROUPS.forEach((group, index) => {
        const card = createKbCard('kb-card group', group.id, group.label.toUpperCase(), '', null, index);
        kbGrid.appendChild(card);
    });

    const sendCard = createKbCard('kb-card send', 'kb-send', 'SEND', 'To Caregiver', 'send.png', FREQUENCY_GROUPS.length);
    kbGrid.appendChild(sendCard);

    const bottomTools = [
        { id: 'kb-delete', label: 'DEL', sub: 'Backspace', type: 'delete', icon: 'delete.png' },
        { id: 'kb-space', label: 'SPACE', sub: 'Add Space', type: 'tool', icon: 'space.png' },
        { id: 'kb-tools', label: 'TOOLS', sub: 'More', type: 'tool', icon: 'tools.png' }
    ];

    bottomTools.forEach((tool, index) => {
        const totalIdx = FREQUENCY_GROUPS.length + 1 + index;
        const card = createKbCard(`kb-card ${tool.type}`, tool.id, tool.label, tool.sub, tool.icon, totalIdx);
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

    group.letters.forEach((char, index) => {
        const upperChar = char.toUpperCase();
        const card = createKbCard('kb-card group', `char-${upperChar}`, upperChar, '', null, index);
        kbGrid.appendChild(card);
    });

    const actions = [
        { id: 'kb-back-group', label: 'BACK', type: 'tool', icon: 'back.png' },
        { id: 'kb-space', label: 'SPACE', type: 'tool', icon: 'space.png' },
        { id: 'kb-delete', label: 'DEL', type: 'delete', icon: 'delete.png' }
    ];

    actions.forEach((action, index) => {
        const totalIdx = group.letters.length + index;
        const card = createKbCard(`kb-card ${action.type}`, action.id, action.label, '', action.icon, totalIdx);
        kbGrid.appendChild(card);
    });

    kbManager.state = 'LETTER';
    gridUI.refreshCards(ZONE_DOWN);
    gridUI.currentIndex = -1;
}

export function updateDisplay(kbManager) {
    const display = document.getElementById('kb-current-text');
    if (display) {
        let text = kbManager.currentText;
        let safeText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        safeText = safeText.replace(/ /g, "&nbsp;");

        if (text.endsWith(' ')) {
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

    tools.forEach((tool, index) => {
        const card = createKbCard(`kb-card ${tool.type}`, tool.id, tool.label, tool.sub, tool.icon, index);
        kbGrid.appendChild(card);
    });

    kbManager.state = 'TOOLS';
    gridUI.refreshCards(ZONE_DOWN);
}

export async function handleKeyboardAction(id, kbManager, gridUI, setScanTarget, callbacks) {

    // --- SEND TO CAREGIVER WITH GEMINI ---
    if (id === 'kb-send') {
        const rawKeywords = kbManager.currentText.trim();
        if (rawKeywords.length > 0) {
            dictionaryEngine.learn(rawKeywords);
            if (window.showFeedback) window.showFeedback('FORMATTING... 🧠', 'info');

            kbManager.formatMessageToSentence(rawKeywords).then(finalSentence => {
                kbManager.currentText = finalSentence;
                updateDisplay(kbManager);
                kbManager.speakText(finalSentence);

                try {
                    AlertService.sendSimpleAlert('message', finalSentence);
                    console.log("✅ SENT TO ALERT SERVICE");
                } catch (e) {
                    console.error("❌ ALERT ERROR:", e);
                }

                if (window.showFeedback) window.showFeedback('SENT ✅', 'success');

                setTimeout(() => {
                    kbManager.clear();
                    updateDisplay(kbManager);
                    if (callbacks && callbacks.onExit) callbacks.onExit();
                }, 3000);
            });
        }
        return;
    }

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

        getSafePredictions(kbManager).then(words => {
            kbManager.currentPredictions = words;
            updatePredictions(words);
        });

        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }

    // --- SPACE ---
    if (id === 'kb-space') {
        kbManager.addChar(' ');
        updateDisplay(kbManager);

        if (window.showFeedback) window.showFeedback('SPACE ADDED ␣', 'success');

        getSafePredictions(kbManager).then(words => {
            kbManager.currentPredictions = words;
            updatePredictions(words);
        });

        renderKeyboardMatrix(kbManager, gridUI);
        setScanTarget(ZONE_DOWN);
        return;
    }

    // --- CLICKING A PREDICTION ---
    if (id.startsWith('pred-')) {
        const index = Number(id.replace('pred-', ''));
        const word = kbManager.currentPredictions[index];

        if (word) {
            dictionaryEngine.learn(word);

            const lastIndex = kbManager.currentText.lastIndexOf(' ');
            if (lastIndex >= 0) {
                kbManager.currentText = kbManager.currentText.substring(0, lastIndex + 1) + word.toUpperCase() + ' ';
            } else {
                kbManager.currentText = word.toUpperCase() + ' ';
            }

            kbManager.currentPredictions = [];
            updateDisplay(kbManager);

            renderKeyboardMatrix(kbManager, gridUI);
            setScanTarget(ZONE_DOWN);

            const bar = document.getElementById('kb-prediction-bar');
            if (bar) {
                bar.style.borderColor = 'transparent';
                bar.style.boxShadow = 'none';
            }
            document.getElementById('kb-grid').style.opacity = '1';
            gridUI.refreshCards(ZONE_DOWN);
            gridUI.currentIndex = -1;

            getSafePredictions(kbManager).then(words => {
                kbManager.currentPredictions = words;
                updatePredictions(words);
            });
        }
        return;
    }

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

        getSafePredictions(kbManager).then(words => {
            kbManager.currentPredictions = words;
            updatePredictions(words);
        });

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
        AlertService.sendSimpleAlert('RESPONSE', text);
        return;
    }
}