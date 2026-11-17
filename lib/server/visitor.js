import { randomUUID } from "node:crypto";

// Anonymous visitor id kept in an httpOnly cookie. No login, no personal data.
const COOKIE = "mg_vid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getVisitor(request) {
  const existing = request.cookies.get(COOKIE)?.value;
  if (existing && UUID.test(existing)) return { id: existing, isNew: false };
  return { id: randomUUID(), isNew: true };
}

export function attachVisitor(response, visitor) {
  if (visitor.isNew) {
    response.cookies.set(COOKIE, visitor.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
