// frontend/js/modules/ai-predictor.js

const AI_HISTORY_KEY = 'iris_ai_history';

function readHistory() {
    try {
        return JSON.parse(localStorage.getItem(AI_HISTORY_KEY)) || [];
    } catch (error) {
        console.warn('AI predictor: failed to parse history', error);
        return [];
    }
}

export function getPredictedAction() {
    const aiHistory = readHistory();
    if (aiHistory.length === 0) return null;

    const currentHour = new Date().getHours();
    const pastActionsInThisHour = aiHistory.filter((log) => log.hour === currentHour && typeof log.action === 'string');

    if (pastActionsInThisHour.length === 0) return null;

    const frequencyMap = {};
    pastActionsInThisHour.forEach((log) => {
        frequencyMap[log.action] = (frequencyMap[log.action] || 0) + 1;
    });

    let mostLikelyAction = null;
    let maxCount = 0;

    Object.entries(frequencyMap).forEach(([action, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostLikelyAction = action;
        }
    });

    const probability = maxCount / pastActionsInThisHour.length;

    if (probability > 0.5) {
        console.log(
            `AI prediction: likely [${mostLikelyAction}] with confidence ${Math.round(probability * 100)}%`
        );
        return mostLikelyAction;
    }

    return null;
}

export function getPredictedActionWithConfidence() {
    const aiHistory = readHistory();
    if (aiHistory.length === 0) return null;

    const currentHour = new Date().getHours();
    const pastActionsInThisHour = aiHistory.filter((log) => log.hour === currentHour && typeof log.action === 'string');

    if (pastActionsInThisHour.length === 0) return null;

    const frequencyMap = {};
    pastActionsInThisHour.forEach((log) => {
        frequencyMap[log.action] = (frequencyMap[log.action] || 0) + 1;
    });

    let mostLikelyAction = null;
    let maxCount = 0;

    Object.entries(frequencyMap).forEach(([action, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostLikelyAction = action;
        }
    });

    const probability = maxCount / pastActionsInThisHour.length;
    if (probability <= 0.5) return null;

    return {
        action: mostLikelyAction,
        confidence: probability,
        hour: currentHour,
        sampleSize: pastActionsInThisHour.length
    };
}
