# Multi-stage build: bundle the TS frontend, then ship a slim Node image.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
COPY web ./web
COPY public ./public
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/src ./src
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["npx", "tsx", "src/server.ts"]
