// Read lazily-friendly: Next.js loads .env.local for us, no dotenv needed.
export const env = {
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/social-media-downloader",
  ytDlpPath: process.env.YT_DLP_PATH || "yt-dlp",
  ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
  ytDlpProxy: process.env.YT_DLP_PROXY || "",
  ytDlpCookiesFile: process.env.YT_DLP_COOKIES_FILE || "",
  directDownload: process.env.DIRECT_DOWNLOAD !== "0", // set DIRECT_DOWNLOAD=0 to turn the fast path off
  maxConcurrentDownloads: Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 3,
  infoTimeoutMs: 90_000,
  downloadTimeoutMs: 60 * 60 * 1000,
};