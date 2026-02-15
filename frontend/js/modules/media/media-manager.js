/* frontend/js/modules/media/media-manager.js */

import { VideoPlayer } from './video-player.js';
import { AudioPlayer } from './audio-player.js';
import { YoutubePlayer } from './youtube-logic.js';

export class MediaManager {
    constructor() {
        this.currentApp = null;
        this.videoPlayer = new VideoPlayer();
        this.audioPlayer = new AudioPlayer();
        this.youtubePlayer = new YoutubePlayer();
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
                console.log(`🎵 Routing: Rendering ${appType} library`);
                if (statusText) statusText.innerText = appType === 'music' ? 'MUSIC PLAYLIST' : 'AUDIOBOOKS';
                this.audioPlayer.renderLibrary(appType, gridUI);
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

        const libraryGrid = document.getElementById('video-library-grid');
        const playerContainer = document.getElementById('video-player-container');
        if (libraryGrid) libraryGrid.classList.add('hidden');
        if (playerContainer) playerContainer.classList.add('hidden');

        const videoEl = document.getElementById('main-video');
        if (videoEl) {
            videoEl.pause();
            videoEl.src = '';
        }

        const audioContainer = document.getElementById('audio-player-container');
        if (audioContainer) audioContainer.classList.add('hidden');

        const audioEl = document.getElementById('main-audio');
        if (audioEl) {
            audioEl.pause();
            audioEl.src = '';
        }
    }

    exit() {
        this.closeAll();
        this.currentApp = null;
        
        document.getElementById('media-view').classList.add('hidden');
        document.getElementById('view-container').classList.remove('hidden');
    }
}
