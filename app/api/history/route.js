import { ok, fail, handle } from "@/lib/server/http";
import { limitApi } from "@/lib/server/rateLimit";
import { connectDatabase } from "@/lib/server/db";
import { getVisitor, attachVisitor } from "@/lib/server/visitor";
import { cleanEntry, toEntry, MAX_ENTRIES } from "@/lib/server/history";
import Download from "@/lib/server/models/Download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// enabled:false tells the browser the database is off, so it keeps history in localStorage instead.
const disabled = () => ok({ enabled: false, entries: [] });

export const GET = handle(async (request) => {
  limitApi(request);
  if (!(await connectDatabase())) return disabled();

  const visitor = getVisitor(request);
  const docs = await Download.find({ visitorId: visitor.id }).sort({ createdAt: -1 }).limit(MAX_ENTRIES).lean();
  return attachVisitor(ok({ enabled: true, entries: docs.map(toEntry) }), visitor);
});

export const POST = handle(async (request) => {
  limitApi(request);
  if (!(await connectDatabase())) return disabled();

  const text = await request.text();
  if (text.length > 10 * 1024) return fail(413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
  let body;
  try { body = JSON.parse(text); } catch { return fail(400, "INVALID_JSON", "Request body is not valid JSON."); }

  const visitor = getVisitor(request);
  const doc = await Download.create({ ...cleanEntry(body), visitorId: visitor.id });

  // Keep only the newest MAX_ENTRIES per visitor.
  const old = await Download.find({ visitorId: visitor.id }).sort({ createdAt: -1 }).skip(MAX_ENTRIES).select("_id").lean();
  if (old.length) await Download.deleteMany({ _id: { $in: old.map((d) => d._id) } });

  return attachVisitor(ok({ enabled: true, entry: toEntry(doc) }, { status: 201 }), visitor);
});

export const DELETE = handle(async (request) => {
  limitApi(request);
  if (!(await connectDatabase())) return disabled();
  const visitor = getVisitor(request);
  await Download.deleteMany({ visitorId: visitor.id });
  return attachVisitor(ok({ enabled: true, entries: [] }), visitor);
});
