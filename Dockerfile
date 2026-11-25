FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
ENV NODE_ENV=production PORT=3000
# yt-dlp is installed with pip (not the single-file download) so Python keeps
# precompiled bytecode. This makes every yt-dlp start much faster.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates \
 && python3 -m venv /opt/venv \
 && /opt/venv/bin/pip install --no-cache-dir "yt-dlp[default]" \
 && rm -rf /var/lib/apt/lists/*
ENV PATH="/opt/venv/bin:$PATH"
WORKDIR /app
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.mjs ./
USER node
EXPOSE 3000
CMD ["npm", "start"]