// frontend/js/modules/dictionary.js

// ==========================================
// 1. BASE DICTIONARY LISTS
// ==========================================
export const CORE_WORDS = [
    "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them",
    "my", "your", "his", "her", "our", "their",
    "mine", "yours", "hers", "ours", "theirs",

    "be", "am", "is", "are", "was", "were", "been",
    "have", "has", "had",
    "do", "does", "did",
    "can", "could", "will", "would", "should", "may", "might",

    "want", "need", "like", "love", "hate",
    "go", "come", "get", "give", "take", "make",
    "see", "look", "know", "think", "say", "tell",
    "ask", "answer", "help", "try", "use",

    "yes", "no", "okay", "ok", "please", "thank", "sorry",

    "what", "where", "when", "why", "who", "how", "which",

    "more", "all", "some", "none", "many", "few",
    "here", "there", "this", "that", "these", "those",

    "and", "or", "but", "because", "if", "then", "so", "with", "without", "for", "from", "to", "of", "about"
];

export const DAILY_NEEDS_WORDS = [
    "eat", "drink", "sleep", "rest", "sit", "stand", "walk", "run",
    "bathroom", "toilet", "shower", "wash", "clean", "dirty",
    "hungry", "thirsty", "tired", "sick", "pain", "hurt",
    "medicine", "doctor", "nurse", "hospital", "clinic",
    "water", "food", "milk", "juice", "rice", "bread",
    "hot", "cold", "wet", "dry",
    "open", "close", "turn", "stop", "start",
    "call", "wait", "come", "stay"
];

export const EMOTION_WORDS = [
    "happy", "sad", "angry", "mad", "scared", "afraid",
    "excited", "bored", "tired", "worried", "nervous",
    "calm", "relaxed", "confused", "frustrated",
    "lonely", "shy", "proud", "embarrassed",
    "love", "hate", "like", "miss", "care", "hope"
];

export const FAMILY_WORDS = [
    "mom", "mother", "dad", "father",
    "sister", "brother", "baby",
    "grandma", "grandfather",
    "family", "friend", "teacher",
    "student", "boss", "nurse", "doctor",
    "neighbor", "classmate", "child"
];

export const FOOD_WORDS = [
    "apple", "banana", "orange", "grape",
    "chicken", "fish", "meat", "egg",
    "rice", "noodle", "soup", "bread",
    "cake", "biscuit", "snack",
    "coffee", "tea", "milk", "water",
    "sugar", "salt", "sweet", "spicy"
];

export const SCHOOL_WORK_WORDS = [
    "school", "class", "homework", "assignment",
    "exam", "test", "quiz", "project",
    "study", "learn", "read", "write",
    "computer", "laptop", "phone",
    "meeting", "office", "job", "work",
    "submit", "check", "review", "presentation"
];

export const BODY_WORDS = [
    "head", "eye", "ear", "nose", "mouth",
    "face", "hand", "arm", "leg", "foot",
    "stomach", "back", "neck", "shoulder",
    "finger", "toe", "heart"
];

export const TIME_WORDS = [
    "today", "tomorrow", "yesterday",
    "morning", "afternoon", "evening", "night",
    "now", "later", "soon",
    "week", "month", "year",
    "before", "after", "early", "late"
];

export const PLACE_WORDS = [
    "home", "house", "room", "bedroom", "kitchen",
    "bathroom", "school", "office", "hospital",
    "park", "shop", "store", "market",
    "outside", "inside", "upstairs", "downstairs"
];

export const DIRECTION_WORDS = [
    "left", "right", "up", "down",
    "in", "out", "on", "off",
    "near", "far", "front", "back"
];

export const NUMBER_WORDS = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
    "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety", "hundred", "thousand",

    "first", "second", "third", "fourth", "fifth",
    "last", "next",

    "more", "less", "few", "many", "another", "extra"
];

export const MEDICAL_WORDS = [
    "pain", "hurt", "ache", "fever", "cold", "cough",
    "sick", "dizzy", "weak", "tired", "numb", "bleeding",
    "doctor", "nurse", "medicine", "pill", "injection",
    "hospital", "clinic", "appointment",
    "emergency", "ambulance", "help", "call",
    "allergy", "diabetes", "pressure", "heart",
    "breathing", "oxygen", "wheelchair",
    "therapy", "exercise", "rehab"
];

export const CARE_WORDS = [
    "bathroom", "toilet", "pee", "poop",
    "shower", "bath", "soap", "towel",
    "change", "clothes", "shirt", "pants", "shoes",
    "brush", "teeth", "comb", "hair",
    "hungry", "thirsty", "water", "food",
    "hot", "cold", "blanket", "fan", "aircon"
];

export const COMMUNICATION_WORDS = [
    "again", "repeat", "slow", "faster",
    "understand", "don't understand",
    "wait", "listen", "look",
    "show", "point", "write", "read",
    "spell", "say", "tell",
    "yes", "no", "maybe",
    "correct", "wrong",
    "different", "same",
    "finish", "done", "not yet"
];

export const PEOPLE_WORDS = [
    "mom", "dad", "mother", "father",
    "sister", "brother", "grandma", "grandpa",
    "wife", "husband", "son", "daughter",
    "friend", "neighbor", "teacher", "student",
    "caregiver", "helper", "therapist",
    "police", "driver", "cashier"
];

export const HOME_WORDS = [
    "bed", "chair", "table", "sofa", "door", "window",
    "light", "fan", "tv", "remote",
    "phone", "charger", "computer",
    "plate", "cup", "spoon", "fork",
    "knife", "bottle", "bag",
    "key", "wallet", "money"
];

export const TRANSPORT_WORDS = [
    "car", "bus", "train", "taxi", "grab",
    "driver", "road", "traffic",
    "stop", "station", "ticket",
    "go", "come", "arrive", "leave"
];

export const COMMON_ADJECTIVES = [
    "good", "bad", "big", "small",
    "fast", "slow", "easy", "hard",
    "new", "old", "clean", "dirty",
    "full", "empty",
    "right", "wrong",
    "happy", "sad", "angry", "scared",
    "ready", "busy", "free"
];

export const ROUTINE_WORDS = [
    "wake", "sleep", "eat", "drink",
    "take", "give", "go", "come",
    "work", "study", "rest",
    "morning", "afternoon", "evening", "night",
    "today", "tomorrow", "yesterday",
    "before", "after", "later", "now"
];

export const PHRASE_WORDS = [
    "i need help",
    "i am in pain",
    "i am tired",
    "i am hungry",
    "i am thirsty",
    "please wait",
    "call doctor",
    "call family",
    "thank you",
    "i don't understand",
    "please repeat",
    "slow down",
    "help me"
];

// ==========================================
// 2. SMART DICTIONARY ENGINE 
// ==========================================
class DictionaryEngine {
    constructor() {
        this.words = new Map();
        this.buildDictionary();
    }

    // Assigns base frequency scores to your existing lists
    buildDictionary() {
        const addList = (list, baseScore, type) => {
            if (!list) return; // Safety check
            list.forEach(item => {
                const text = item.toLowerCase();
                if (!this.words.has(text)) {
                    this.words.set(text, { text, score: baseScore, type });
                }
            });
        };

        // 1. Highest Priority (Phrases and Core Words)
        addList(typeof PHRASE_WORDS !== 'undefined' ? PHRASE_WORDS : [], 100, 'phrase');
        addList(typeof CORE_WORDS !== 'undefined' ? CORE_WORDS : [], 90, 'word');
        addList(typeof COMMUNICATION_WORDS !== 'undefined' ? COMMUNICATION_WORDS : [], 85, 'word');

        // 2. High Priority (Daily Life & Medical)
        addList(typeof DAILY_NEEDS_WORDS !== 'undefined' ? DAILY_NEEDS_WORDS : [], 80, 'word');
        addList(typeof MEDICAL_WORDS !== 'undefined' ? MEDICAL_WORDS : [], 75, 'word');
        addList(typeof CARE_WORDS !== 'undefined' ? CARE_WORDS : [], 75, 'word');
        addList(typeof BODY_WORDS !== 'undefined' ? BODY_WORDS : [], 70, 'word');

        // 3. Medium Priority (People, Places, Time)
        addList(typeof FAMILY_WORDS !== 'undefined' ? FAMILY_WORDS : [], 65, 'word');
        addList(typeof PEOPLE_WORDS !== 'undefined' ? PEOPLE_WORDS : [], 65, 'word');
        addList(typeof TIME_WORDS !== 'undefined' ? TIME_WORDS : [], 60, 'word');
        addList(typeof PLACE_WORDS !== 'undefined' ? PLACE_WORDS : [], 60, 'word');
        addList(typeof HOME_WORDS !== 'undefined' ? HOME_WORDS : [], 60, 'word');

        // 4. Standard Priority (Everything else)
        addList(typeof EMOTION_WORDS !== 'undefined' ? EMOTION_WORDS : [], 55, 'word');
        addList(typeof FOOD_WORDS !== 'undefined' ? FOOD_WORDS : [], 55, 'word');
        addList(typeof TRANSPORT_WORDS !== 'undefined' ? TRANSPORT_WORDS : [], 50, 'word');
        addList(typeof SCHOOL_WORK_WORDS !== 'undefined' ? SCHOOL_WORK_WORDS : [], 50, 'word');
        addList(typeof DIRECTION_WORDS !== 'undefined' ? DIRECTION_WORDS : [], 50, 'word');
        addList(typeof NUMBER_WORDS !== 'undefined' ? NUMBER_WORDS : [], 50, 'word');
        addList(typeof COMMON_ADJECTIVES !== 'undefined' ? COMMON_ADJECTIVES : [], 50, 'word');
        addList(typeof ROUTINE_WORDS !== 'undefined' ? ROUTINE_WORDS : [], 50, 'word');
    }

    // CONTEXT-BASED PREDICTION: What usually comes next?
    getContextPredictions(prevWord) {
        const contextMap = {
            "i": ["am", "want", "need", "feel", "think"],
            "you": ["are", "can", "want", "should"],
            "he": ["is", "wants", "needs"],
            "she": ["is", "wants", "needs"],
            "we": ["are", "can", "need"],
            "it": ["is", "hurts", "feels"],
            "they": ["are", "can"],
            "to": ["go", "eat", "sleep", "rest", "help"],
            "am": ["hungry", "thirsty", "tired", "sick", "in pain"],
            "is": ["good", "bad", "okay", "hurting"],
            "feel": ["good", "bad", "sick", "tired", "pain"]
        };
        return contextMap[prevWord] || ["I", "THE", "PLEASE"];
    }

    // LEARN FUNCTION: Add custom words or boost used words
    learn(text) {
        const cleanText = text.toLowerCase().trim();
        if (!cleanText) return;

        if (this.words.has(cleanText)) {
            // If word exists, boost its frequency score by 5
            this.words.get(cleanText).score += 5;
        } else {
            // Add NEW custom personal word/phrase
            this.words.set(cleanText, {
                text: cleanText,
                score: 85, // Give new words high priority
                type: cleanText.includes(' ') ? 'phrase' : 'word'
            });
        }
    }

    // MAIN SEARCH LOGIC
    search(currentText) {
        const rawText = currentText.toLowerCase().trimStart();
        const wordsArr = rawText.split(/\s+/);
        const lastWord = wordsArr[wordsArr.length - 1];

        // --- 1. CONTEXT MODE (User pressed space) ---
        if (currentText.endsWith(' ') || lastWord === '') {
            const prevWord = wordsArr.length > 1 ? wordsArr[wordsArr.length - 2] : null;
            return this.getContextPredictions(prevWord).map(w => w.toUpperCase());
        }

        // --- 2. TYPING MODE ---
        let results = [];
        const allEntries = Array.from(this.words.values());

        // A. Phrase Matching (e.g., typing "i am h" -> finds "i am hungry")
        if (wordsArr.length > 1) {
            const phraseMatches = allEntries
                .filter(e => e.type === 'phrase' && e.text.startsWith(rawText))
                .sort((a, b) => b.score - a.score);
            results.push(...phraseMatches);
        }

        // B. Prefix Matching (e.g., "wa" -> "want", "water")
        const prefixMatches = allEntries
            .filter(e => e.type === 'word' && e.text.startsWith(lastWord))
            .sort((a, b) => b.score - a.score);
        results.push(...prefixMatches);

        // C. Mid-Word Matching (e.g., "chair" -> finds "wheelchair") 
        if (results.length < 3 && lastWord.length >= 3) {
            const midMatches = allEntries
                .filter(e => e.type === 'word' && e.text.includes(lastWord) && !e.text.startsWith(lastWord))
                .sort((a, b) => b.score - a.score);
            results.push(...midMatches);
        }

        // Deduplicate and get Top 3
        const uniqueResults = [...new Map(results.map(item => [item.text, item])).values()];

        // ✨ THE FIX IS HERE: using e.text.toUpperCase() instead of e.toUpperCase()
        return uniqueResults.slice(0, 3).map(e => e.text.toUpperCase());
    }
}

// Export a singleton instance so memory is saved
export const dictionaryEngine = new DictionaryEngine();

// The main function keyboard-ui.js calls
export function getLocalPredictions(currentText) {
    return dictionaryEngine.search(currentText);
}