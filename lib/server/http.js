import { NextResponse } from "next/server";
import { AppError } from "./appError.js";

export const ok = (data, init) => NextResponse.json({ success: true, data }, init);

export const fail = (status, code, message, init = {}) =>
  NextResponse.json({ success: false, error: { code, message } }, { ...init, status });

// Wraps a route handler so AppError and unexpected errors use the one JSON error shape.
export function handle(fn) {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx);
    } catch (err) {
      if (err instanceof AppError) return fail(err.status, err.code, err.message);
      console.error(err); // details stay in the server log only
      return fail(500, "SERVER_ERROR", "Something went wrong on our side.");
    }
  };
}
