/* frontend/js/modules/media/video-player.js */

const LOCAL_VIDEOS = [
    { id: 'vid-1', title: 'Family Picnic', sub: '12 Mins', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'vid-2', title: 'Grandson Bday', sub: '5 Mins', src: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 'vid-3', title: 'Old Movie', sub: '1 Hr 20 Mins', src: 'https://www.w3schools.com/html/mov_bbb.mp4' }
];

export class VideoPlayer {
    constructor() {
        this.currentVideoId = null;
    }

  renderLibrary(gridUI) {
    const playerContainer = document.getElementById('video-player-container');
    const libraryGrid = document.getElementById('video-library-grid');

    if (!playerContainer || !libraryGrid) {
        console.warn('VideoPlayer: Required HTML elements not found.');
        return; 
    }

    playerContainer.classList.add('hidden');
    libraryGrid.classList.remove('hidden');

    libraryGrid.innerHTML = '';

    if (Array.isArray(LOCAL_VIDEOS) && LOCAL_VIDEOS.length > 0) {
        LOCAL_VIDEOS.forEach(video => {
            const card = document.createElement('article');
            card.className = 'card kb-card';
            card.id = video.id || '';
            card.innerHTML = `
                <div class="kb-text">
                    <div class="kb-label" style="font-size:1.5rem;">🎬 ${video.title || 'Untitled'}</div>
                    <div class="kb-sub">${video.sub || ''}</div>
                </div>
                <div class="scan-bar"></div>
                <div class="confirm-bar"></div>
            `;
            libraryGrid.appendChild(card);
        });
    } else {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'No videos available';
        emptyMsg.style.color = '#999';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.padding = '2rem';
        libraryGrid.appendChild(emptyMsg);
    }

        const backCard = document.createElement('article');
        backCard.className = 'card kb-card delete';
        backCard.id = 'media-lib-back';
        backCard.innerHTML = `<div class="kb-text"><div class="kb-label">↩️ BACK</div></div><div class="scan-bar"></div><div class="confirm-bar"></div>`;
        libraryGrid.appendChild(backCard);

        gridUI.refreshCards('#video-library-grid .card');
    }

    playVideo(videoId) {
        const videoData = LOCAL_VIDEOS.find(v => v.id === videoId);
        if (!videoData) return;

        document.getElementById('video-library-grid').classList.add('hidden');
        document.getElementById('video-player-container').classList.remove('hidden');
        document.getElementById('video-control-overlay').classList.add('hidden');
        
        const videoEl = document.getElementById('main-video');
        videoEl.src = videoData.src;
        videoEl.play();
        
        console.log(`▶️ 开始沉浸播放: ${videoData.title}`);
    }

    showControlPanel(gridUI) {
        const videoEl = document.getElementById('main-video');
        videoEl.pause();

        const overlay = document.getElementById('video-control-overlay');
        overlay.classList.remove('hidden');

        const controlGrid = document.getElementById('video-control-grid');
        controlGrid.innerHTML = '';

        const controls = [
            { id: 'vc-restart', label: '⏮️ RESTART', sub: 'From Beginning', type: 'tool' },
            { id: 'vc-volup', label: '🔊 VOL UP', sub: 'Louder', type: 'group' },
            { id: 'vc-exit', label: '🛑 EXIT', sub: 'To Library', type: 'delete' },
            
            { id: 'vc-rewind', label: '⏪ -10 SEC', sub: 'Rewind', type: 'tool' },
            { id: 'vc-resume', label: '▶️ RESUME', sub: 'Play Video', type: 'send' },
            { id: 'vc-forward', label: '⏩ +10 SEC', sub: 'Skip', type: 'tool' },
            
            { id: 'vc-mute', label: '🔇 MUTE', sub: 'Silence', type: 'tool' },
            { id: 'vc-voldown', label: '🔉 VOL DOWN', sub: 'Softer', type: 'group' },
            { id: 'vc-blank', label: '', sub: '', type: 'tool' }
        ];

        controls.forEach(ctrl => {
            const card = document.createElement('article');
            card.className = `card kb-card ${ctrl.type}`;
            card.id = ctrl.id;
            if (ctrl.id === 'vc-blank') {
                card.style.opacity = '0';
            } else {
                card.innerHTML = `<div class="kb-text"><div class="kb-label">${ctrl.label}</div><div class="kb-sub">${ctrl.sub}</div></div><div class="scan-bar"></div><div class="confirm-bar"></div>`;
            }
            controlGrid.appendChild(card);
        });

        gridUI.refreshCards('#video-control-grid .card');
    }

    handleCommand(cmdId, gridUI, onExitCallback) {
        const videoEl = document.getElementById('main-video');
        
        if (cmdId === 'vc-resume') {
            document.getElementById('video-control-overlay').classList.add('hidden');
            videoEl.play();
            return 'RESUMED';
        } else if (cmdId === 'vc-exit') {
            videoEl.pause();
            videoEl.src = '';
            this.renderLibrary(gridUI);
            if (onExitCallback) onExitCallback();
            return 'EXITED';
        } else if (cmdId === 'vc-restart') {
            videoEl.currentTime = 0;
        } else if (cmdId === 'vc-rewind') {
            videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
        } else if (cmdId === 'vc-forward') {
            videoEl.currentTime += 10;
        } else if (cmdId === 'vc-volup') {
            videoEl.volume = Math.min(1, videoEl.volume + 0.2);
        } else if (cmdId === 'vc-voldown') {
            videoEl.volume = Math.max(0, videoEl.volume - 0.2);
        } else if (cmdId === 'vc-mute') {
            videoEl.muted = !videoEl.muted;
        }
        
        return 'STAY_IN_PANEL';
    }
}
