import { YOUTUBE_API_KEY } from '../config.js';

export async function searchYouTube(query) {
    console.log(`Searching YouTube for: "${query}"...`);

    const maxResults = 6;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('YouTube API error:', data.error.message);
            return [];
        }

        const formattedResults = data.items.map((item) => {
            return {
                id: `yt-${item.id.videoId}`,
                title: item.snippet.title.substring(0, 30) + '...',
                sub: item.snippet.channelTitle,
                cover: item.snippet.thumbnails.high.url
            };
        });

        console.log('YouTube data received:', formattedResults);
        return formattedResults;
    } catch (error) {
        console.error('Network request failed:', error);
        return [];
    }
}
