import { searchYouTube } from '../../api/youtube-api.js';

export class YoutubePlayer {
    constructor() {
        this.currentResults = [];
    }

    async searchAndRender(query, gridUI) {
        const libraryGrid = document.getElementById('video-library-grid');

        if (!libraryGrid) return;

        document.getElementById('keyboard-view').classList.add('hidden');
        document.getElementById('media-view').classList.remove('hidden');
        document.getElementById('audio-player-container').classList.add('hidden');
        document.getElementById('video-player-container').classList.add('hidden');

        libraryGrid.classList.remove('hidden');
        libraryGrid.innerHTML = `<h3 style="color: #4fd1c5; grid-column: 1 / -1; text-align: center;">🔍 Searching for "${query}"...</h3>`;

        const results = await searchYouTube(query);
        this.currentResults = results.slice(0, 5);

        libraryGrid.innerHTML = '';

        if (this.currentResults.length === 0) {
            libraryGrid.innerHTML = '<h3 style="color: #f56565; grid-column: 1 / -1; text-align: center;">No results found.</h3>';
        } else {
            this.currentResults.forEach((video) => {
                const card = document.createElement('article');
                card.className = 'card media-card';
                card.id = video.id;
                card.innerHTML = `
                    <div class="scan-bar"></div>
                    <div class="icon" style="margin-bottom: 5px;">
                        <img src="${video.cover}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="label" style="font-size: 1.1rem;">${video.title}</div>
                    <div class="sub-label" style="font-size: 0.8rem;">${video.sub}</div>
                    <div class="confirm-bar"></div>
                `;
                libraryGrid.appendChild(card);
            });
        }

        const backCard = document.createElement('article');
        backCard.className = 'card delete';
        backCard.id = 'yt-back';
        backCard.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon"><img src="assets/icons/exit.png" style="width: 50px; height: 50px; object-fit: contain;"></div>
            <div class="label">BACK</div>
            <div class="sub-label">To Keyboard</div>
            <div class="confirm-bar"></div>
        `;
        libraryGrid.appendChild(backCard);

        gridUI.refreshCards('#video-library-grid .card');
    }
}
