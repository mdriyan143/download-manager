import { AppError } from "../appError.js";
import { fetchMediaJson, startDownloadProcess, startAudioExtractProcess } from "../ytDlp.js";
import { getToolStatus } from "../toolStatus.js";

// "p-<id>" = one file that already has audio, "v-<id>" = video-only (merged with audio by FFmpeg),
// "a-<id>" = audio-only stream, "x-<id>" = audio extracted from a file that has audio inside.
const OPTION_ID = /^([pvax])-([A-Za-z0-9][\w.-]{0,59})$/;
const FORMAT_ID = /^[A-Za-z0-9][\w.-]{0,59}$/;
const sizeOf = (format) => format?.filesize || format?.filesize_approx || null;

// We only call a version watermarked when the source itself says so. We never inspect pixels.
const isMarkedWatermarked = (f) => /watermark/i.test(`${f.format_note || ""} ${f.format_id || ""} ${f.format || ""}`);

// Codecs that play in every common player. VP9/AV1/HEVC inside MP4 often show no picture
// in default players (for example Windows Movies & TV), so we flag them instead of hiding them.
// An unknown codec is treated as compatible (Instagram's plain "original" files report none).
const codecName = (f) => {
  const c = String(f.vcodec || "").toLowerCase();
  if (!c || c === "unknown") return null;
  if (/^(avc|h264)/.test(c)) return "H.264";
  if (/^(vp9|vp09)/.test(c)) return "VP9";
  if (/^av0?1/.test(c)) return "AV1";
  if (/^(hev|hvc|h265)/.test(c)) return "HEVC";
  return c.split(".")[0].toUpperCase();
};

// Quality is the short side of the frame, so a 1080x1920 reel is "1080p", not "1920p".
const shortSide = (f) => (f.width && f.height ? Math.min(f.width, f.height) : f.height || 0);

// Sorts video before audio (clean, then playable-everywhere, then recommended, then highest resolution)
// and marks one video as the "Original" so it is highlighted and selected by default.
// A plain file with unreported size is already marked; otherwise the best clean, playable one is.
export function finalizeOptions(options) {
  const sorted = options.sort((a, b) =>
    Number(a.kind === "audio") - Number(b.kind === "audio") ||
    Number(a.watermarked) - Number(b.watermarked) ||
    Number(b.compatible) - Number(a.compatible) ||
    Number(b.recommended) - Number(a.recommended) ||
    b.height - a.height
  );
  const videos = sorted.filter((o) => o.kind === "video");
  if (videos.length && !videos.some((o) => o.recommended)) {
    videos[0].original = true;
    videos[0].recommended = true;
  }
  return sorted;
}

export function buildOptions(formats, hasFfmpeg) {
  const usable = formats.filter((f) =>
    f.vcodec !== "none" && f.ext === "mp4" && !String(f.protocol).includes("m3u8") && FORMAT_ID.test(String(f.format_id))
  );
  const options = [];
  const seen = new Set();

  for (const f of usable) {
    const hasAudio = !!f.acodec && f.acodec !== "none";
    if (!hasAudio && !hasFfmpeg) continue;
    const watermarked = isMarkedWatermarked(f);
    const size = shortSide(f);
    const codec = codecName(f);
    const compatible = codec === null || codec === "H.264";
    const key = `${size}-${watermarked}-${codec}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const quality = size ? `${size}p` : "Original";
    options.push({
      id: `${hasAudio ? "p" : "v"}-${f.format_id}`, kind: "video", height: size, ext: "mp4", hasAudio: true,
      label: watermarked ? `${quality} (watermarked)` : quality, watermarked, estimatedSize: sizeOf(f),
      codec, compatible,
      // "Original" = the plain file the platform serves as-is (size/codec unreported). Safest to play, so it is recommended.
      original: !size && compatible && !watermarked,
      recommended: !size && compatible && !watermarked,
    });
  }

  // One audio option. Prefer a separate audio stream (best bitrate).
  const audio = formats
    .filter((f) => f.vcodec === "none" && f.acodec && f.acodec !== "none" && f.ext === "m4a" &&
      !String(f.protocol).includes("m3u8") && FORMAT_ID.test(String(f.format_id)))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  const audioBase = { kind: "audio", height: 0, ext: "m4a", hasAudio: true, label: "Audio only", watermarked: false, codec: null, compatible: true, original: false, recommended: false };
  if (audio) {
    options.push({ ...audioBase, id: `a-${audio.format_id}`, estimatedSize: sizeOf(audio) });
  } else if (hasFfmpeg) {
    // No separate audio stream (typical for TikTok/Instagram): extract it from the smallest file that has audio.
    const source = usable
      .filter((f) => !!f.acodec && f.acodec !== "none")
      .sort((a, b) => (sizeOf(a) || Infinity) - (sizeOf(b) || Infinity) || shortSide(a) - shortSide(b))[0];
    if (source) options.push({ ...audioBase, id: `x-${source.format_id}`, estimatedSize: null, extracted: true });
  }
  return finalizeOptions(options);
}

// Builds a platform adapter on top of yt-dlp. Each platform only supplies its own URL rules and note.
export function createYtDlpPlatform({ id, name, hosts, normalizeUrl, cleanNote }) {
  return {
    id, name, hosts, status: "available",

    async getInfo(url) {
      const { canonicalUrl, mediaType } = normalizeUrl(url);
      const info = await fetchMediaJson(canonicalUrl);
      const { ffmpeg } = await getToolStatus();
      const options = buildOptions(info.formats?.length ? info.formats : [info], ffmpeg);
      if (!options.some((o) => o.kind === "video")) {
        throw new AppError(422, "UNSUPPORTED_FORMAT", "No downloadable video was found. This may be a photo post, or a video that needs a login.");
      }

      const hasClean = options.some((o) => o.kind === "video" && !o.watermarked);
      return {
        platform: { id, name },
        sourceUrl: canonicalUrl,
        title: info.title || info.description?.slice(0, 100) || "Untitled",
        uploader: info.uploader || info.channel || null,
        thumbnail: info.thumbnail || null,
        durationSeconds: info.duration || null,
        mediaType,
        watermark: {
          status: hasClean ? "unmarked" : "watermarked",
          note: hasClean ? cleanNote : `Only a version marked as watermarked by ${name} is available for this video.`,
        },
        ffmpegAvailable: ffmpeg,
        options,
      };
    },

    async prepareDownload(url, optionId) {
      const { canonicalUrl } = normalizeUrl(url);
      const match = OPTION_ID.exec(optionId);
      if (!match) throw new AppError(400, "INVALID_OPTION", "Unknown quality option.");
      const [, kind, formatId] = match;

      const { ffmpeg } = await getToolStatus();
      if (kind === "v" && !ffmpeg) throw new AppError(400, "INVALID_OPTION", "This quality needs FFmpeg on the server.");

      if (kind === "x") {
        if (!ffmpeg) throw new AppError(400, "INVALID_OPTION", "Audio extraction needs FFmpeg on the server.");
        return { child: startAudioExtractProcess(canonicalUrl, formatId), ext: "m4a", contentType: "audio/mp4" };
      }
      if (kind === "a") {
        return { child: startDownloadProcess(canonicalUrl, formatId, false), ext: "m4a", contentType: "audio/mp4" };
      }

      const selector = kind === "v" ? `${formatId}+ba` : formatId;
      return { child: startDownloadProcess(canonicalUrl, selector, kind === "v"), ext: "mp4", contentType: "video/mp4" };
    },
  };
}
