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
        
        // ✨ New: default mode is 'speak'
        // Options: 'speak' | 'search'
        this.mode = 'speak'; 
    }

    // ✨ New: method to switch modes
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

    /* In frontend/js/modules/keyboard-logic.js */

    async getPredictions(text) {
        if (!text || text.trim().length === 0) return [];

        // Split text to find the last word
        const words = text.trim().split(' ');
        const lastWord = words[words.length - 1];

        // If the last word is very short (1 letter), maybe don't ask AI yet (optional)
        // if (lastWord.length < 2) return [];

        console.log(`🧠 Gemini: Autocompleting word starting with "${lastWord}"...`);

        try {
            const apiKey = AppConfig.GEMINI_API_KEY;
            const modelName = "gemini-2.5-flash"; // Or gemini-2.0-flash

            // ✨ UPDATED PROMPT: Force it to start with the characters
            // IN keyboard-logic.js (Inside getPredictions function)

            const prompt = `
                The user is typing: "${text}"
                Predict 3 likely COMPLETE SENTENCES that the user is trying to say.
                - If the last word is incomplete, complete it and finish the sentence.
                - If the last word is complete, predict the rest of the sentence.
                - Keep sentences short, conversational, and useful for daily needs.
                - Example input: "I wa" -> Output: ["I want water.", "I want to go home.", "I want to sleep."]
                - Example input: "Thank" -> Output: ["Thank you very much.", "Thanks for helping.", "Thank you."]
                
                Return ONLY a JSON array of strings.
            `;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (!response.ok) return [];

            const data = await response.json();
            if (!data.candidates || !data.candidates[0].content) return [];

            let aiText = data.candidates[0].content.parts[0].text;

            // Smart Cleaner
            const firstBracket = aiText.indexOf('[');
            const lastBracket = aiText.lastIndexOf(']');

            if (firstBracket !== -1 && lastBracket !== -1) {
                aiText = aiText.substring(firstBracket, lastBracket + 1);
                const predictions = JSON.parse(aiText);

                // Extra Safety: Filter results to ensure they actually start with the letters
                // This fixes cases where AI ignores the instruction
                const filtered = predictions.filter(w =>
                    w.toLowerCase().startsWith(lastWord.toLowerCase())
                );

                // If filter removed everything, just return the raw predictions
                return filtered.length > 0 ? filtered.slice(0, 3) : predictions.slice(0, 3);
            } else {
                return [];
            }

        } catch (error) {
            console.error("Prediction Logic Failed:", error);
            return [];
        }
    }
}
