# ─── Stage 1: Build native modules ──────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Production image ──────────────────────────────────────────────
FROM node:20-slim

# Install ffmpeg + yt-dlp runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy built node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create data & logs directories (gitignored but needed at runtime)
RUN mkdir -p data logs

# Sync system yt-dlp to plugin binary (same as checkYtDlp.js does on boot)
RUN cp /usr/local/bin/yt-dlp node_modules/@distube/yt-dlp/bin/yt-dlp || true

CMD ["node", "index.js"]
