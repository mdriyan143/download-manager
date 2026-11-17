const API_BASE = "/api"; // same origin: the API now lives in this Next.js app

async function request(path, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error?.message || "Couldn't reach the server. Check that the app is running.");
    }
    return json.data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("The request took too long. Please try again.");
    if (err instanceof TypeError) throw new Error("Couldn't reach the server. Check that the app is running.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const fetchPlatforms = () => request("/media/platforms");

export const fetchMediaInfo = (url) =>
  request("/media/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });

// A normal link: the browser downloads it itself and shows its own progress.
export function buildDownloadUrl({ url, optionId, title }) {
  const params = new URLSearchParams({ url, option: optionId, title });
  return `${API_BASE}/media/download?${params}`;
}
