import { SoundUtils } from '../utils/sound.js';
import { AlertService } from '../api/alert-service.js';

export class SOSSystem {
  constructor() {
    this.overlay = document.getElementById('sos-overlay');
    this.timerEl = document.getElementById('sos-timer');
    this.sleepOverlay = document.getElementById('sleep-overlay');

    this.state = 'IDLE';
    // IDLE -> CHARGING -> WAIT_FOR_OPEN -> READY -> SENT

    this.chargeStartTime = 0;
    this.waitStartTime = 0;
    this.confirmStartTime = 0;

    this.CHARGE_TIME = 3000; // Eyes closed for 3s
    this.WAIT_TIMEOUT = 8000; // Max wait time to open eyes
    this.CONFIRM_TIME = 2000; // Eyes open confirm for 2s
  }

  /**
   * Core loop: called every frame from main.js
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

    // 2. CHARGING
    else if (this.state === 'CHARGING') {
      if (!isEyesClosed) {
        this.reset();
        return;
      }

      const elapsed = now - this.chargeStartTime;
      if (elapsed > 1000 && elapsed < 1100) SoundUtils.playBeep(400, 'sine', 0.1);
      if (elapsed > 2000 && elapsed < 2100) SoundUtils.playBeep(600, 'sine', 0.1);

      if (elapsed > this.CHARGE_TIME) {
        this.state = 'WAIT_FOR_OPEN';
        this.waitStartTime = now;

        this.overlay.style.backgroundColor = 'white';
        this.overlay.classList.add('visible');
        this.timerEl.innerHTML = 'OPEN EYES NOW!<br><span style="font-size: 2rem; color: #999">(Keep closed to sleep)</span>';
        this.timerEl.style.color = 'black';
        SoundUtils.playBeep(1000, 'square', 0.5);
      }
    }

    // 3. WAIT_FOR_OPEN
    else if (this.state === 'WAIT_FOR_OPEN') {
      if (!isEyesClosed) {
        this.state = 'READY';
        this.confirmStartTime = now;
      } else {
        const waitElapsed = now - this.waitStartTime;
        if (waitElapsed > this.WAIT_TIMEOUT) {
          console.log('SOS: Timeout -> User Sleeping. Entering Lockout.');
          this.state = 'SLEEP_LOCKOUT';
          this.overlay.classList.remove('visible');
          this.overlay.style.backgroundColor = '';
          if (this.sleepOverlay) this.sleepOverlay.classList.add('active');
          SoundUtils.playBeep(100, 'sine', 0.5);
        }
      }
    }

    // 4. SLEEP_LOCKOUT
    else if (this.state === 'SLEEP_LOCKOUT') {
      if (!isEyesClosed) {
        console.log('SOS: User woke up. System Ready.');
        this.reset();
      }
    }

    // 5. READY
    else if (this.state === 'READY') {
      if (isEyesClosed) {
        this.cancelSOS('User closed eyes during confirm');
        return;
      }
      const confirmElapsed = now - this.confirmStartTime;
      const timeLeft = ((this.CONFIRM_TIME - confirmElapsed) / 1000).toFixed(1);
      this.timerEl.innerText = `KEEP OPEN: ${timeLeft}`;

      if (confirmElapsed > this.CONFIRM_TIME) {
        this.sendSOS();
      }
    }
  }

  sendSOS(customMessage = 'Emergency!') {
    if (this.state === 'SENT') return;
    this.state = 'SENT';

    this.overlay.classList.remove('visible');

    if (window.showFeedback) {
      window.showFeedback('EMERGENCY SENT', 'emergency');
    }

    SoundUtils.playBeep(1200, 'square', 1.0);
    console.log('SOS SENT');

    // Trigger real alert
    AlertService.sendSimpleAlert('SOS', customMessage);

    setTimeout(() => this.reset(), 5000);
  }

  cancelSOS(reason) {
    console.log(`Cancelled: ${reason}`);
    this.reset();
    if (!reason.includes('Sleeping')) {
      SoundUtils.playBeep(150, 'sine', 0.2);
    }
  }

  reset() {
    this.state = 'IDLE';
    this.overlay.classList.remove('visible');
    this.overlay.style.backgroundColor = '';
    this.timerEl.innerHTML = '';
    this.timerEl.style.color = '';
    if (this.sleepOverlay) this.sleepOverlay.classList.remove('active');
  }
}
