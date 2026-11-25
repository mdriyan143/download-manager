import { env } from "./env.js";
import { isPrivateHost } from "./urlSafety.js";

// Only these request headers from yt-dlp are forwarded to the media server.
const SAFE_HEADERS = new Set(["user-agent", "accept", "accept-language", "referer"]);

// Decides whether a format can be fetched straight from the platform's CDN (no second yt-dlp run).
// Only plain https files on an allow-listed CDN host qualify. Anything else returns null (use yt-dlp).
export function pickDirect(format, allowedHosts) {
  if (!env.directDownload || !format?.url || !allowedHosts?.length) return null;
  if (!["https", "http"].includes(String(format.protocol))) return null;
  if (format.fragments || format.manifest_url || format.cookies) return null;

  let u;
  try { u = new URL(format.url); } catch { return null; }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== "https:" || u.username || u.password || isPrivateHost(host)) return null;
  if (!allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))) return null;

  const headers = {};
  for (const [k, v] of Object.entries(format.http_headers || {})) {
    if (SAFE_HEADERS.has(k.toLowerCase()) && typeof v === "string") headers[k] = v;
  }
  return { url: u.href, headers };
}

// Opens the file and returns { body, length } to stream to the browser, or null if anything looks wrong
// (the caller then falls back to yt-dlp). Redirects are never followed, so the CDN can't bounce us elsewhere.
// `cleanup` runs exactly once-ish (it must be safe to call twice) when the stream ends, fails or is cancelled.
export async function openDirectStream(direct, request, cleanup) {
  const ac = new AbortController();
  const onAbort = () => ac.abort();
  request.signal.addEventListener("abort", onAbort);
  let timer = setTimeout(() => ac.abort(), 20_000); // time allowed to get the first response headers
  const drop = () => { clearTimeout(timer); request.signal.removeEventListener("abort", onAbort); };

  let upstream;
  try {
    upstream = await fetch(direct.url, { headers: direct.headers, redirect: "manual", signal: ac.signal });
  } catch {
    drop();
    return null;
  }
  clearTimeout(timer);

  const type = upstream.headers.get("content-type") || "";
  if (upstream.status !== 200 || !upstream.body || !/^(video\/|audio\/|application\/octet-stream|binary\/octet-stream)/i.test(type)) {
    ac.abort();
    drop();
    return null;
  }

  timer = setTimeout(() => ac.abort(), env.downloadTimeoutMs);
  const reader = upstream.body.getReader();
  const finish = () => { drop(); cleanup(); };

  const body = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) { controller.close(); finish(); } else controller.enqueue(value);
      } catch (e) {
        controller.error(e);
        finish();
      }
    },
    cancel() {
      ac.abort();
      reader.cancel().catch(() => {});
      finish();
    },
  });

  const len = upstream.headers.get("content-encoding") ? "" : upstream.headers.get("content-length") || "";
  return { body, length: /^\d+$/.test(len) ? len : null };
}