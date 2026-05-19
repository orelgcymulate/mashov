FROM node:20-slim AS deps
WORKDIR /repo
# Copy the entire monorepo so npm workspaces install correctly (it needs to
# see every workspace's package.json + the .npmrc to pick up legacy-peer-deps).
COPY package.json package-lock.json* .npmrc* ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm install --workspaces --include-workspace-root

FROM node:20-slim AS build
WORKDIR /repo
# With the current install strategy, npm hoists most packages to /repo/node_modules.
# Per-workspace node_modules only ever contain @types and similar un-hoistable
# packages, so we copy whatever may exist (the `*` glob makes the COPY a no-op
# when the directory is absent).
COPY --from=deps /repo/node_modules ./node_modules
COPY . .
RUN npm run -w @mashov/shared build
RUN npm run -w @mashov/api build

FROM node:20-slim AS runtime
WORKDIR /repo
ENV NODE_ENV=production
# mongodb-memory-server (used when MONGO_URL is unset) needs libcurl + the
# binary it downloads at first run. The download itself lives under
# node_modules and travels via the deps→runtime COPY below, so cold starts
# don't re-download it.
RUN apt-get update && apt-get install -y --no-install-recommends libcurl4 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/package.json ./package.json
EXPOSE 3001
WORKDIR /repo/apps/api
CMD ["node", "dist/main.js"]
