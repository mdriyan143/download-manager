import { AppError } from "../appError.js";
import { createYtDlpPlatform } from "./ytDlpPlatform.js";

const CODE = /^[\w-]{5,60}$/;
const NUMERIC_ID = /^\d{5,25}$/;

// Accepts single video and reel links (full, share and fb.watch short links)
// and rebuilds a clean canonical URL without tracking parameters.
export function normalizeFacebookUrl(url) {
  const host = url.hostname.toLowerCase().replace(/^(www|m|web|mbasic|touch)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  const watch = (id, mediaType) => ({ canonicalUrl: `https://www.facebook.com/watch/?v=${id}`, mediaType });

  if (host === "fb.watch") {
    if (CODE.test(parts[0] || "")) return { canonicalUrl: `https://fb.watch/${parts[0]}/`, mediaType: "video" };
  } else if (host === "facebook.com") {
    // /watch/?v=ID
    if (parts[0] === "watch") {
      const id = url.searchParams.get("v");
      if (NUMERIC_ID.test(id || "")) return watch(id, "video");
    }
    // /reel/ID
    if (parts[0] === "reel" && NUMERIC_ID.test(parts[1] || "")) {
      return { canonicalUrl: `https://www.facebook.com/reel/${parts[1]}`, mediaType: "reel" };
    }
    // /share/v/CODE, /share/r/CODE (v = video, r = reel)
    if (parts[0] === "share" && ["v", "r"].includes(parts[1]) && CODE.test(parts[2] || "")) {
      return { canonicalUrl: `https://www.facebook.com/share/${parts[1]}/${parts[2]}/`, mediaType: parts[1] === "r" ? "reel" : "video" };
    }
    // /videos/ID, /<page>/videos/ID, /<page>/videos/<title>/ID
    const at = parts.indexOf("videos");
    if (at !== -1) {
      const id = parts.slice(at + 1).find((p) => NUMERIC_ID.test(p));
      if (id) return watch(id, "video");
    }
    if (parts[0] === "photo" || parts.includes("photos")) {
      throw new AppError(422, "UNSUPPORTED_FORMAT", "Facebook photo posts aren't supported yet.");
    }
  }
  throw new AppError(422, "NOT_MEDIA", "This is a Facebook page, but not a link to a single video or reel.");
}

export const facebookPlatform = createYtDlpPlatform({
  id: "facebook",
  name: "Facebook",
  hosts: ["facebook.com", "fb.watch"],
  normalizeUrl: normalizeFacebookUrl,
  cleanNote: "Facebook doesn't add a watermark to the video file and this app adds none. Text or logos the creator placed inside the video stay. Only public videos that don't need a login can be downloaded.",
});
