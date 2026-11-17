import { handle, fail } from "@/lib/server/http";
import { AppError } from "@/lib/server/appError";
import { limitApi, limitDownload } from "@/lib/server/rateLimit";
import { resolveSupportedMedia } from "@/lib/server/media";
import { sanitizeFilename, contentDisposition } from "@/lib/server/filename";
import { translateYtDlpError } from "@/lib/server/ytDlp";
import { env } from "@/lib/server/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // raise/lower to match your host's limits

// Shared across requests in one server process (kept on globalThis so dev reloads don't reset it).
const g = globalThis;
g.__activeDownloads ??= 0;

export const GET = handle(async (request) => {
  limitApi(request);
  limitDownload(request);

  const params = request.nextUrl.searchParams;
  const { url, platform } = resolveSupportedMedia(params.get("url"));

  if (g.__activeDownloads >= env.maxConcurrentDownloads) {
    throw new AppError(429, "SERVER_BUSY", "The server is handling the maximum number of downloads. Try again shortly.");
  }

  g.__activeDownloads++;
  let released = false;
  const release = () => { if (!released) { released = true; g.__activeDownloads--; } };

  let job;
  try {
    job = await platform.prepareDownload(url, String(params.get("option") || ""));
  } catch (err) {
    release();
    throw err;
  }

  const { child, ext, contentType } = job;
  const filename = `${sanitizeFilename(params.get("title"))}.${ext}`;
  const timer = setTimeout(() => child.kill("SIGKILL"), env.downloadTimeoutMs);
  const cleanup = () => { clearTimeout(timer); release(); };
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-2000); });

  // Wait for the first bytes so a failure can still be reported as clean JSON.
  const first = await new Promise((resolve) => {
    child.stdout.once("data", (chunk) => { child.stdout.pause(); resolve({ chunk }); });
    child.once("error", (err) => resolve({ error: err }));
    child.once("close", (code) => resolve({ code }));
  });

  if (!first.chunk) {
    cleanup();
    const e = translateYtDlpError(first.error ?? { stderr, code: first.code });
    return fail(e.status, e.code, e.message);
  }

  // Stream yt-dlp stdout straight to the browser. Nothing is written to disk.
  let done = false;
  const stop = () => { if (child.exitCode === null && !child.killed) child.kill("SIGKILL"); };

  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(first.chunk));
      child.stdout.on("data", (c) => {
        if (done) return;
        controller.enqueue(new Uint8Array(c));
        if (controller.desiredSize !== null && controller.desiredSize <= 0) child.stdout.pause();
      });
      // "close" fires after stdout has ended, so the exit code is known here.
      child.once("close", (code) => {
        if (done) return;
        done = true;
        cleanup();
        // Non-zero exit after streaming began = incomplete file: error the stream so the browser fails the download.
        try { code === 0 ? controller.close() : controller.error(new Error("download incomplete")); } catch {}
      });
      child.once("error", (e) => { if (!done) { done = true; cleanup(); try { controller.error(e); } catch {} } });
      child.stdout.resume();
    },
    pull() { child.stdout.resume(); },
    // User cancelled in the browser: stop yt-dlp so nothing keeps running.
    cancel() { done = true; stop(); cleanup(); },
  });

  request.signal.addEventListener("abort", stop);

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition(filename),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
