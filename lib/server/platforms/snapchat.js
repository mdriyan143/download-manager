import { AppError } from "../appError.js";
import { createYtDlpPlatform } from "./ytDlpPlatform.js";

const ID = /^[\w-]{10,200}$/;
const SHORT = /^[A-Za-z0-9_-]{4,40}$/;

// Accepts public Spotlight links and Snapchat share links (snapchat.com/t/CODE).
// Spotlight links are rebuilt without tracking parameters; share links are passed
// through unchanged because yt-dlp follows the redirect to the real video.
export function normalizeSnapchatUrl(url) {
  const host = url.hostname.toLowerCase().replace(/^(www|story)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "snapchat.com") {
    // /spotlight/ID, also /<lang>/spotlight/ID (e.g. /en-US/spotlight/ID)
    const at = parts.indexOf("spotlight");
    if (at !== -1 && at <= 1 && ID.test(parts[at + 1] || "")) {
      return { canonicalUrl: `https://www.snapchat.com/spotlight/${parts[at + 1]}`, mediaType: "spotlight" };
    }
    // /t/CODE (share link)
    if (parts[0] === "t" && SHORT.test(parts[1] || "")) {
      return { canonicalUrl: `https://www.snapchat.com/t/${parts[1]}`, mediaType: "spotlight" };
    }
  }
  throw new AppError(422, "NOT_MEDIA", "This is a Snapchat page, but not a link to a public Spotlight video.");
}

export const snapchatPlatform = createYtDlpPlatform({
  id: "snapchat",
  name: "Snapchat",
  hosts: ["snapchat.com"],
  directHosts: ["sc-cdn.net"],
  normalizeUrl: normalizeSnapchatUrl,
  cleanNote: "This version is not marked as watermarked by Snapchat, and this app adds no watermark. We can't inspect the pixels, so check the saved file. Creator-added text or logos stay. Only public Spotlight videos can be downloaded.",
});