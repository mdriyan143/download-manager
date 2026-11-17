// Turns any media title into a filename that is safe on every operating system.
export function sanitizeFilename(title) {
  const cleaned = String(title || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|%]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 120);
  return cleaned || "download";
}

export function contentDisposition(filename) {
  const asciiName = filename.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
