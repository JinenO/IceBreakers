/* frontend/js/modules/media/audio-player.js */

// ✨ 引入刚才的数据文件
import { MUSIC_LIST, BOOK_LIST } from './audio-data.js';

export class AudioPlayer {
    constructor() {
        this.currentAppType = null; // 'music' 或 'audiobook'
        this.currentAudioId = null;
    }

    // ✨ 辅助函数：控制背景(封面/标题)的显示与隐藏
    // isVisible = true: 显示封面 (听歌模式)
    // isVisible = false: 隐藏封面 (菜单模式)
    toggleBackgroundInfo(isVisible) {
        const container = document.getElementById('now-playing-container');
        if (container) {
            container.style.opacity = isVisible ? '1' : '0';
            container.style.transition = 'opacity 0.3s ease';
            // 隐藏时禁止点击，防止误触
            container.style.pointerEvents = isVisible ? 'auto' : 'none';
        }
    }

    // --- 1. 渲染列表 (Media Library 视图) ---
    renderLibrary(appType, gridUI) {
        this.currentAppType = appType;
        const libraryGrid = document.getElementById('video-library-grid'); 
        
        // 确保容器状态正确
        libraryGrid.classList.remove('hidden');
        document.getElementById('audio-player-container').classList.add('hidden');
        document.getElementById('video-player-container').classList.add('hidden');
        
        // 确保控制层隐藏
        const overlay = document.getElementById('audio-control-overlay');
        if (overlay) overlay.classList.add('hidden');

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

        // 返回按钮
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

    // --- 2. 打开播放器 (Audio Playing 视图) ---
    openPlayer(audioId, gridUI) {
        this.currentAudioId = audioId;
        
        // 合并查找，不管是歌还是书
        const allItems = [...MUSIC_LIST, ...BOOK_LIST];
        const item = allItems.find(a => a.id === audioId);

        if (!item) return;

        console.log("💿 Playing:", item.title);

        // 1. 准备界面：隐藏列表
        const libraryGrid = document.getElementById('video-library-grid');
        libraryGrid.classList.add('hidden');

        // 2. 显示 Audio 容器 (负责声音)
        document.getElementById('audio-player-container').classList.remove('hidden');

        // 3. ✨ 核心：强制隐藏控制按钮 (确保一开始没有按钮)
        const overlay = document.getElementById('audio-control-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('visible');
        }

        // 4. 播放音频
        const audioEl = document.getElementById('main-audio');
        if (audioEl) {
            audioEl.src = item.src;
            audioEl.play().catch(e => console.warn("Play error:", e));
        }

        // 5. ✨ 渲染“正在播放”界面 (封面+歌名)
        // 无论歌还是书，都执行这一步，保证界面一模一样
        this.renderNowPlayingScreen(item);
    }

    // ✨ 统一的封面渲染函数
    renderNowPlayingScreen(item) {
        const libraryGrid = document.getElementById('video-library-grid');
        libraryGrid.classList.remove('hidden'); // 复用这个区域显示大图
        
        // 自动判断默认图标：音乐用音符，书用书本
        const defaultIcon = item.type === 'music' ? 'assets/icons/music.png' : 'assets/icons/book.png';
        // 如果数据里没写type，就通过当前App类型判断
        const finalIcon = item.type ? defaultIcon : (this.currentAppType === 'music' ? 'assets/icons/music.png' : 'assets/icons/book.png');

        // 生成大图界面
        // 我们创建了一个 id="now-playing-container" 的div，方便后面 toggleBackgroundInfo 控制它
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

    // --- 3. 渲染控制按钮 (ActionController 闭眼触发时调用) ---
    renderControls(gridUI) {
        const controlGrid = document.getElementById('audio-control-grid');
        const overlay = document.getElementById('audio-control-overlay');
        controlGrid.innerHTML = '';

        // ✨ 1. 隐藏背景 (封面和歌名消失)
        this.toggleBackgroundInfo(false);

        // ✨ 2. 显示按钮层
        if (overlay) {
            overlay.classList.remove('hidden');
            void overlay.offsetWidth; // 触发重绘
            overlay.classList.add('visible');
        }

        // ✨ 3. 根据类型决定按钮功能
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
            // Audiobook 控制 (快退/快进)
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

    // --- 4. 处理命令 ---
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
            // ✨ 恢复播放时，封面和歌名显示回来
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
            
            // 退出时恢复背景显示
            this.toggleBackgroundInfo(true);
            
            this.renderLibrary(this.currentAppType, gridUI);
            if(onExitCallback) onExitCallback(); 
            return 'EXITED';
        }
        
        // 播放控制逻辑
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