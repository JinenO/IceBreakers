/* frontend/js/modules/media/audio-player.js */

// 🎵 在线音乐数据 (直接读取网络 MP3)
const MUSIC_LIST = [
    { 
        id: 'aud-m1', 
        title: 'Online Song 1', 
        sub: '8:00', 
        cover: 'music-cover1.png', 
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
    },
    { 
        id: 'aud-m2', 
        title: 'Online Song 2', 
        sub: '7:05', 
        cover: 'music-cover2.png', 
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' 
    }
];

// 📚 模拟有声书数据
const BOOK_LIST = [
    { id: 'aud-b1', title: 'Harry Potter', sub: 'Chapter 1', cover: 'book-cover1.png', src: 'assets/audio/hp1.mp3' },
    { id: 'aud-b2', title: 'Sherlock Holmes', sub: 'Part 1', cover: 'book-cover2.png', src: 'assets/audio/sherlock.mp3' }
];

export class AudioPlayer {
    constructor() {
        this.currentAppType = null; // 记住当前是 'music' 还是 'audiobook'
        this.currentAudioId = null;
    }

    // --- 1. 渲染音频选片库 ---
    renderLibrary(appType, gridUI) {
        this.currentAppType = appType;
        const libraryGrid = document.getElementById('video-library-grid'); // 我们共用视频库的网格容器！
        libraryGrid.classList.remove('hidden');
        document.getElementById('audio-player-container').classList.add('hidden');
        libraryGrid.innerHTML = '';

        // 根据点进来的是音乐还是书，加载不同的数据
        const dataList = appType === 'music' ? MUSIC_LIST : BOOK_LIST;
        const iconSymbol = appType === 'music' ? '🎵' : '📚'; // 这里你以后也可以换成你自己的 .png

        dataList.forEach(item => {
            const card = document.createElement('article');
            card.className = 'card'; 
            card.id = item.id;
            card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon" style="font-size: 2.5rem; margin-bottom: 10px;">${iconSymbol}</div>
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
            <div class="icon"><img src="assets/icons/exit.png" style="width: 50px; height: 50px; object-fit: contain;"></div>
            <div class="label">BACK</div>
            <div class="sub-label">Media Menu</div>
            <div class="confirm-bar"></div>
        `;
        libraryGrid.appendChild(backCard);

        gridUI.refreshCards('#video-library-grid .card');
    }

    // --- 2. 打开播放器界面 ---
    openPlayer(audioId, gridUI) {
        this.currentAudioId = audioId;
        const dataList = this.currentAppType === 'music' ? MUSIC_LIST : BOOK_LIST;
        const audioData = dataList.find(a => a.id === audioId);
        
        if (!audioData) return;

        // 切换界面
        document.getElementById('video-library-grid').classList.add('hidden');
        document.getElementById('audio-player-container').classList.remove('hidden');

        // 更新封面和文字
        document.getElementById('audio-cover').src = `assets/icons/${audioData.cover}`; // 记得放两张封面图
        document.getElementById('audio-title').innerText = audioData.title;
        document.getElementById('audio-sub').innerText = audioData.sub;

        // 加载音乐并播放
        const audioEl = document.getElementById('main-audio');
        audioEl.src = audioData.src;
        audioEl.play();

        this.renderControls(gridUI);
        console.log(`🎵 Audio playing: ${audioData.title}`);
    }

    // --- 3. 渲染底部的 4 个控制按钮 ---
    renderControls(gridUI) {
        const controlGrid = document.getElementById('audio-control-grid');
        controlGrid.innerHTML = '';

        let controls = [];

        // 🌟 智能分流：音乐和书的控制按钮不同！
        if (this.currentAppType === 'music') {
            controls = [
                { id: 'ac-prev', label: 'PREV', sub: 'Last Song', icon: 'rewind.png', type: 'tool' }, // 你可以用之前快退的图标代替
                { id: 'ac-pause', label: 'PAUSE', sub: 'Stop', icon: 'pause.png', type: 'send' }, // 记得加一张 pause.png
                { id: 'ac-next', label: 'NEXT', sub: 'Next Song', icon: 'forward.png', type: 'tool' },
                { id: 'ac-exit', label: 'EXIT', sub: 'To Library', icon: 'exit.png', type: 'delete' }
            ];
        } else {
            // 有声书不需要上一首下一首，需要快进快退
            controls = [
                { id: 'ac-rewind', label: '-15 SEC', sub: 'Rewind', icon: 'rewind.png', type: 'tool' },
                { id: 'ac-pause', label: 'PAUSE', sub: 'Stop', icon: 'pause.png', type: 'send' },
                { id: 'ac-forward', label: '+15 SEC', sub: 'Skip', icon: 'forward.png', type: 'tool' },
                { id: 'ac-exit', label: 'EXIT', sub: 'To Library', icon: 'exit.png', type: 'delete' }
            ];
        }

        controls.forEach(ctrl => {
            const card = document.createElement('article');
            // 为了让横向排列的按钮铺满，我们在 CSS 里用 flex: 1
            card.className = `card ${ctrl.type || ''}`; 
            card.id = ctrl.id;
            card.style.flex = "1"; // 让 4 个按钮平分宽度
            
            card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon"><img src="assets/icons/${ctrl.icon}" style="width: 50px; height: 50px; object-fit: contain;"></div>
                <div class="label">${ctrl.label}</div>
                <div class="sub-label">${ctrl.sub}</div>
                <div class="confirm-bar"></div>
            `;
            controlGrid.appendChild(card);
        });

        // 告诉扫描器：现在开始扫这 4 个横向按钮！
        gridUI.refreshCards('#audio-control-grid .card');
    }

    // --- 4. 处理音频播放器上的控制按钮 ---
    handleCommand(cmdId, gridUI, onExitCallback) {
        const audioEl = document.getElementById('main-audio');

        // 1. 退出播放器，回到选片库
        if (cmdId === 'ac-exit') {
            audioEl.pause();
            audioEl.src = '';
            this.renderLibrary(this.currentAppType, gridUI); // 重新渲染库
            if(onExitCallback) onExitCallback();
            return 'EXITED';
        }

        // 2. 播放 / 暂停 的切换
        if (cmdId === 'ac-pause') {
            const pauseCard = document.getElementById('ac-pause');
            
            if (audioEl.paused) {
                audioEl.play();
                // 变成暂停图标
                pauseCard.innerHTML = pauseCard.innerHTML.replace('play.png', 'pause.png').replace('PLAY', 'PAUSE');
            } else {
                audioEl.pause();
                // 变成播放图标
                pauseCard.innerHTML = pauseCard.innerHTML.replace('pause.png', 'play.png').replace('PAUSE', 'PLAY');
            }
        } 
        
        // 3. 有声书专用：快退 / 快进 15 秒
        else if (cmdId === 'ac-rewind') {
            audioEl.currentTime = Math.max(0, audioEl.currentTime - 15);
        } else if (cmdId === 'ac-forward') {
            audioEl.currentTime += 15;
        } 
        
        // 4. 音乐专用：上一首 (PREV) / 下一首 (NEXT) 切换逻辑
        else if (cmdId === 'ac-prev' || cmdId === 'ac-next') {
            // 1. 拿到当前的播放列表 (MUSIC_LIST)
            const dataList = this.currentAppType === 'music' ? MUSIC_LIST : BOOK_LIST;
            
            // 2. 找出当前正在播放的歌，在列表里排第几个 (Index)
            let currentIndex = dataList.findIndex(item => item.id === this.currentAudioId);
            
            // 3. 计算下一首/上一首的位置
            if (cmdId === 'ac-next') {
                // 如果当前是最后一首，+1 就会回到第一首 (循环播放)
                currentIndex = (currentIndex + 1) % dataList.length;
            } else if (cmdId === 'ac-prev') {
                // 如果当前是第一首，-1 就会跳到最后一首
                currentIndex = (currentIndex - 1 + dataList.length) % dataList.length;
            }
            
            // 4. 拿到新歌的 ID
            const nextAudioId = dataList[currentIndex].id;
            
            // 5. 让播放器重新打开这首新歌！(它会自动换封面、换标题、重新播放)
            this.openPlayer(nextAudioId, gridUI);
        }

        return 'STAY'; // 告诉 main.js，执行完命令后不要退出界面
    }
}
