import { ok, handle, fail } from "@/lib/server/http";
import { limitApi, limitInfo } from "@/lib/server/rateLimit";
import { resolveSupportedMedia } from "@/lib/server/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const POST = handle(async (request) => {
  limitApi(request);
  limitInfo(request);

  const text = await request.text();
  if (text.length > 10 * 1024) return fail(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400, "INVALID_JSON", "Request body is not valid JSON.");
  }

  const { url, platform } = resolveSupportedMedia(body?.url);
  const media = await platform.getInfo(url);
  return ok(media);
});
