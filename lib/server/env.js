// Read lazily-friendly: Next.js loads .env.local for us, no dotenv needed.
export const env = {
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social-media-downloader",
  ytDlpPath: process.env.YT_DLP_PATH || "yt-dlp",
  ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
  maxConcurrentDownloads: Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 3,
  infoTimeoutMs: 30_000,
  downloadTimeoutMs: 60 * 60 * 1000,
};
