import { AppError } from "../appError.js";
import { createYtDlpPlatform } from "./ytDlpPlatform.js";

// Accepts reel, post and IGTV links and rebuilds a clean canonical URL.
export function normalizeInstagramUrl(url) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const match = host === "instagram.com" && /^\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]{5,20})\/?/.exec(url.pathname);
  if (!match) throw new AppError(422, "NOT_MEDIA", "This is an Instagram page, but not a link to a single reel or post.");

  const isReel = match[1] === "reel" || match[1] === "reels";
  return {
    canonicalUrl: `https://www.instagram.com/${isReel ? "reel" : "p"}/${match[2]}/`,
    mediaType: isReel ? "reel" : "post video",
  };
}

export const instagramPlatform = createYtDlpPlatform({
  id: "instagram",
  name: "Instagram",
  hosts: ["instagram.com"],
  directHosts: ["cdninstagram.com", "fbcdn.net"],
  normalizeUrl: normalizeInstagramUrl,
  cleanNote: "Instagram doesn't add a watermark to the video file and this app adds none. Text, stickers or logos the creator placed inside the video stay. Only public posts that don't need a login can be downloaded.",
});