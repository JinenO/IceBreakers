/* frontend/js/modules/sleep-manager.js */

export class SleepManager {
    constructor(onSleep, onWake) {
        this.overlay = document.getElementById('sleep-overlay');
        this.isSleeping = false;
        this.scanCount = 0;
        this.maxRounds = 5;

        this.onSleep = onSleep;
        this.onWake = onWake;
    }

    recordRound(currentCardIndex, totalCards) {
        if (this.isSleeping || totalCards <= 0) return;

        if (currentCardIndex === totalCards - 1) {
            this.scanCount++;
            console.log(`SleepManager: Round ${this.scanCount}/${this.maxRounds}`);

            if (this.scanCount >= this.maxRounds) {
                this.enterSleep();
            }
        }
    }

    resetTimer() {
        this.scanCount = 0;
        console.log('SleepManager: User active, timer reset.');
    }

    enterSleep() {
        if (this.isSleeping) return;
        this.isSleeping = true;
        this.scanCount = 0;
        if (this.overlay) this.overlay.classList.add('active');
        if (this.onSleep) this.onSleep();
        console.log('System Sleeping');
    }

    wakeUp() {
        if (!this.isSleeping) return;
        this.isSleeping = false;
        this.scanCount = 0;
        if (this.overlay) this.overlay.classList.remove('active');
        if (this.onWake) this.onWake();
        console.log('System Awake');
    }
}
