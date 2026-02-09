export const SoundUtils = {
    // 使用浏览器自带的 Web Audio API 产生声音，不需要 mp3 文件
    playBeep: (frequency = 800, type = 'sine', duration = 0.15) => {
        try {
            // 兼容性写法
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = type; // 波形: 'sine' (柔和), 'square' (刺耳), 'triangle' (清脆)
            osc.frequency.value = frequency; // 频率: 800Hz

            // 设置音量渐隐 (避免结束时有爆破音)
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio play failed", e);
        }
    }
};
