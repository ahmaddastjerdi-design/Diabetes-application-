# syntax=docker/dockerfile:1
# Production image for HealthPassport Pro (Next.js standalone `next start`).
# Build context is this directory (healthpassport-pro/).

FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# OpenSSL is required by Prisma's query engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# --- Install dependencies (cached on lockfile) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build the app ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Env is validated at runtime, not build; skip it here (no secrets in the image).
RUN SKIP_ENV_VALIDATION=true npm run build

# --- Runtime image ---
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/docker ./docker
RUN chmod +x /app/docker/entrypoint.sh
EXPOSE 3000
# Applies migrations, optionally seeds a synthetic demo patient, then serves.
ENTRYPOINT ["/app/docker/entrypoint.sh"]
