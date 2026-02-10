/* frontend/js/utils/sound.js */

// 1. Create a shared AudioContext
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

export const SoundUtils = {
    // Unlock audio engine (required by browser autoplay policy)
    unlock: () => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => {
                console.log('🔊 Audio Engine Resumed!');
            });
        }
    },

    /**
     * Play a clean notification tone.
     * @param {number} frequency - Default 800Hz
     * @param {string} type - Default 'sine'
     * @param {number} duration - Default 0.15s
     */
    playBeep: (frequency = 800, type = 'sine', duration = 0.15) => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = type;
        osc.frequency.value = frequency;

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }
};
