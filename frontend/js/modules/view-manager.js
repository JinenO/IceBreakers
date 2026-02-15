/* frontend/js/modules/view-manager.js */

export class ViewManager {
    constructor(gridUI, kbManager, renderKeyboardMatrix) {
        this.gridUI = gridUI;
        this.kbManager = kbManager;
        this.renderKeyboardMatrix = renderKeyboardMatrix;

        this.currentView = 'main';
        this.keyboardMode = 'speak';

        this.dom = {
            viewContainer: document.getElementById('view-container'),
            mainGrid: document.getElementById('main-grid'),
            subGrid: document.getElementById('sub-grid'),
            mediaView: document.getElementById('media-view'),
            keyboardView: document.getElementById('keyboard-view'),
            videoPlayer: document.getElementById('video-player-container'),
            audioPlayer: document.getElementById('audio-player-container'),
            statusText: document.getElementById('status-text')
        };
    }

    goMain() {
        this.hideAll();
        if (this.dom.mainGrid) this.dom.mainGrid.classList.remove('hidden');
        this.updateStatus('SYSTEM READY', '');

        this.currentView = 'main';
        return '#main-grid .card';
    }

    goSubMenu(title) {
        this.hideAll();
        if (this.dom.viewContainer) this.dom.viewContainer.classList.remove('hidden');

        this.updateStatus(title, '#4fd1c5');

        this.currentView = 'sub';
        return '#sub-grid .card';
    }

    goKeyboard(mode = 'speak') {
        this.keyboardMode = mode;
        this.hideAll();

        if (this.dom.keyboardView) this.dom.keyboardView.classList.remove('hidden');

        this.kbManager.state = 'GROUP';
        this.kbManager.clear();
        this.kbManager.currentPredictions = [];
        this.renderKeyboardMatrix(this.kbManager, this.gridUI);

        const sendLabel = document.querySelector('#kb-send .kb-label');
        if (sendLabel) {
            sendLabel.innerText = mode === 'youtube-search' ? 'SEARCH' : 'SEND';
        }

        this.currentView = 'keyboard';
        return '#kb-prediction-bar .predict-btn, #kb-grid .kb-card';
    }

    goMediaLibrary() {
        this.hideAll();
        if (this.dom.mediaView) this.dom.mediaView.classList.remove('hidden');

        this.currentView = 'media-library';
        return '#video-library-grid .card';
    }

    hideAll() {
        if (this.dom.viewContainer) this.dom.viewContainer.classList.add('hidden');
        if (this.dom.mainGrid) this.dom.mainGrid.classList.add('hidden');
        if (this.dom.mediaView) this.dom.mediaView.classList.add('hidden');
        if (this.dom.keyboardView) this.dom.keyboardView.classList.add('hidden');
        if (this.dom.videoPlayer) this.dom.videoPlayer.classList.add('hidden');
        if (this.dom.audioPlayer) this.dom.audioPlayer.classList.add('hidden');
    }

    updateStatus(text, color) {
        if (!this.dom.statusText) return;
        this.dom.statusText.innerText = text;
        this.dom.statusText.style.color = color;
    }
}
