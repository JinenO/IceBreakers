/* frontend/js/modules/media/audio-player.js */

// ✨ Import the data file
import { MUSIC_LIST, BOOK_LIST } from './audio-data.js';

export class AudioPlayer {
    constructor() {
        this.currentAppType = null; // 'music' or 'audiobook'
        this.currentAudioId = null;
    }

    // ✨ Helper: control background (cover/title) visibility
    // isVisible = true: show cover (listening mode)
    // isVisible = false: hide cover (menu mode)
    toggleBackgroundInfo(isVisible) {
        const container = document.getElementById('now-playing-container');
        if (container) {
            container.style.opacity = isVisible ? '1' : '0';
            container.style.transition = 'opacity 0.3s ease';
            // Disable clicks when hidden to prevent mis-taps
            container.style.pointerEvents = isVisible ? 'auto' : 'none';
        }
    }

    // --- 1. Render list (Media Library view) ---
    renderLibrary(appType, gridUI) {
        this.currentAppType = appType;
        const libraryGrid = document.getElementById('video-library-grid'); 
        
        // Ensure container state is correct
        libraryGrid.classList.remove('hidden');
        document.getElementById('audio-player-container').classList.add('hidden');
        document.getElementById('video-player-container').classList.add('hidden');
        
        // Ensure control overlay is hidden
        const overlay = document.getElementById('audio-control-overlay');
        if (overlay) overlay.classList.add('hidden');

        libraryGrid.innerHTML = '';

        const dataList = appType === 'music' ? MUSIC_LIST : BOOK_LIST;
        const defaultIcon = appType === 'music' ? 'music.png' : 'book.png'; 

        // Generate cards
        dataList.forEach(item => {
            const card = document.createElement('article');
            card.className = 'card';
            card.id = item.id;
            card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon">
                    <img src="${item.cover}" alt="" onerror="this.src='assets/icons/${defaultIcon}'">
                </div>
                <div class="label">${item.title}</div>
                <div class="sub-label">${item.sub}</div>
                <div class="confirm-bar"></div>
            `;
            libraryGrid.appendChild(card);
        });

        // Back button
        const backCard = document.createElement('article');
        backCard.className = 'card';
        backCard.id = 'media-lib-back';
        backCard.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/back.png"></div>
            <div class="label">BACK</div>
            <div class="sub-label">To Menu</div>
            <div class="confirm-bar"></div>
        `;
        libraryGrid.appendChild(backCard);

        gridUI.refreshCards('#video-library-grid .card');
    }

    // --- 2. Open player (Audio Playing view) ---
    openPlayer(audioId, gridUI) {
        this.currentAudioId = audioId;
        
        // Search across both songs and books
        const allItems = [...MUSIC_LIST, ...BOOK_LIST];
        const item = allItems.find(a => a.id === audioId);

        if (!item) return;

        console.log("💿 Playing:", item.title);

        // 1. Prepare UI: hide list
        const libraryGrid = document.getElementById('video-library-grid');
        libraryGrid.classList.add('hidden');

        // 2. Show audio container (handles sound)
        document.getElementById('audio-player-container').classList.remove('hidden');

        // 3. ✨ Core: force-hide controls (ensure no buttons at start)
        const overlay = document.getElementById('audio-control-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('visible');
        }

        // 4. Play audio
        const audioEl = document.getElementById('main-audio');
        if (audioEl) {
            audioEl.src = item.src;
            audioEl.play().catch(e => console.warn("Play error:", e));
        }

        // 5. ✨ Render now-playing UI (cover + title)
        // Always do this for both songs and books to keep UI identical
        this.renderNowPlayingScreen(item);
    }

    // ✨ Unified cover rendering function
    renderNowPlayingScreen(item) {
        const libraryGrid = document.getElementById('video-library-grid');
        libraryGrid.classList.remove('hidden'); // Reuse this area for the large display
        
        // Auto-pick default icon: music uses note, book uses book
        const defaultIcon = item.type === 'music' ? 'assets/icons/music.png' : 'assets/icons/book.png';
        // If data has no type, fall back to current app type
        const finalIcon = item.type ? defaultIcon : (this.currentAppType === 'music' ? 'assets/icons/music.png' : 'assets/icons/book.png');

        // Build the large display
        // We create a div with id="now-playing-container" so toggleBackgroundInfo can control it
        libraryGrid.innerHTML = `
            <div id="now-playing-container" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; animation: fadeIn 0.5s;">
                
                <div style="width: 280px; height: 280px; margin-bottom: 30px; position: relative;">
                    <img src="${item.cover}" onerror="this.src='${finalIcon}'" 
                        style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                </div>

                <div style="font-size: 3rem; font-weight: bold; color: #4fd1c5; margin-bottom: 10px; text-align: center;">${item.title}</div>
                <div style="font-size: 1.5rem; color: #aaa; margin-bottom: 40px;">${item.sub || 'Now Playing'}</div>

                <div style="font-size: 1.2rem; color: #666; background: rgba(0,0,0,0.3); padding: 10px 25px; border-radius: 50px;">
                    ( Close Eyes to Control )
                </div>
            </div>
        `;
    }

    // --- 3. Render control buttons (triggered by ActionController on eye close) ---
    renderControls(gridUI) {
        const controlGrid = document.getElementById('audio-control-grid');
        const overlay = document.getElementById('audio-control-overlay');
        controlGrid.innerHTML = '';

        // ✨ 1. Hide background (cover and title disappear)
        this.toggleBackgroundInfo(false);

        // ✨ 2. Show control overlay
        if (overlay) {
            overlay.classList.remove('hidden');
            void overlay.offsetWidth; // Trigger reflow
            overlay.classList.add('visible');
        }

        // ✨ 3. Choose controls based on type
        let controls = [];
        if (this.currentAppType === 'music') {
            controls = [
                { id: 'ac-resume', label: 'RESUME', sub: 'Back', icon: 'play.png', type: 'send' },
                { id: 'ac-exit', label: 'EXIT', sub: 'Library', icon: 'log-out.png', type: 'delete' },
                { id: 'ac-volup', label: 'VOL +', sub: 'Louder', icon: 'vol-up.png', type: 'tool' },
                
                { id: 'ac-prev', label: 'PREV', sub: 'Last', icon: 'rewind.png', type: 'tool' },
                { id: 'ac-next', label: 'NEXT', sub: 'Next', icon: 'forward.png', type: 'tool' },
                { id: 'ac-voldown', label: 'VOL -', sub: 'Softer', icon: 'vol-down.png', type: 'tool' }
            ];
        } else {
            // Audiobook controls (rewind/forward)
            controls = [
                { id: 'ac-resume', label: 'RESUME', sub: 'Back', icon: 'play.png', type: 'send' },
                { id: 'ac-exit', label: 'EXIT', sub: 'Library', icon: 'log-out.png', type: 'delete' },
                { id: 'ac-volup', label: 'VOL +', sub: 'Louder', icon: 'vol-up.png', type: 'tool' },
                
                { id: 'ac-rewind', label: '-15s', sub: 'Rewind', icon: 'rewind.png', type: 'tool' },
                { id: 'ac-forward', label: '+15s', sub: 'Skip', icon: 'forward.png', type: 'tool' },
                { id: 'ac-voldown', label: 'VOL -', sub: 'Softer', icon: 'vol-down.png', type: 'tool' }
            ];
        }

        controls.forEach(item => {
            const card = document.createElement('article');
            card.className = `card ${item.type}`;
            card.id = item.id;
            card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon"><img src="assets/icons/${item.icon}"></div>
                <div class="label">${item.label}</div>
                <div class="sub-label">${item.sub}</div>
                <div class="confirm-bar"></div>
            `;
            controlGrid.appendChild(card);
        });

        gridUI.refreshCards('#audio-control-grid .card');
    }

    // --- 4. Handle commands ---
    handleCommand(cmdId, gridUI, onExitCallback) {
        const audioEl = document.getElementById('main-audio');
        const overlay = document.getElementById('audio-control-overlay');

        const hideOverlay = () => {
            if (overlay) {
                overlay.classList.remove('visible');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
        };

        if (cmdId === 'ac-resume') {
            audioEl.play();
            hideOverlay();
            // ✨ When resuming, show cover and title again
            this.toggleBackgroundInfo(true);
            return 'RESUMED';
        }

        if (cmdId === 'ac-volup') {
            audioEl.volume = Math.min(1, audioEl.volume + 0.2);
            return 'STAY';
        }
        if (cmdId === 'ac-voldown') {
            audioEl.volume = Math.max(0, audioEl.volume - 0.2);
            return 'STAY';
        }

        if (cmdId === 'ac-exit') {
            audioEl.pause();
            audioEl.src = ''; 
            hideOverlay();
            
            // Restore background visibility on exit
            this.toggleBackgroundInfo(true);
            
            this.renderLibrary(this.currentAppType, gridUI);
            if(onExitCallback) onExitCallback(); 
            return 'EXITED';
        }
        
        // Playback control logic
        if (cmdId === 'ac-rewind') audioEl.currentTime = Math.max(0, audioEl.currentTime - 15);
        else if (cmdId === 'ac-forward') audioEl.currentTime += 15;
        else if (cmdId === 'ac-prev' || cmdId === 'ac-next') {
            const dataList = this.currentAppType === 'music' ? MUSIC_LIST : BOOK_LIST;
            let idx = dataList.findIndex(item => item.id === this.currentAudioId);
            if (cmdId === 'ac-next') idx = (idx + 1) % dataList.length;
            else idx = (idx - 1 + dataList.length) % dataList.length;
            
            this.openPlayer(dataList[idx].id, gridUI);
        }

        return 'STAY';
    }
}