import mongoose from "mongoose";
import { env } from "./env.js";

// Optional database: a missing MongoDB must never stop anyone from downloading.
// The connection is cached on globalThis so dev hot-reloads don't open new ones.
// After a failed attempt we wait 30s before trying again, so requests don't each stall on a dead database.
const g = globalThis;
g.__mongo ??= { promise: null, failedAt: 0 };

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return true;
  if (Date.now() - g.__mongo.failedAt < 30_000) return false;
  g.__mongo.promise ??= mongoose
    .connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 })
    .then(() => true)
    .catch(() => {
      g.__mongo.failedAt = Date.now();
      g.__mongo.promise = null;
      return false;
    });
  return g.__mongo.promise;
}

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;
