# MediaGrab (Next.js)

Paste a video link, preview it, pick a quality and download it. The server streams the file to the browser and never stores media.

This is the Next.js version of the original Express + Vite project. Everything is now **one app**: the pages and the API live together, so there is no separate backend, no CORS and no proxy.

**Status (V1.1):** YouTube, TikTok and Instagram use yt-dlp. Facebook, X and Pinterest are recognised but not available yet.

## Prerequisites
- Node.js 20 or newer
- [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation) (required)
- [FFmpeg](https://ffmpeg.org/download.html) (recommended; without it only formats that already contain audio are offered)
- MongoDB (optional, only needed later for accounts)

## Run it
```bash
npm install
cp .env.example .env.local     # edit if needed
npm run dev                    # http://localhost:3000
```
Production: `npm run build && npm start`.

Check your setup at http://localhost:3000/api/health (shows whether yt-dlp, FFmpeg and MongoDB are detected).

## What changed from the Express version
| Before | Now |
|---|---|
| `server/` Express app on :5000 | Route Handlers in `app/api/**/route.js` |
| `client/` Vite + React Router | App Router pages: `app/page.jsx`, `app/history`, `app/settings` |
| `helmet` | Security headers in `next.config.mjs` |
| `cors` | Not needed (same origin) |
| `express-rate-limit` | Small in-memory limiter in `lib/server/rateLimit.js` |
| `dotenv` | Next.js loads `.env.local` itself |
| `axios` | Built-in `fetch` (`lib/api.js`) |
| MongoDB connect at startup | Connected lazily by `/api/health` (`lib/server/db.js`) |
| `VITE_API_URL` | Removed (API is on the same origin) |

All platform adapters, URL safety checks, yt-dlp handling and UI components are unchanged apart from import paths.

## Project layout
```
app/
  layout.jsx, providers.jsx, page.jsx, globals.css
  history/page.jsx, settings/page.jsx
  api/health, api/media/{platforms,info,download}/route.js
components/   UI components (client components)
context/      Settings, Toast, History providers
hooks/        useLocalStorage (SSR-safe)
lib/
  api.js, format.js          client helpers
  server/                    server-only code: platforms, yt-dlp, rate limit, db, models
```

## API
| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | App, database and tool status |
| GET | /api/media/platforms | Platforms and their status |
| POST | /api/media/info | Validate URL, detect platform, return formats |
| GET | /api/media/download?url=&option=&title= | Stream the chosen file to the browser |

Errors always use one shape: `{ "success": false, "error": { "code": "...", "message": "..." } }`.

## Deployment (important)
This app starts `yt-dlp` as a child process and streams long downloads, so it needs a **long-running Node server** with yt-dlp (and ideally FFmpeg) installed. It will **not** work on Vercel or other serverless/edge platforms. Use a VPS, Railway, Fly.io, Render, etc. A `Dockerfile` is included:

```bash
docker build -t mediagrab .
docker run -p 3000:3000 mediagrab
```

Notes:
- The rate limiter is per server instance. If you run several instances, move it to a shared store such as Redis.
- Behind a proxy, make sure it sets `X-Forwarded-For` so rate limits apply per visitor.
- YouTube sometimes blocks datacenter IPs. Running locally works best.

## Security notes
- Only http(s) links to allow-listed platform hosts are processed; localhost and private IPs are rejected.
- YouTube links are rebuilt from the video ID; yt-dlp runs without a shell and with `--` before the URL. Format selectors are built on the server, never taken from the client.
- Rate limits, request size limits, timeouts and a download concurrency limit are enabled.
- Internal errors are logged on the server and never sent to the browser.

## Known limitations
Same as V1.1: no cookies/logins (so most Instagram posts won't work), no photo posts, no private/age-restricted/live/DRM media, and history shows "started" because the browser doesn't report when a save finishes. Only download content you own or have permission to download, and follow each platform's terms.

To add a platform, copy `lib/server/platforms/youtube.js`, implement `getInfo()` and `prepareDownload()`, and register it in `lib/server/platforms/index.js`.
