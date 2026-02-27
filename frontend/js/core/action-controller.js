/* frontend/js/core/action-controller.js */

import { SoundUtils } from '../utils/sound.js';
import { AlertService } from '../api/alert-service.js';
import { SUB_MENU_DATA } from '../data.js';
import { showFeedback } from '../modules/ui-utils.js';

export class ActionController {
    constructor({
        gridUI,
        viewManager,
        sleepManager,
        kbManager,
        mediaManager,
        sosSystem,
        onStopScanning,
        onStartScanning,
        onResetTriggerState,
        helpers
    }) {
        this.gridUI = gridUI;
        this.viewManager = viewManager;
        this.sleepManager = sleepManager;
        this.kbManager = kbManager;
        this.mediaManager = mediaManager;
        this.sosSystem = sosSystem;

        // Callbacks to control scanning from main.js
        this.stopScanning = onStopScanning;
        this.startScanning = onStartScanning;
        this.resetTriggerState = onResetTriggerState;

        // Helper functions passed from main.js
        this.helpers = helpers;

        // State flags
        this.isProcessingAction = false;
        this.isTriggering = false;
    }

    async triggerSelection() {
        if (this.isProcessingAction || this.isTriggering) return;

        this.isProcessingAction = true;
        this.isTriggering = true;
        this.stopScanning();

        // 🚨 FIX: privileged path
        // If a full-screen video is playing, skip selectedId checks and show the control panel directly
        if (this.viewManager.currentView === 'video-playing') {
            console.log("📺 Video Playing Mode: Waking up controls...");
            this.mediaManager.videoPlayer.showControlPanel(this.gridUI);
            this.viewManager.currentView = 'video-panel';

            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 200); // ✨ Faster Response
            return;
        }

        if (this.viewManager.currentView === 'audio-playing') {
            console.log("🎵 Audio Playing: Waking up controls...");

            const audioEl = document.getElementById('main-audio');
            if (audioEl) audioEl.pause();

            const overlay = document.getElementById('audio-control-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => overlay.classList.add('visible'), 10);
            }

            this.mediaManager.audioPlayer.renderControls(this.gridUI);
            this.viewManager.currentView = 'audio-panel';

            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 200); // ✨ Faster Response
            return;
        }

        // --- Standard mode checks ---
        const selectedId = this.gridUI.getCurrentId();

        // If not in video mode and nothing is selected, treat as an invalid trigger
        if (!selectedId) {
            this.resetTriggerState();
            this.startScanning();
            return;
        }

        SoundUtils.playBeep(880, 'sine', 0.1);

        // ✨ FEATURE: Instantly speak the name of the button that was just clicked!
        this._speakSelectionLabel(selectedId);

        // --- Audio Control Panel ---
        if (this.viewManager.currentView === 'audio-panel') {
            if (selectedId) {
                this._handleAudioPanel(selectedId);
            }
            return;
        }

        // --- Keyboard View ---
        if (this.viewManager.currentView === 'keyboard') {
            await this._handleKeyboardView(selectedId);
            return;
        }

        // --- Main Menu ---
        if (this.viewManager.currentView === 'main') {
            this._handleMainMenu(selectedId);
            return;
        }

        // --- Sub Menu ---
        if (this.viewManager.currentView === 'sub') {
            await this._handleSubMenu(selectedId);
            return;
        }

        // --- Body Details ---
        if (this.viewManager.currentView === 'body-details') {
            await this._handleBodyDetails(selectedId);
            return;
        }

        // --- Media Library ---
        if (this.viewManager.currentView === 'media-library') {
            this._handleMediaLibrary(selectedId);
            return;
        }

        // --- Video Control Panel ---
        if (this.viewManager.currentView === 'video-panel') {
            this._handleVideoPanel(selectedId);
            return;
        }

        // Default fallback
        setTimeout(() => {
            this.resetTriggerState();
            if (!document.hidden && !this.sleepManager.isSleeping) this.startScanning();
        }, 1000); // ✨ Reduced from 3000ms
    }

    async _handleKeyboardView(selectedId) {
        const callbacks = {
            onExit: () => {
                if (this.viewManager.keyboardMode === 'youtube-search') {
                    // Keep search mode
                } else {
                    this.viewManager.keyboardMode = 'speak';
                    const sendLabel = document.querySelector('#kb-send .kb-label');
                    if (sendLabel) sendLabel.innerText = 'SEND';
                }

                this.helpers.backToMain();
                this.sleepManager.resetTimer();
            }
        };

        // 1. If it is a YouTube Search, handle it here
        if (selectedId === 'kb-send' && this.viewManager.keyboardMode === 'youtube-search') {
            const text = this.kbManager.currentText;
            if (text.trim().length > 0) {
                console.log('🔍 Searching YouTube for:', text);
                this.mediaManager.youtubePlayer.searchAndRender(text, this.gridUI);

                this.viewManager.currentView = 'media-library';
                setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
            } else {
                this.resetTriggerState();
                if (!this.sleepManager.isSleeping) this.startScanning();
            }
            return;
        } else if (selectedId === 'kb-send') {
            const text = this.kbManager.currentText;
            if (text.trim().length > 0) {
                console.log('🗣 Speaking:', text);

                // Expand via Gemini AI before sending
                const expandedText = await window.expandIntentWithAI(text);
                this.kbManager.speakText(expandedText);

                // Sync with Caregiver App (use expanded version)
                AlertService.sendSimpleAlert('MESSAGE', expandedText);

                this.kbManager.clear();
                this.helpers.renderKeyboardMatrix(this.kbManager, this.gridUI);

                if (window.showFeedback) window.showFeedback('SENT ✅', 'success');
                this.helpers.backToMain();

                this.sleepManager.resetTimer();
                setTimeout(() => {
                    this.resetTriggerState();
                    if (!this.sleepManager.isSleeping) {
                        this.startScanning();
                    }
                }, 200);
            } else {
                this.resetTriggerState();
                if (!this.sleepManager.isSleeping) this.startScanning();
            }
            return;
        }

        // 2. For ALL other keyboard actions (including normal SEND), let keyboard-ui.js handle it!
        // This makes sure your Gemini AI sentence formatter actually runs.
        this.helpers.handleKeyboardAction(selectedId, this.kbManager, this.gridUI, (newTarget) => {
            this.helpers.setKbScanTarget(newTarget);
        }, callbacks).then(() => {
            this.sleepManager.resetTimer();
            this.helpers.setEyeState(false, 0);
            this.gridUI.updateConfirmBar(0);

            setTimeout(() => {
                this.resetTriggerState();
                if (!this.sleepManager.isSleeping) {
                    this.startScanning();
                }
            }, 600); // ✨ Faster UI Response
        });
    }

    _handleMainMenu(selectedId) {
        if (selectedId === 'c-kb') {
            this.kbManager.setMode('speak');
            const kbTarget = this.viewManager.goKeyboard('speak');
            this.helpers.setKbScanTarget(kbTarget);
            showFeedback("Double blink: Space. Triple blink: Switch to Word List.", "info");
            this.sleepManager.resetTimer();
            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 50);
            return;
        }

        if (SUB_MENU_DATA[selectedId]) {
            this.helpers.openSubMenu(selectedId);
            this.sleepManager.resetTimer();
            return; // ✨ openSubMenu in main.js handles the reset and startScanning now!
        }

        console.warn('Main Menu: Unknown selection', selectedId);
        this.resetTriggerState();
        if (!this.sleepManager.isSleeping) this.startScanning();
    }

    async _handleSubMenu(selectedId) {
        if (selectedId === 'btn-back') {
            this.helpers.backToMain();
            this.sleepManager.resetTimer();
            // ✨ backToMain in main.js handles the timeout/reset now!
            return;
        }

        if (selectedId === 'cmd-youtube') {
            console.log("🎬 YouTube Triggered: Switching to Keyboard Search Mode");
            this.kbManager.setMode('search');
            const kbTarget = this.viewManager.goKeyboard('youtube-search');
            this.helpers.setKbScanTarget(kbTarget);

            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 200);
            return;
        }

        const needsCmds = ['cmd-water', 'cmd-food', 'cmd-toilet', 'cmd-meds', 'cmd-suction'];
        if (needsCmds.includes(selectedId)) {
            const needType = selectedId.replace('cmd-', '');

            // Expand via AI
            const expandedText = await window.expandIntentWithAI(needType);

            // Speak pre-send
            window.speakText(expandedText);

            AlertService.sendSimpleAlert('need', expandedText);
            showFeedback(`${needType.toUpperCase()} SENT ✅`, 'success');

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 800);
            return;
        }

        const mediaCommands = ['cmd-local', 'cmd-music', 'cmd-audiobook', 'cmd-photos'];
        if (mediaCommands.includes(selectedId)) {
            const appType = selectedId.replace('cmd-', '');
            this.mediaManager.open(appType, this.gridUI, this.sleepManager);
            this.viewManager.currentView = 'media-library';

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
            return;
        }

        if (selectedId.startsWith('cmd-')) {
            const action = selectedId.replace('cmd-', '');

            // 1. Specialized sync requests (Temp / Itch)
            const syncBodyCmds = ['temp', 'itch'];
            if (syncBodyCmds.includes(action)) {
                this.helpers.handleSyncRequest(action);
                return;
            }

            // 2. Navigation / Special items
            if (action === 'youtube' || action === 'back') return;
            if (['local', 'music', 'audiobook', 'photos'].includes(action)) return;

            // 3. Default: Send Alert to Caregiver (Expanded via AI)
            console.log(`🚀 SYNCING COMMAND: ${action}`);

            // Convert ID to a readable label first if possible, then expand
            const expandedAction = await window.expandIntentWithAI(action);

            // Speak pre-send
            window.speakText(expandedAction);

            AlertService.sendSimpleAlert(action, expandedAction);
            showFeedback(`${action.toUpperCase()} SENT ✅`, 'success');

            setTimeout(() => {
                this.sleepManager.resetTimer();
                this.resetTriggerState();
                if (!this.sleepManager.isSleeping) this.startScanning();
            }, 1000); // ✨ Reduced waiting from 2000ms to 1000ms
            return;
        }

        // Placeholder for other unexpected commands
        console.warn(`⚠️ UNKNOWN COMMAND: ${selectedId}`);
        this.resetTriggerState();
        if (!this.sleepManager.isSleeping) this.startScanning();
    }

    async _handleBodyDetails(selectedId) {
        // 1. Handle back button
        if (selectedId === 'body-back') {
            this.helpers.openSubMenu('c-body');
            return;
        }

        // 2. Validate ID format
        if (!selectedId.startsWith('detail-')) {
            console.warn('Body Details: Invalid selection', selectedId);
            this.resetTriggerState();
            if (!this.sleepManager.isSleeping) this.startScanning();
            return;
        }

        const detailId = selectedId.replace('detail-', '');

        // 5. Send alert (API) - Expanded via AI
        const expandedDetail = await window.expandIntentWithAI(detailId);

        // Speak expanded intent
        window.speakText(expandedDetail);

        if (detailId === 'too-hot' || detailId === 'too-cold') {
            AlertService.sendSimpleAlert('temp', expandedDetail);
        } else if (['head', 'back', 'arm', 'leg'].includes(detailId)) {
            AlertService.sendSimpleAlert('itch', expandedDetail);
        }
        showFeedback(`SENT: ${detailId.toUpperCase()} ✅`, 'success');

        // 6. Stay mode: resume scanning after brief feedback
        setTimeout(() => {
            this.resetTriggerState();
            if (!this.sleepManager.isSleeping) {
                this.startScanning();
            }
        }, 800); // ✨ Faster UI Response
    }

    _handleMediaLibrary(selectedId) {
        if (selectedId === 'yt-back') {
            this.kbManager.setMode('search');
            const kbTarget = this.viewManager.goKeyboard('youtube-search');
            this.helpers.setKbScanTarget(kbTarget);

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
            return;
        }

        if (selectedId === 'media-lib-back') {
            this.mediaManager.exit();
            this.viewManager.currentView = 'sub';
            this.gridUI.refreshCards('#sub-grid .card');
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
            return;
        }

        if (selectedId.startsWith('vid-') || selectedId.startsWith('yt-')) {
            console.log('🎥 Video Selected:', selectedId);

            // 1. Show the instructions first
            showFeedback("Close eyes for 2s to Exit. Double blink to Pause.", "info");

            // 2. Wait for the feedback to finish (we set it to 6s in ui-utils.js) 
            // before starting the video
            setTimeout(() => {
                this.mediaManager.videoPlayer.playVideo(selectedId);
                this.viewManager.currentView = 'video-playing';
                this.stopScanning();
                this.resetTriggerState();
            }, 4000); // ✨ Matches your 6-second feedback time

            return;
        }

        if (selectedId.startsWith('aud-')) {
            console.log("💿 Selected Audio:", selectedId);
            this.mediaManager.audioPlayer.openPlayer(selectedId, this.gridUI);
            this.viewManager.currentView = 'audio-playing';
            this.stopScanning();
            AlertService.sendSimpleAlert('STATUS', 'Listening to audio. Patient may fall asleep.');
            // ✨ ADDED: Tell the user it's safe to rest!
            setTimeout(() => {
                showFeedback("Rest safely. Double blink: Pause/Play. 3 blinks: Menu. 4 blinks: Emergency SOS", "info");
            }, 1500);
            setTimeout(() => { this.resetTriggerState(); }, 200);
            return;
        }

        // ✨ Default: Unknown media library selection
        console.warn('Media Library: Unknown selection', selectedId);
        this.resetTriggerState();
        if (!this.sleepManager.isSleeping) this.startScanning();
    }

    _handleVideoPanel(selectedId) {
        const actionResult = this.mediaManager.videoPlayer.handleCommand(selectedId, this.gridUI, () => {
            console.log("🔙 Exiting Video... Force Hiding Everything!");

            this.viewManager.currentView = 'media-library';

            const playerContainer = document.getElementById('video-player-container');
            const iframeEl = document.getElementById('youtube-iframe');
            const controlOverlay = document.getElementById('video-control-overlay');
            const mediaView = document.getElementById('media-view');
            const libraryGrid = document.getElementById('video-library-grid');

            if (playerContainer) {
                playerContainer.style.display = 'none';
                playerContainer.classList.add('hidden');
            }
            if (iframeEl) {
                iframeEl.style.display = 'none';
                iframeEl.src = '';
            }
            if (controlOverlay) {
                controlOverlay.style.display = 'none';
                controlOverlay.classList.add('hidden');
            }

            if (mediaView) {
                mediaView.style.display = 'block';
                mediaView.classList.remove('hidden');
            }

            if (libraryGrid) {
                libraryGrid.style.display = 'grid';
                libraryGrid.classList.remove('hidden');
            }

            console.log("🔄 Refreshing cards for Media Library...");
            this.gridUI.refreshCards('#video-library-grid .card');

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
        });

        if (actionResult === 'RESUMED') {
            this.viewManager.currentView = 'video-playing';
            this.stopScanning();
            setTimeout(() => { this.resetTriggerState(); }, 200);
            return;
        }

        if (actionResult === 'STAY_IN_PANEL') {
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
            return;
        }

        // ✨ Default: Unknown video panel action
        console.warn('Video Panel: Unknown action result', actionResult);
        this.resetTriggerState();
        if (!this.sleepManager.isSleeping) this.startScanning();
    }

    _handleAudioPanel(selectedId) {
        console.log("🎛 Audio Control Triggered:", selectedId);
        const actionResult = this.mediaManager.audioPlayer.handleCommand(selectedId, this.gridUI, () => {
            this.viewManager.currentView = 'media-library';
            const audioContainer = document.getElementById('audio-player-container');
            const libraryGrid = document.getElementById('video-library-grid');
            if (audioContainer) audioContainer.classList.add('hidden');
            if (libraryGrid) libraryGrid.classList.remove('hidden');
            this.stopScanning();
            this.gridUI.clearHighlights();
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
        });

        if (actionResult === 'RESUMED') {
            this.viewManager.currentView = 'audio-playing';
            const overlay = document.getElementById('audio-control-overlay');
            if (overlay) {
                overlay.classList.remove('visible');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
            this.stopScanning();
            this.gridUI.clearHighlights();
            setTimeout(() => { this.resetTriggerState(); }, 200);
            return;
        }

        if (actionResult === 'STAY') {
            this.stopScanning();
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 200);
            return;
        }

        if (actionResult === 'EXITED') {
            console.log("Audio Player: Exited gracefully.");
            return;
        }

        // ✨ Default: Unknown audio player action
        console.warn('Audio Player: Unknown action result', actionResult);
        this.resetTriggerState();
        if (!this.sleepManager.isSleeping) this.startScanning();
    }

    // ✨ TEXT TO SPEECH HELPER: Reads the label of the item the user just selected out loud
    _speakSelectionLabel(id) {
        const el = document.getElementById(id);
        if (!el) return;

        let textToSpeak = "";

        // 1. Look for the label text inside the button
        const labelEl = el.querySelector('.label') || el.querySelector('.kb-label') || el.querySelector('.word');
        if (labelEl) {
            textToSpeak = labelEl.innerText.trim();
        }
        // 2. Fallback: If it's a typing character (e.g., 'char-A')
        else if (id.startsWith('char-')) {
            textToSpeak = id.split('-')[1];
        }

        if (textToSpeak) {
            // Fix abbreviations so they sound natural
            const pronunciationMap = {
                'DEL': 'Delete',
                'YT': 'YouTube',
                'KB': 'Keyboard',
                'SPACE': 'Space',
                'SEND': 'Send Message'
            };

            // Apply pronunciation fix if it exists
            const finalSpeech = pronunciationMap[textToSpeak.toUpperCase()] || textToSpeak;

            // Stop any ongoing speech and say the new word immediately
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(finalSpeech.toLowerCase());
            utterance.rate = 1.3; // Speak slightly faster for quick UI feedback
            window.speechSynthesis.speak(utterance);
        }
    }
}