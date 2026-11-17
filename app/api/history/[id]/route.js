import mongoose from "mongoose";
import { ok, fail, handle } from "@/lib/server/http";
import { limitApi } from "@/lib/server/rateLimit";
import { connectDatabase } from "@/lib/server/db";
import { getVisitor } from "@/lib/server/visitor";
import Download from "@/lib/server/models/Download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = handle(async (request, { params }) => {
  limitApi(request);
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return fail(400, "INVALID_ID", "Invalid entry id.");
  if (!(await connectDatabase())) return ok({ enabled: false });

  // Scoped to this visitor, so nobody can delete someone else's entry.
  await Download.deleteOne({ _id: id, visitorId: getVisitor(request).id });
  return ok({ enabled: true });
});
