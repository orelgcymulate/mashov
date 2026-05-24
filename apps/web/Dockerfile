FROM node:20-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json* .npmrc* ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm install --workspaces --include-workspace-root

FROM node:20-slim AS build
WORKDIR /repo
# Railway passes service variables here via --build-arg. API_URL must be
# present at build time because Next.js evaluates next.config.mjs (and bakes
# the rewrites manifest) during `next build`.
ARG API_URL
ENV API_URL=$API_URL
# NEXT_PUBLIC_* must be present at build time so it's inlined into the
# client bundle. Used by call-context to open the Socket.io connection
# directly against the api (Next's rewrites don't proxy WebSocket upgrades
# reliably enough for cross-subdomain hosts).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN npm run -w @mashov/shared build
ENV NEXT_TELEMETRY_DISABLED=1
RUN echo "[build] API_URL=${API_URL:-<unset>}" && echo "[build] NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-<unset>}" && npm run -w @mashov/web build

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/web/.next ./apps/web/.next
COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --from=build /repo/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=build /repo/apps/web/package.json ./apps/web/package.json
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/package.json ./package.json
EXPOSE 3000
WORKDIR /repo/apps/web
CMD ["npm", "run", "start"]
