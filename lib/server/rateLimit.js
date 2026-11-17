import { AppError } from "./appError.js";

// Small in-memory fixed-window limiter (replaces express-rate-limit).
// It is per server instance. On serverless or multi-instance hosts, use a shared store such as Redis instead.
const buckets = new Map();

export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip")) || "unknown";
}

export function rateLimit(request, name, windowMs, limit, message) {
  const key = `${name}:${clientIp(request)}`;
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count++;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
  if (b.count > limit) throw new AppError(429, "RATE_LIMITED", message);
}

export const limitInfo = (req) => rateLimit(req, "info", 60_000, 20, "Too many lookups. Wait a minute and try again.");
export const limitDownload = (req) => rateLimit(req, "download", 60_000, 15, "Too many downloads started. Wait a minute and try again.");
export const limitApi = (req) => rateLimit(req, "api", 15 * 60_000, 300, "Too many requests. Please slow down.");
