/* frontend/js/modules/sos.js */
import { SoundUtils } from '../utils/sound.js';

export class SOSSystem {
  constructor() {
    this.overlay = document.getElementById('sos-overlay');
    this.timerEl = document.getElementById('sos-timer');

    this.state = 'IDLE';
    // IDLE -> CHARGING (eyes closed) -> READY (charged, wait open) -> SENDING

    this.chargeStartTime = 0;
    this.confirmStartTime = 0;

    this.CHARGE_TIME = 3000; // eyes-closed 3s
    this.CONFIRM_TIME = 2000; // eyes-open confirm 2s
  }

  /**
   * Core loop: call every frame from main.js eye-tracking callback
   * @param {boolean} isEyesClosed
   */
  update(isEyesClosed) {
    const now = Date.now();

    // 1. IDLE
    if (this.state === 'IDLE') {
      if (isEyesClosed) {
        this.state = 'CHARGING';
        this.chargeStartTime = now;
        console.log('SOS: Charging...');
        SoundUtils.playBeep(200, 'sine', 0.1);
      }
    }

    // 2. CHARGING - keep eyes closed
    else if (this.state === 'CHARGING') {
      if (!isEyesClosed) {
        this.reset();
        return;
      }

      const elapsed = now - this.chargeStartTime;

      if (elapsed > 1000 && elapsed < 1100) {
        SoundUtils.playBeep(400, 'sine', 0.1);
      }
      if (elapsed > 2000 && elapsed < 2100) {
        SoundUtils.playBeep(600, 'sine', 0.1);
      }

      if (elapsed > this.CHARGE_TIME) {
        this.state = 'READY';
        this.confirmStartTime = now;

        this.overlay.style.backgroundColor = 'white';
        this.overlay.classList.add('visible');
        this.timerEl.innerText = 'OPEN EYES!';
        this.timerEl.style.color = 'black';

        SoundUtils.playBeep(1000, 'square', 0.5);
      }
    }

    // 3. READY - keep eyes open
    else if (this.state === 'READY') {
      if (isEyesClosed) {
        this.cancelSOS('User closed eyes again');
        return;
      }

      const confirmElapsed = now - this.confirmStartTime;
      const timeLeft = ((this.CONFIRM_TIME - confirmElapsed) / 1000).toFixed(
        1
      );
      this.timerEl.innerText = `KEEP OPEN: ${timeLeft}`;

      if (confirmElapsed > this.CONFIRM_TIME) {
        this.sendSOS();
      }
    }
  }

  sendSOS() {
    if (this.state === 'SENT') return;
    this.state = 'SENT';

    this.overlay.classList.remove('visible');

    if (window.showFeedback) {
      window.showFeedback('EMERGENCY SENT 🚨', 'emergency');
    }

    SoundUtils.playBeep(1200, 'square', 1.0);

    console.log('SOS SENT');

    setTimeout(() => this.reset(), 5000);
  }

  cancelSOS(reason) {
    console.log(`Cancelled: ${reason}`);
    this.reset();

    SoundUtils.playBeep(150, 'sine', 0.2);
  }

  reset() {
    this.state = 'IDLE';
    this.overlay.classList.remove('visible');
    this.overlay.style.backgroundColor = '';
    this.timerEl.style.color = '';
  }
}
