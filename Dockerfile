# Railway Deployment Dockerfile for CoverCraft BD Server
FROM node:22-slim

# Install system dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    wget \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/

# Install all dependencies from workspace root
RUN pnpm install --frozen-lockfile

# Copy server source code and prisma
COPY apps/server ./apps/server

# Build TypeScript
WORKDIR /app/apps/server
RUN pnpm build

# Expose port (Railway provides PORT env)
EXPOSE 5000

# Start command
CMD ["pnpm", "start"]
