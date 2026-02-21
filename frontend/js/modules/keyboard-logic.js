/* frontend/js/modules/keyboard-logic.js */

import { AppConfig } from '../config.js';

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
        this.mode = 'speak';
    }

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
        if (!text || text.trim().length === 0) return [];

        const words = text.trim().split(' ');
        const lastWord = words[words.length - 1].toLowerCase();

        if (lastWord.length === 0) return [];

        const COMMON_WORDS = [
            "apple", "and", "are", "about", "after", "all",
            "be", "because", "but", "by", "before", "back",
            "can", "could", "call", "come", "care", "cat",
            "do", "down", "day", "doctor", "door", "drink",
            "eat", "every", "eye", "ear", "easy", "end",
            "for", "from", "feel", "food", "family", "find",
            "go", "get", "good", "great", "give", "girl",
            "have", "he", "here", "help", "home", "how",
            "i", "is", "it", "in", "if", "into",
            "just", "job", "join", "jump", "joke", "juice",
            "know", "keep", "kind", "key", "kid", "kiss",
            "like", "look", "love", "little", "let", "live",
            "my", "me", "more", "make", "much", "many",
            "no", "not", "now", "need", "never", "new",
            "of", "on", "out", "one", "other", "over",
            "people", "please", "pain", "pill", "play", "put",
            "quiet", "quick", "question", "queen", "quit", "quite",
            "right", "room", "really", "read", "rest", "run",
            "so", "some", "see", "say", "sick", "sleep",
            "the", "to", "that", "this", "they", "there",
            "up", "us", "use", "under", "until", "upon",
            "very", "hot", "water", "cold", "voice", "view",
            "we", "want", "with", "what", "when", "will",
            "you", "your", "yes", "year", "yellow", "young",
            "zoo", "zero", "zip", "zone", "zoom"
        ];

        // Find words that exactly start with the typed letters
        const matches = COMMON_WORDS.filter(w => w.startsWith(lastWord));

        // Return top 3 matches in uppercase
        return matches.slice(0, 3).map(w => w.toUpperCase());
    }
}