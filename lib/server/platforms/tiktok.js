import { AppError } from "../appError.js";
import { createYtDlpPlatform } from "./ytDlpPlatform.js";

// Accepts single video links (full or short) and rebuilds a clean URL without tracking parameters.
export function normalizeTikTokUrl(url) {
  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if ((host === "vm.tiktok.com" || host === "vt.tiktok.com") && /^[A-Za-z0-9]{6,20}$/.test(parts[0] || "")) {
    return { canonicalUrl: `https://${host}/${parts[0]}/`, mediaType: "short video" };
  }
  if (host === "tiktok.com" && parts[0] === "t" && /^[A-Za-z0-9]{6,20}$/.test(parts[1] || "")) {
    return { canonicalUrl: `https://www.tiktok.com/t/${parts[1]}/`, mediaType: "short video" };
  }
  if (host === "tiktok.com" && /^@[\w.-]+$/.test(parts[0] || "")) {
    if (parts[1] === "video" && /^\d{10,25}$/.test(parts[2] || "")) {
      return { canonicalUrl: `https://www.tiktok.com/${parts[0]}/video/${parts[2]}`, mediaType: "short video" };
    }
    if (parts[1] === "photo") throw new AppError(422, "UNSUPPORTED_FORMAT", "TikTok photo posts aren't supported yet.");
  }
  throw new AppError(422, "NOT_MEDIA", "This is a TikTok page, but not a link to a single video.");
}

export const tiktokPlatform = createYtDlpPlatform({
  id: "tiktok",
  name: "TikTok",
  hosts: ["tiktok.com"],
  normalizeUrl: normalizeTikTokUrl,
  cleanNote: "This version is not marked as watermarked by TikTok, and this app adds no watermark. We can't inspect the pixels, so check the saved file. Creator-added text or logos stay.",
});
