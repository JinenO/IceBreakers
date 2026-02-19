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

    // ✨ NEW GEMINI FUNCTION: Only used when SENDING the final message!
    async formatMessageToSentence(keywords) {
        if (!keywords || keywords.trim().length === 0) return "";

        console.log(`🧠 Gemini: Formatting keywords into sentence: "${keywords}"`);

        try {
            const apiKey = AppConfig.GEMINI_API_KEY;
            const modelName = "gemini-2.5-flash";

            const prompt = `
                You are an AI assistant helping an ALS patient communicate with their caregiver.
                The user has typed the following rough keywords: "${keywords}"
                
                Convert these keywords into a single, natural, polite, and complete sentence.
                - Use the first person ("I").
                - Keep it clear, brief, and conversational.
                - Example: "hungry want water" -> "I am feeling hungry and would like some water."
                - Example: "pain back medicine" -> "My back is in pain, can I please have my medicine?"
                
                Return ONLY the final sentence string. No extra words, no quotes, no formatting.
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

            if (!response.ok) throw new Error("API Limit or Network Error");

            const data = await response.json();
            if (!data.candidates || !data.candidates[0].content) throw new Error("Invalid API Response");

            let formattedSentence = data.candidates[0].content.parts[0].text.trim();

            // Remove any accidental quotes the AI might add
            formattedSentence = formattedSentence.replace(/^"|"$/g, '');

            return formattedSentence;

        } catch (error) {
            console.error("Gemini Formatting Failed. Falling back to raw keywords:", error);
            // Fallback: If API fails, just send the raw keywords so communication never stops
            return keywords;
        }
    }
}