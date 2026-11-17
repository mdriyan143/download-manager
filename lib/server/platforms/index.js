import { youtubePlatform } from "./youtube.js";
import { tiktokPlatform } from "./tiktok.js";
import { instagramPlatform } from "./instagram.js";
import { facebookPlatform } from "./facebook.js";
import { plannedPlatform } from "./plannedPlatform.js";

const platforms = [
  youtubePlatform,
  tiktokPlatform,
  instagramPlatform,
  facebookPlatform,
  plannedPlatform("x", "X (Twitter)", ["x.com", "twitter.com"]),
  plannedPlatform("pinterest", "Pinterest", ["pinterest.com", "pin.it"]),
];

export const listPlatforms = () => platforms.map(({ id, name, status }) => ({ id, name, status }));

export function detectPlatform(url) {
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return platforms.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`))) || null;
}
