import { ok, handle } from "@/lib/server/http";
import { limitApi } from "@/lib/server/rateLimit";
import { getToolStatus } from "@/lib/server/toolStatus";
import { connectDatabase, isDatabaseConnected } from "@/lib/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request) => {
  limitApi(request);
  const [tools] = await Promise.all([getToolStatus(), connectDatabase()]);
  return ok({ status: "ok", database: isDatabaseConnected() ? "connected" : "disconnected", tools });
});
