import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "./env.js";

const run = promisify(execFile);
let cache = null;

async function exists(command, args) {
  try {
    await run(command, args, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// Checks which external tools are installed (cached for a minute).
export async function getToolStatus() {
  if (cache && Date.now() - cache.at < 60_000) return cache.value;
  const [ytDlp, ffmpeg] = await Promise.all([
    exists(env.ytDlpPath, ["--version"]),
    exists(env.ffmpegPath, ["-version"]),
  ]);
  cache = { at: Date.now(), value: { ytDlp, ffmpeg } };
  return cache.value;
}
