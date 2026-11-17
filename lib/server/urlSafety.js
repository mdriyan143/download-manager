import net from "node:net";

// Returns a URL object only for plain http(s) links without embedded credentials.
export function parseHttpUrl(raw) {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(url.protocol)) return null;
  if (url.username || url.password) return null;
  return url;
}

// SSRF guard: rejects localhost, internal names and private/reserved IP literals.
export function isPrivateHost(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  const ipVersion = net.isIP(host);
  if (ipVersion === 4) {
    const [a, b] = host.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (ipVersion === 6) {
    return host === "::1" || host === "::" || /^(fc|fd|fe80|::ffff:)/.test(host);
  }
  return false;
}
