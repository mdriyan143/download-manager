import { ok, handle } from "@/lib/server/http";
import { limitApi } from "@/lib/server/rateLimit";
import { listPlatforms } from "@/lib/server/platforms/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  limitApi(request);
  return ok(listPlatforms());
});
