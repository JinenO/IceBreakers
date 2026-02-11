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
            card.className = 'card';
            card.id = video.id;
            card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon" style="font-size: 2.5rem; margin-bottom: 10px;">🎬</div>
                <div class="label">${video.title}</div>
                <div class="sub-label">${video.sub}</div>
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
        backCard.className = 'card';
        backCard.id = 'media-lib-back';
        backCard.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon" style="font-size: 2.5rem; margin-bottom: 10px;">↩️</div>
            <div class="label">BACK</div>
            <div class="sub-label">Media Menu</div>
            <div class="confirm-bar"></div>
        `;
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
        
        console.log(`▶️ Starting immersive playback: ${videoData.title}`);
    }

    showControlPanel(gridUI) {
        const videoEl = document.getElementById('main-video');
        videoEl.pause();

        const overlay = document.getElementById('video-control-overlay');
        overlay.classList.remove('hidden');

        const controlGrid = document.getElementById('video-control-grid');
        controlGrid.innerHTML = '';

        const controls = [
            { id: 'vc-rewind', label: '-10 SEC', sub: 'Rewind', type: 'tool', icon: 'rewind.png' },
            { id: 'vc-resume', label: 'RESUME', sub: 'Play Video', type: 'send', icon: 'play.png' },
            { id: 'vc-forward', label: '+10 SEC', sub: 'Skip', type: 'tool', icon: 'forward.png' },
            { id: 'vc-restart', label: 'RESTART', sub: 'From Beginning', type: 'tool', icon: 'restart.png' },
            { id: 'vc-voldown', label: 'VOL -', sub: 'Softer', type: 'group', icon: 'vol-down.png' },
            { id: 'vc-mute', label: 'MUTE', sub: 'Silence', type: 'tool', icon: 'mute.png' },
            { id: 'vc-volup', label: 'VOL +', sub: 'Louder', type: 'group', icon: 'vol-up.png' },
            { id: 'vc-exit', label: 'EXIT', sub: 'To Library', type: 'delete', icon: 'exit.png' }
        ];

        controls.forEach(ctrl => {
            const card = document.createElement('article');
            card.className = `card ${ctrl.type || ''}`;
            card.id = ctrl.id;
            card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon">
                    <img src="assets/icons/${ctrl.icon}" alt="" style="width: 50px; height: 50px; object-fit: contain;">
                </div>
                <div class="label">${ctrl.label}</div>
                <div class="sub-label">${ctrl.sub}</div>
                <div class="confirm-bar"></div>
            `;
            controlGrid.appendChild(card);
        });

        gridUI.refreshCards('#video-control-grid .card');
    }

handleCommand(cmdId, gridUI, onExitCallback) {
        const videoEl = document.getElementById('main-video');
        const overlay = document.getElementById('video-control-overlay');
        let toastHTML = ''; // 准备好要显示的 HTML 内容
        
        const makeToast = (iconName, text) => {
            return `<div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                        <img src="assets/icons/${iconName}" style="width: 45px; height: 45px; object-fit: contain;">
                        <span>${text}</span>
                    </div>`;
        };

        if (cmdId === 'vc-exit') {
            videoEl.pause();
            videoEl.src = '';
            this.renderLibrary(gridUI); 
            if(onExitCallback) onExitCallback();
            return 'EXITED';
        }

        if (cmdId === 'vc-resume') { 
            toastHTML = makeToast('play.png', 'PLAYING'); 
        }
        else if (cmdId === 'vc-restart') { 
            videoEl.currentTime = 0; 
            toastHTML = makeToast('restart.png', 'RESTARTED'); 
        }
        else if (cmdId === 'vc-rewind') { 
            videoEl.currentTime = Math.max(0, videoEl.currentTime - 10); 
            toastHTML = makeToast('rewind.png', '-10 SEC'); 
        }
        else if (cmdId === 'vc-forward') { 
            videoEl.currentTime += 10; 
            toastHTML = makeToast('forward.png', '+10 SEC'); 
        }
        else if (cmdId === 'vc-volup') { 
            videoEl.volume = Math.min(1, videoEl.volume + 0.2); 
            videoEl.muted = false; 
            toastHTML = makeToast('vol-up.png', `VOL: ${Math.round(videoEl.volume * 100)}%`); 
        }
        else if (cmdId === 'vc-voldown') { 
            videoEl.volume = Math.max(0, videoEl.volume - 0.2); 
            toastHTML = makeToast('vol-down.png', `VOL: ${Math.round(videoEl.volume * 100)}%`); 
        }
        else if (cmdId === 'vc-mute') { 
            videoEl.muted = !videoEl.muted; 
            toastHTML = videoEl.muted 
                ? makeToast('mute.png', 'MUTED') 
                : makeToast('vol-up.png', 'UNMUTED'); 
        }

        overlay.classList.add('hidden'); 
        videoEl.play();

        this.showToast(toastHTML);

        return 'RESUMED';
    }

    showToast(message) {
        const toast = document.getElementById('video-toast');
        if (!toast) return;
        
        toast.innerHTML = message;
        toast.classList.remove('hidden');
        toast.style.opacity = '1';

        if (this.toastTimer) clearTimeout(this.toastTimer);

        this.toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.classList.add('hidden'), 300); 
        }, 2000);
    }
}
