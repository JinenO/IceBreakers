/* frontend/js/modules/media/media-manager.js */

import { VideoPlayer } from './video-player.js';

export class MediaManager {
    constructor() {
        this.currentApp = null;
        this.videoPlayer = new VideoPlayer();
    }

    open(appType, gridUI, sleepManager) {
        this.closeAll();
        this.currentApp = appType;

        document.getElementById('view-container').classList.add('hidden');
        document.getElementById('media-view').classList.remove('hidden');

        const statusText = document.getElementById('media-status-text');

        switch (appType) {
            case 'youtube':
            case 'local':
                console.log('🎬 路由：准备渲染视频库');
                if (statusText) statusText.innerText = 'LOCAL MOVIES';
                this.videoPlayer.renderLibrary(gridUI);
                break;
                
            case 'music':
            case 'audiobook':
                console.log('🎵 路由：准备渲染音频库');
                if (statusText) statusText.innerText = appType === 'music' ? 'MUSIC PLAYLIST' : 'AUDIOBOOKS';
                break;

            case 'photos':
                console.log('🖼️ 路由：准备渲染相册');
                if (statusText) statusText.innerText = 'FAMILY ALBUM';
                break;

            default:
                console.warn('未知的媒体类型:', appType);
        }
    }

    closeAll() {
        console.log('🛑 Media Manager: 执行清场...');
        
        const contentArea = document.getElementById('media-content-area');
        if (contentArea) contentArea.innerHTML = '';
    }

    exit() {
        this.closeAll();
        this.currentApp = null;
        
        document.getElementById('media-view').classList.add('hidden');
        document.getElementById('view-container').classList.remove('hidden');
    }
}
