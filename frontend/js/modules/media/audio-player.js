/* frontend/js/modules/media/audio-player.js */

// 🎵 音乐数据 (本地音乐)
const MUSIC_LIST = [
    {
        id: 'aud-m1',
        title: 'Ahead of Us',
        sub: '',
        cover: 'assets/icons/music.png',
        src: 'assets/music/Ahead of Us.mp3'
    },
    {
        id: 'aud-m2',
        title: 'Yan',
        sub: '',
        cover: 'assets/icons/music.png',
        src: 'assets/music/Yan.mp3'
    },
    {
        id: 'aud-m3',
        title: 'Merry Christmas Mr. Lawrence',
        sub: '',
        cover: 'assets/icons/music.png',
        src: 'assets/music/Merry Christmas Mr. Lawrance.mp3'
    }
];

const BOOK_LIST = [
    { 
        id: 'aud-b1', 
        title: 'The Little Prince', 
        sub: 'My Love is a Flower', 
        cover: 'assets/audio/littleprince.jpg', 
        src: 'assets/audio/little_prince.mp3'
    },
    { 
        id: 'aud-b2', 
        title: 'Atomic Habits', 
        sub: 'Atomic Habits', 
        cover: 'assets/audio/atomichabits.png', 
        src: 'assets/audio/atomic-habits.mp3' 
    },
    { 
        id: 'aud-b3', 
        title: 'Aesop Fables', 
        sub: 'the-fox-and-the-grapes', 
        cover: 'assets/audio/aesopfables.jpg', 
        src: 'assets/audio/aesop-fables.mp3' 
    }
];

export class AudioPlayer {
    constructor() {
        this.currentAppType = null; // 'music' 或 'audiobook'
        this.currentAudioId = null;
    }

    // --- 1. 渲染列表 (在 Media Library 视图) ---
    renderLibrary(appType, gridUI) {
        this.currentAppType = appType;
        const libraryGrid = document.getElementById('video-library-grid'); // 复用视频的网格
        
        // UI 切换
        libraryGrid.classList.remove('hidden');
        
        // 确保其他播放器都关掉
        const audioContainer = document.getElementById('audio-player-container');
        if(audioContainer) audioContainer.classList.add('hidden');
        
        const videoContainer = document.getElementById('video-player-container');
        if(videoContainer) videoContainer.classList.add('hidden');

        libraryGrid.innerHTML = '';

        const dataList = appType === 'music' ? MUSIC_LIST : BOOK_LIST;
        const defaultIcon = appType === 'music' ? 'music.png' : 'book.png'; 

        // 生成卡片
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

        // 生成返回按钮
        const backCard = document.createElement('article');
        backCard.className = 'card';
        backCard.id = 'media-lib-back';
        backCard.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/back.png" onerror="this.style.display='none'">BACK</div>
            <div class="label">BACK</div>
            <div class="sub-label">To Menu</div>
            <div class="confirm-bar"></div>
        `;
        libraryGrid.appendChild(backCard);

        gridUI.refreshCards('#video-library-grid .card');
    }

    // --- 2. 打开播放器 (进入 Audio Playing 视图) ---
    openPlayer(audioId, gridUI) {
        this.currentAudioId = audioId;
        const dataList = this.currentAppType === 'music' ? MUSIC_LIST : BOOK_LIST;
        const audioData = dataList.find(a => a.id === audioId);

        if (!audioData) return;

        console.log("💿 Loading Audio:", audioData.title, audioData.src);

        // UI 切换
        document.getElementById('video-library-grid').classList.add('hidden');
        const playerContainer = document.getElementById('audio-player-container');
        playerContainer.classList.remove('hidden');

        // 填充内容
        const coverImg = document.getElementById('audio-cover');
        coverImg.src = audioData.cover;
        coverImg.onerror = () => { coverImg.src = 'assets/icons/book.png'; }; 

        document.getElementById('audio-title').innerText = audioData.title;
        document.getElementById('audio-sub').innerText = audioData.sub;

        // 播放音频
        const audioEl = document.getElementById('main-audio');
        audioEl.src = audioData.src;
        
        // ⚠️ 错误处理
        audioEl.onerror = () => {
            console.error("Audio Load Error. Check network or file path.");
            alert("Error: Cannot play audio. Check console.");
        };

        // 尝试自动播放
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log("Audio playing started.");
            }).catch(error => {
                console.warn("Autoplay blocked by browser:", error);
            });
        }

        // 渲染底部控制按钮
        this.renderControls(gridUI);
    }

    // --- 3. 渲染控制按钮 ---
    renderControls(gridUI) {
        const controlGrid = document.getElementById('audio-control-grid');
        const overlay = document.getElementById('audio-control-overlay');
        controlGrid.innerHTML = '';

        let controls = [];

        if (this.currentAppType === 'music') {
            controls = [
                { id: 'ac-resume', label: 'RESUME', sub: 'Play Music', icon: 'play.png', type: 'send' },
                { id: 'ac-exit', label: 'EXIT', sub: 'To Library', icon: 'log-out.png', type: 'delete' },
                { id: 'ac-volup', label: 'VOL +', sub: 'Louder', icon: 'vol-up.png', type: 'group' },
                { id: 'ac-prev', label: 'PREV', sub: 'Last Song', icon: 'rewind.png', type: 'tool' },
                { id: 'ac-next', label: 'NEXT', sub: 'Next Song', icon: 'forward.png', type: 'tool' },
                { id: 'ac-voldown', label: 'VOL -', sub: 'Softer', icon: 'vol-down.png', type: 'group' }
            ];
        } else {
            controls = [
                { id: 'ac-resume', label: 'RESUME', sub: 'Play Book', icon: 'play.png', type: 'send' },
                { id: 'ac-exit', label: 'EXIT', sub: 'To Library', icon: 'log-out.png', type: 'delete' },
                { id: 'ac-volup', label: 'VOL +', sub: 'Louder', icon: 'vol-up.png', type: 'group' },
                { id: 'ac-rewind', label: '-15s', sub: 'Rewind', icon: 'rewind.png', type: 'tool' },
                { id: 'ac-forward', label: '+15s', sub: 'Skip', icon: 'forward.png', type: 'tool' },
                { id: 'ac-voldown', label: 'VOL -', sub: 'Softer', icon: 'vol-down.png', type: 'group' }
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

    // --- 4. 处理命令 ---
    handleCommand(cmdId, gridUI, onExitCallback) {
        const audioEl = document.getElementById('main-audio');
        const overlay = document.getElementById('audio-control-overlay');

        if (cmdId === 'ac-resume') {
            audioEl.play();
            if (overlay) {
                overlay.classList.remove('visible');
                setTimeout(() => overlay.classList.add('hidden'), 300);
            }
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
            if (overlay) {
                overlay.classList.remove('visible');
                overlay.classList.add('hidden');
            }
            this.renderLibrary(this.currentAppType, gridUI);
            if(onExitCallback) onExitCallback(); 
            return 'EXITED';
        }

        if (cmdId === 'ac-pause') {
            const pauseCard = document.getElementById('ac-pause');
            const labelDiv = pauseCard ? pauseCard.querySelector('.label') : null;
            const iconImg = pauseCard ? pauseCard.querySelector('.icon img') : null;

            if (audioEl.paused) {
                audioEl.play();
                if (labelDiv) labelDiv.innerText = 'PAUSE';
                if (iconImg) iconImg.src = 'assets/icons/pause.png';
            } else {
                audioEl.pause();
                if (labelDiv) labelDiv.innerText = 'PLAY';
                if (iconImg) iconImg.src = 'assets/icons/play.png';
            }
        } 
        
        else if (cmdId === 'ac-rewind') {
            audioEl.currentTime = Math.max(0, audioEl.currentTime - 15);
        } else if (cmdId === 'ac-forward') {
            audioEl.currentTime += 15;
        }

        else if (cmdId === 'ac-prev' || cmdId === 'ac-next') {
            const dataList = this.currentAppType === 'music' ? MUSIC_LIST : BOOK_LIST;
            let idx = dataList.findIndex(item => item.id === this.currentAudioId);
            
            if (cmdId === 'ac-next') {
                idx = (idx + 1) % dataList.length;
            } else {
                idx = (idx - 1 + dataList.length) % dataList.length;
            }
            this.openPlayer(dataList[idx].id, gridUI);
        }

        return 'STAY';
    }
}
