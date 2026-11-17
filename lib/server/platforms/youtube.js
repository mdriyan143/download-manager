import { AppError } from "../appError.js";
import { fetchMediaJson, startDownloadProcess } from "../ytDlp.js";
import { getToolStatus } from "../toolStatus.js";
import { finalizeOptions } from "./ytDlpPlatform.js";

const VIDEO_ID = /^[\w-]{11}$/;

// Accepts only real video links and rebuilds a clean canonical URL from the ID.
function normalizeUrl(url) {
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id = null;
  if (host === "youtu.be") id = parts[0];
  else if (parts[0] === "watch") id = url.searchParams.get("v");
  else if (["shorts", "live", "embed"].includes(parts[0])) id = parts[1];
  if (!VIDEO_ID.test(id || "")) {
    throw new AppError(422, "NOT_MEDIA", "This is a YouTube page, but not a link to a single video.");
  }
  return { canonicalUrl: `https://www.youtube.com/watch?v=${id}`, isShort: parts[0] === "shorts" };
}

const sizeOf = (format) => format?.filesize || format?.filesize_approx || null;

function buildOptions(formats, hasFfmpeg) {
  const usable = formats.filter((f) => !String(f.protocol).includes("m3u8"));
  const withVideo = usable.filter((f) => f.vcodec && f.vcodec !== "none" && f.height);
  const audioOnly = usable.filter((f) => f.acodec && f.acodec !== "none" && f.vcodec === "none");
  const bestAudio = [...audioOnly].sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  const m4aAudio = audioOnly.filter((f) => f.ext === "m4a").sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

  const heights = [...new Set(withVideo.map((f) => f.height))].sort((a, b) => b - a);
  const options = [];
  for (const height of heights) {
    const atHeight = withVideo.filter((f) => f.height === height);
    const progressive = atHeight.find((f) => f.acodec && f.acodec !== "none" && f.ext === "mp4");
    const videoOnly = atHeight.filter((f) => f.acodec === "none").sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];
    if (hasFfmpeg && videoOnly) {
      const videoSize = sizeOf(videoOnly);
      options.push({ id: `h${height}`, kind: "video", label: `${height}p`, height, ext: "mp4", hasAudio: true,
        estimatedSize: videoSize ? videoSize + (sizeOf(bestAudio) || 0) : null });
    } else if (progressive) {
      options.push({ id: `h${height}`, kind: "video", label: `${height}p`, height, ext: "mp4", hasAudio: true, estimatedSize: sizeOf(progressive) });
    }
  }
  if (m4aAudio) {
    options.push({ id: "audio", kind: "audio", label: "Audio only", height: 0, ext: "m4a", hasAudio: true, estimatedSize: sizeOf(m4aAudio) });
  }
  // Highest resolution is the "Original": highlighted and selected by default.
  return finalizeOptions(options.map((o) => ({ watermarked: false, compatible: true, recommended: false, original: false, ...o })));
}

export const youtubePlatform = {
  id: "youtube",
  name: "YouTube",
  status: "available",
  hosts: ["youtube.com", "youtu.be"],

  async getInfo(url) {
    const { canonicalUrl, isShort } = normalizeUrl(url);
    const info = await fetchMediaJson(canonicalUrl);
    if (info.is_live) throw new AppError(422, "UNSUPPORTED_FORMAT", "Live streams can't be downloaded.");

    const { ffmpeg } = await getToolStatus();
    const options = buildOptions(info.formats || [], ffmpeg);
    if (!options.length) throw new AppError(422, "UNSUPPORTED_FORMAT", "No downloadable format is available for this video.");

    return {
      platform: { id: "youtube", name: "YouTube" },
      sourceUrl: canonicalUrl,
      title: info.title || "Untitled",
      uploader: info.uploader || info.channel || null,
      thumbnail: info.thumbnail || null,
      durationSeconds: info.duration || null,
      mediaType: isShort ? "short video" : "video",
      watermark: {
        status: "none",
        note: "YouTube doesn't burn a watermark into video files and this app adds none. Logos the creator placed inside the video, if any, stay.",
      },
      ffmpegAvailable: ffmpeg,
      options,
    };
  },

  // Builds the yt-dlp process for one option. The selector is built here, never taken from the client.
  async prepareDownload(url, optionId) {
    const { canonicalUrl } = normalizeUrl(url);
    const { ffmpeg } = await getToolStatus();

    if (optionId === "audio") {
      return { child: startDownloadProcess(canonicalUrl, "ba[ext=m4a]", false), ext: "m4a", contentType: "audio/mp4" };
    }
    const match = /^h(\d{3,4})$/.exec(optionId);
    if (!match) throw new AppError(400, "INVALID_OPTION", "Unknown quality option.");
    const h = Number(match[1]);
    const selector = ffmpeg
      ? `bv*[height=${h}][ext=mp4]+ba[ext=m4a]/bv*[height=${h}]+ba/b[height=${h}][ext=mp4]`
      : `b[height=${h}][ext=mp4]`;
    return { child: startDownloadProcess(canonicalUrl, selector, ffmpeg), ext: "mp4", contentType: "video/mp4" };
  },
};
