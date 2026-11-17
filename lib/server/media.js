import { AppError } from "./appError.js";
import { parseHttpUrl, isPrivateHost } from "./urlSafety.js";
import { detectPlatform } from "./platforms/index.js";

// URL detection steps: valid link? safe host? known platform? integration ready?
export function resolveSupportedMedia(rawUrl) {
  const url = parseHttpUrl(rawUrl);
  if (!url || isPrivateHost(url.hostname)) {
    throw new AppError(400, "INVALID_URL", "That doesn't look like a valid public web link.");
  }
  const platform = detectPlatform(url);
  if (!platform) {
    throw new AppError(422, "UNSUPPORTED_WEBSITE", "This website isn't supported, so there is no media to download from it.");
  }
  if (platform.status !== "available") {
    throw new AppError(422, "PLATFORM_NOT_READY", `${platform.name} links are recognised, but ${platform.name} downloads aren't available yet.`);
  }
  return { url, platform };
}
