// Adapter interface for platforms we recognise but haven't integrated yet.
// To add a real one, copy youtube.js and implement getInfo() and prepareDownload().
export function plannedPlatform(id, name, hosts) {
  return { id, name, hosts, status: "planned" };
}
