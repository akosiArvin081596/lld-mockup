# syntax=docker/dockerfile:1
# Liquid Legacy Distribution site: Next.js standalone server.
#
# Build (SITE_URL is baked into canonical links, Open Graph tags and the sitemap):
#   docker build -t lld-site --build-arg SITE_URL=https://www.your-domain.com .
# Run: see README ("Option A: Docker") for the full hardened command. Always bind to 127.0.0.1.

FROM node:22-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG SITE_URL
ARG NEXT_PUBLIC_ALLOW_INDEXING=false
ENV SITE_URL=${SITE_URL} \
    NEXT_PUBLIC_ALLOW_INDEXING=${NEXT_PUBLIC_ALLOW_INDEXING}
RUN test -n "$SITE_URL" || (echo "SITE_URL build arg is required" && exit 1)
RUN pnpm build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# The image optimizer's cache is the only writable path (works with --read-only + a volume here).
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next/cache
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
