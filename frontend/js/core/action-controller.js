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

    triggerSelection() {
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
            }, 500);
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
            }, 500);
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

        // --- Audio Control Panel ---
        if (this.viewManager.currentView === 'audio-panel') {
            if (selectedId) {
                this._handleAudioPanel(selectedId);
            }
            return;
        }

        // --- Keyboard View ---
        if (this.viewManager.currentView === 'keyboard') {
            this._handleKeyboardView(selectedId);
            return;
        }

        // --- Main Menu ---
        if (this.viewManager.currentView === 'main') {
            this._handleMainMenu(selectedId);
            return;
        }
        
        // --- Sub Menu ---
        if (this.viewManager.currentView === 'sub') {
            this._handleSubMenu(selectedId);
            return;
        }

        // --- Body Details ---
        if (this.viewManager.currentView === 'body-details') {
            this._handleBodyDetails(selectedId);
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
        }, 3000);
    }

    _handleKeyboardView(selectedId) {
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

        if (selectedId === 'kb-send') {
            const text = this.kbManager.currentText;
            if (text.trim().length > 0) {
                if (this.viewManager.keyboardMode === 'youtube-search') {
                    console.log('🔍 Searching YouTube for:', text);
                    this.mediaManager.youtubePlayer.searchAndRender(text, this.gridUI);

                    this.viewManager.currentView = 'media-library';
                    setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
                } else {
                    console.log('🗣 Speaking:', text);
                    this.sosSystem.speak(text);
                    this.kbManager.clear();
                    this.helpers.renderKeyboardMatrix(this.kbManager, this.gridUI);

                    this.sleepManager.resetTimer();
                    setTimeout(() => {
                        this.resetTriggerState();
                        if (!this.sleepManager.isSleeping) {
                            this.startScanning();
                        }
                    }, 500);
                }
            } else {
                this.resetTriggerState();
                if (!this.sleepManager.isSleeping) {
                    this.startScanning();
                }
            }
            return;
        }

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
            }, 800);
        });
    }

    _handleMainMenu(selectedId) {
        if (selectedId === 'c-kb') {
            this.kbManager.setMode('speak');
            const kbTarget = this.viewManager.goKeyboard('speak');
            this.helpers.setKbScanTarget(kbTarget);

            this.sleepManager.resetTimer();
            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 500);
            return;
        }

        if (SUB_MENU_DATA[selectedId]) {
            this.helpers.openSubMenu(selectedId);
            this.sleepManager.resetTimer();
            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 500);
            return;
        }

        // ✨ Default: Unknown main menu selection
        console.warn('Main Menu: Unknown selection', selectedId);
        this.resetTriggerState();
        if (!this.sleepManager.isSleeping) this.startScanning();
    }

    _handleSubMenu(selectedId) {
        if (selectedId === 'btn-back') {
            this.helpers.backToMain();
            this.sleepManager.resetTimer();
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
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
            }, 500);
            return;
        }

        const needsCmds = ['cmd-water', 'cmd-food', 'cmd-toilet', 'cmd-meds', 'cmd-suction'];
        if(needsCmds.includes(selectedId)) {
            const needType = selectedId.replace('cmd-', '');
            AlertService.sendSimpleAlert('need', needType);
            showFeedback(`${needType.toUpperCase()} SENT ✅`, 'success');

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
            return;
        }
        
        const mediaCommands = ['cmd-local', 'cmd-music', 'cmd-audiobook', 'cmd-photos'];
        if (mediaCommands.includes(selectedId)) {
            const appType = selectedId.replace('cmd-', '');
            this.mediaManager.open(appType, this.gridUI, this.sleepManager);
            this.viewManager.currentView = 'media-library';

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
            return;
        }

        const simpleBodyCmds = ['cmd-roll', 'cmd-head', 'cmd-legs'];
        if (simpleBodyCmds.includes(selectedId)) {
            const action = selectedId.replace('cmd-', '');

            SoundUtils.playBeep(880, 'sine', 0.1);
            AlertService.sendSimpleAlert(action);
            showFeedback(`${action.toUpperCase()} SENT ✅`, 'success');

            setTimeout(() => {
                this.resetTriggerState();
                this.startScanning();
            }, 2000);
            return;
        }

        const syncBodyCmds = ['cmd-temp', 'cmd-itch'];
        if (syncBodyCmds.includes(selectedId)) {
            const action = selectedId.replace('cmd-', '');
            this.helpers.handleSyncRequest(action);
            return;
        }
        
        // Placeholder for other commands
        console.log(`🚀 COMMAND SENT: ${selectedId}`);
        const msg = `${selectedId.toUpperCase()} SENT ✅`;
        showFeedback(msg, 'success');

        setTimeout(() => {
            this.sleepManager.resetTimer();
            this.resetTriggerState();
            if (!this.sleepManager.isSleeping) this.startScanning();
        }, 3000);
    }

    _handleBodyDetails(selectedId) {
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

        // 3. Prepare speech content
        const speechMap = {
            'too-hot': 'I am too hot. Please help me cool down.',
            'too-cold': 'I am too cold. Please help me warm up.',
            'just-right': 'That is better. Thank you.',
            'head': 'My head is itchy.',
            'back': 'My back is itchy.',
            'arm': 'My arm is itchy.',
            'leg': 'My leg is itchy.'
        };

        const textToSpeak = speechMap[detailId] || detailId;
        console.log(`🗣 Speaking Body Detail: ${textToSpeak}`);

        // 4. Run speech (TTS)
        try {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const enVoice = voices.find((voice) => voice.lang.includes('en'));
            if (enVoice) utterance.voice = enVoice;

            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('TTS Error:', e);
        }

        // 5. Send alert (API)
        if(detailId === 'too-hot' || detailId === 'too-cold') {
            AlertService.sendSimpleAlert('temp', detailId);
        } else if (['head', 'back', 'arm', 'leg'].includes(detailId)) {
            AlertService.sendSimpleAlert('itch', detailId);
        }
        showFeedback(`SENT: ${detailId.toUpperCase()} ✅`, 'success');

        // 6. Stay mode: resume scanning after brief feedback
        setTimeout(() => {
            this.resetTriggerState();
            if (!this.sleepManager.isSleeping) {
                this.startScanning();
            }
        }, 1000);
    }

    _handleMediaLibrary(selectedId) {
        if (selectedId === 'yt-back') {
            this.kbManager.setMode('search');
            const kbTarget = this.viewManager.goKeyboard('youtube-search');
            this.helpers.setKbScanTarget(kbTarget);

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
            return;
        }
        
        if (selectedId === 'media-lib-back') {
            this.mediaManager.exit();
            this.viewManager.currentView = 'sub';
            this.gridUI.refreshCards('#sub-grid .card');
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
            return;
        }
        
        if (selectedId.startsWith('vid-') || selectedId.startsWith('yt-')) {
            console.log('🎥 Video Selected:', selectedId);
            this.mediaManager.videoPlayer.playVideo(selectedId);
            this.viewManager.currentView = 'video-playing';
            this.stopScanning();
            setTimeout(() => { this.resetTriggerState(); }, 500);
            return;
        }
        
        if (selectedId.startsWith('aud-')) {
            console.log("💿 Selected Audio:", selectedId);
            this.mediaManager.audioPlayer.openPlayer(selectedId, this.gridUI);
            this.viewManager.currentView = 'audio-playing';
            this.stopScanning();
            setTimeout(() => { this.resetTriggerState(); }, 500);
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

            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
        });

        if (actionResult === 'RESUMED') {
            this.viewManager.currentView = 'video-playing';
            this.stopScanning();
            setTimeout(() => { this.resetTriggerState(); }, 500);
            return;
        }
        
        if (actionResult === 'STAY_IN_PANEL') {
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
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
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
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
            setTimeout(() => { this.resetTriggerState(); }, 500);
            return;
        }

        if (actionResult === 'STAY') {
            this.stopScanning();
            setTimeout(() => { this.resetTriggerState(); this.startScanning(); }, 500);
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
}
