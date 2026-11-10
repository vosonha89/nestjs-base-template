# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build. Final image ships only production dependencies + dist.
#   docker build -t nestjs-api-template .
#   docker run --rm -p 3001:3001 --env-file env/.env.production nestjs-api-template
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install all dependencies (incl. dev, needed to compile) ─────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: compile TypeScript ─────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ── Stage 3: production dependencies only ───────────────────────────────────
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Stage 4: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as the unprivileged user shipped with the base image.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package*.json ./

USER node
EXPOSE 3001

# `docker stop` sends SIGTERM; main.ts calls enableShutdownHooks() so the
# connection pool closes gracefully before the container exits.
STOPSIGNAL SIGTERM
CMD ["node", "dist/main"]