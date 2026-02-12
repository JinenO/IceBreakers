/* frontend/js/modules/keyboard-logic.js */

export const FREQUENCY_GROUPS = [
    { id: 'g1', label: 'E A I O T', letters: ['E', 'A', 'I', 'O', 'T'] },
    { id: 'g2', label: 'N S R H D', letters: ['N', 'S', 'R', 'H', 'D'] },
    { id: 'g3', label: 'L U C M F', letters: ['L', 'U', 'C', 'M', 'F'] },
    { id: 'g4', label: 'W Y P V B', letters: ['W', 'Y', 'P', 'V', 'B'] },
    { id: 'g5', label: 'G K J Q X Z', letters: ['G', 'K', 'J', 'Q', 'X', 'Z'] }
];

export class KeyboardManager {
    constructor() {
        this.currentText = '';
        this.currentPredictions = [];
        this.state = 'GROUP';
        
        // ✨ 新增：默认模式是 'speak' (说话)
        // 可选值: 'speak' | 'search'
        this.mode = 'speak'; 
    }

    // ✨ 新增：切换模式的方法
    setMode(mode) {
        this.mode = mode;
    }

    addChar(char) {
        this.currentText += char;
    }

    deleteLast() {
        this.currentText = this.currentText.slice(0, -1);
    }

    clear() {
        this.currentText = '';
    }

    speak() {
        if (!this.currentText) return;
        this.speakText(this.currentText);
    }

    speakText(text) {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }

    async getPredictions(text) {
        if (!text || text.endsWith(' ')) return [];

        const lastWord = text.split(' ').pop().toUpperCase();
        if (!lastWord) return [];

        await new Promise((resolve) => setTimeout(resolve, 200));

        const mockDB = {
            W: ['WATER', 'WANT', 'WHAT'],
            WA: ['WATER', 'WATCH', 'WALK'],
            WAT: ['WATER', 'WATCH', 'WATT'],
            H: ['HELLO', 'HELP', 'HOW'],
            HE: ['HELLO', 'HELP', 'HEART'],
            I: ['I AM', 'I WANT', 'IT'],
            FO: ['FOOD', 'FOR', 'FOUR']
        };

        return (
            mockDB[lastWord] || [
                `${lastWord}ING`,
                `${lastWord}ED`,
                `${lastWord}S`
            ]
        );
    }
}
