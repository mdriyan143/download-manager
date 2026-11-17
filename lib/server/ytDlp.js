import { execFile, spawn } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { env } from "./env.js";
import { AppError } from "./appError.js";

const run = promisify(execFile);

// Cookies are copied to a writable temp file because yt-dlp rewrites its
// cookie jar and Render secret files are read-only.
let cookiePath;
function cookieArgs() {
  if (cookiePath === undefined) {
    cookiePath = null;
    if (env.ytDlpCookiesFile && existsSync(env.ytDlpCookiesFile)) {
      const dest = join(tmpdir(), "yt-dlp-cookies.txt");
      copyFileSync(env.ytDlpCookiesFile, dest);
      cookiePath = dest;
    }
  }
  return cookiePath ? ["--cookies", cookiePath] : [];
}

// yt-dlp needs a JS runtime for YouTube; Node is always present here.
const baseArgs = [
  "--ignore-config", "--no-playlist", "--no-warnings",
  "--js-runtimes", "node", "--remote-components", "ejs:github",
  ...(env.ytDlpProxy ? ["--proxy", env.ytDlpProxy] : []),
];
const withCookies = () => [...baseArgs, ...cookieArgs()];

export function translateYtDlpError(err) {
  if (err.code === "ENOENT") return new AppError(503, "TOOL_MISSING", "The media tool (yt-dlp) is not installed on the server.");
  if (err.killed) return new AppError(504, "TIMEOUT", "The platform took too long to respond. Please try again.");
  const text = String(err.stderr || err.message || "");
  if (/drm/i.test(text)) return new AppError(403, "RESTRICTED", "This media is DRM protected and cannot be downloaded.");
  if (/not a bot|http error 429|too many requests/i.test(text)) return new AppError(429, "PLATFORM_BLOCKED", "The platform is temporarily blocking requests from this server. Try again later.");
  if (/private video|members-only|confirm your age|login required|sign in|log in|rate-limit reached/i.test(text)) return new AppError(403, "RESTRICTED", "This media needs a login (private, age-restricted or members-only), so it can't be downloaded.");
  if (/unavailable|removed|does not exist|copyright|not available/i.test(text)) return new AppError(404, "UNAVAILABLE", "This media is unavailable or has been removed.");
  console.error("yt-dlp error:", text.slice(0, 500));
  return new AppError(502, "FETCH_FAILED", "Couldn't read this media right now.");
}

export async function fetchMediaJson(url) {
  try {
    const { stdout } = await run(
      env.ytDlpPath,
      [...withCookies(), "--dump-single-json", "--skip-download", "--socket-timeout", "15", "--", url],
      { timeout: env.infoTimeoutMs, maxBuffer: 30 * 1024 * 1024 }
    );
    return JSON.parse(stdout);
  } catch (err) {
    throw err instanceof SyntaxError ? new AppError(502, "FETCH_FAILED", "Couldn't read this media right now.") : translateYtDlpError(err);
  }
}

// Starts yt-dlp writing the media to stdout so we can stream it, never to disk.
export function startDownloadProcess(url, formatSelector, mergeToMp4) {
  const args = [...withCookies(), "--quiet", "-f", formatSelector, "-S", "ext", "--socket-timeout", "15"];
  if (mergeToMp4) args.push("--merge-output-format", "mp4");
  if (env.ffmpegPath !== "ffmpeg") args.push("--ffmpeg-location", env.ffmpegPath);
  args.push("-o", "-", "--", url);
  return spawn(env.ytDlpPath, args, { stdio: ["ignore", "pipe", "pipe"] });
}

// For platforms that only serve one file with audio inside: pull the audio track out with FFmpeg.
// yt-dlp streams the muxed file into FFmpeg, which copies the audio into a fragmented M4A. Nothing is written to disk.
// The returned process behaves like the one from startDownloadProcess (stdout, stderr, kill, close).
export function startAudioExtractProcess(url, formatId) {
  const source = startDownloadProcess(url, formatId, false);
  const ff = spawn(
    env.ffmpegPath,
    ["-hide_banner", "-loglevel", "error", "-i", "pipe:0", "-vn", "-c:a", "copy", "-movflags", "frag_keyframe+empty_moov", "-f", "mp4", "pipe:1"],
    { stdio: ["pipe", "pipe", "pipe"] }
  );
  source.stdout.pipe(ff.stdin);
  ff.stdin.on("error", () => {});
  source.stderr.on("data", (d) => ff.stderr.emit("data", d));
  source.once("error", (e) => ff.emit("error", e));
  source.once("close", (code) => { if (code !== 0) ff.kill("SIGKILL"); });
  const kill = ff.kill.bind(ff);
  ff.kill = (signal) => { source.kill(signal); return kill(signal); };
  return ff;
}