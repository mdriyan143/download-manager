import { parseHttpUrl } from "./urlSafety.js";
import { AppError } from "./appError.js";

export const MAX_ENTRIES = 200;

export const toEntry = (d) => ({
  id: String(d._id),
  date: new Date(d.createdAt).toISOString(),
  status: d.status,
  platform: d.platform,
  mediaUrl: d.mediaUrl,
  title: d.title,
  filename: d.filename,
  thumbnail: d.thumbnail,
  format: d.format,
  quality: d.quality,
  watermarkStatus: d.watermarkStatus,
});

const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : undefined);

// Validates what the browser sends; never trusts it.
export function cleanEntry(body) {
  const mediaUrl = parseHttpUrl(body?.mediaUrl);
  const platform = str(body?.platform, 60);
  if (!mediaUrl || !platform) throw new AppError(400, "INVALID_ENTRY", "Invalid history entry.");

  const thumb = parseHttpUrl(body?.thumbnail);
  return {
    platform,
    mediaUrl: mediaUrl.href,
    title: str(body?.title, 300) || "Untitled",
    filename: str(body?.filename, 300) || "download",
    thumbnail: thumb ? thumb.href : null,
    format: str(body?.format, 20),
    quality: str(body?.quality, 40),
    watermarkStatus: ["none", "unmarked", "watermarked"].includes(body?.watermarkStatus) ? body.watermarkStatus : "unknown",
  };
}
