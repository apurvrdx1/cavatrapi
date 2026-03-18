# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/engine/package.json ./packages/engine/
COPY packages/ai/package.json ./packages/ai/
COPY apps/server/package.json ./apps/server/

# Install all dependencies (needed for workspace linking)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/src ./packages/shared/src
COPY packages/engine/src ./packages/engine/src
COPY packages/ai/src ./packages/ai/src
COPY apps/server/src ./apps/server/src

# Copy tsconfigs
COPY packages/shared/tsconfig.json ./packages/shared/
COPY packages/engine/tsconfig.json ./packages/engine/
COPY packages/ai/tsconfig.json ./packages/ai/
COPY apps/server/tsconfig.json ./apps/server/

# Build dependencies first, then server
RUN pnpm --filter @cavatrapi/shared build
RUN pnpm --filter @cavatrapi/engine build
RUN pnpm --filter @cavatrapi/ai build
RUN pnpm --filter @cavatrapi/server build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/engine/package.json ./packages/engine/
COPY packages/ai/package.json ./packages/ai/
COPY apps/server/package.json ./apps/server/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/engine/dist ./packages/engine/dist
COPY --from=builder /app/packages/ai/dist ./packages/ai/dist
COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 3001

CMD ["node", "apps/server/dist/index.js"]
