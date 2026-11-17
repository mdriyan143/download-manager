export function formatBytes(bytes) {
  if (!bytes) return "Size unknown";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `~${value.toFixed(i > 1 ? 1 : 0)} ${units[i]}`;
}

export function formatDuration(seconds) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export const formatDate = (iso) => new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

// Picks the option closest to the user's default quality without going above it.
export function pickOption(options, preferred) {
  const allVideos = options.filter((o) => o.kind === "video");
  if (!allVideos.length) return options[0];
  // Prefer versions without a platform watermark whenever one exists.
  const clean = allVideos.filter((o) => !o.watermarked);
  const pool = clean.length ? clean : allVideos;
  // Then prefer versions that play in every player (H.264) over VP9/AV1/HEVC.
  const compatible = pool.filter((o) => o.compatible !== false);
  const videos = compatible.length ? compatible : pool;
  // "Best" = the recommended Original when the platform has one, otherwise the top option.
  if (preferred === "best") return videos.find((o) => o.recommended) || videos[0];
  const limit = Number(preferred);
  return videos.find((o) => o.height <= limit) || videos[videos.length - 1];
}
