FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 SAGAR_STANDALONE=1 PORT=3000 SAGAR_DATABASE_PATH=/var/data/sagar.sqlite
RUN mkdir -p /var/data && chown node:node /var/data
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/src/lib/server ./src/lib/server
COPY --from=builder --chown=node:node /app/src/data ./src/data
COPY --from=builder --chown=node:node /app/src/types ./src/types
USER node
EXPOSE 3000
CMD ["node", "--experimental-strip-types", "scripts/start-production.mjs"]
