/* frontend/js/config.example.js */
// 🔑 配置文件模板 - 将此文件复制为 config.js 并填入你的真实 API 密钥

export const AppConfig = {
    SCAN_SPEED: 2000,
    BLINK_THRESHOLD: 0.012,
    REQUIRED_BLINK_TIME: 800,
    SOUND_ON: true
};

// YouTube API 密钥 - 从 https://console.cloud.google.com 获取
// 1. 创建新项目
// 2. 启用 YouTube Data API v3
// 3. 创建 API 密钥（Web 浏览器应用类型）
// 4. 复制密钥到下面
export const YOUTUBE_API_KEY = "AIzaSy_你的真实密钥写在这里_不要提交到GitHub";
