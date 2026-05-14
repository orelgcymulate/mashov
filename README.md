# Mashov Dashboard

Family home dashboard for managing each kid's schoolwork — homework with done-toggles, weekly schedule, grades, behavior, messages, notifications. Single password login, data lives in MongoDB, deploys to Railway.

This is the v2 rewrite. The legacy Express + scraped-Mashov version (with the vanilla-TS tablet UI in `public/`) was replaced by:

- **`apps/api`** — NestJS service, REST CRUD for 7 entities + auth + dashboard summary.
- **`apps/web`** — Next.js (App Router) webapp. RTL Hebrew. TanStack Query, polls every 60s. shadcn-style components, Tailwind. Auto-refresh after sleep / focus / reconnect.
- **`packages/shared`** — zod schemas + types, single source of truth for both apps.
- **MongoDB** — Railway plugin in production, plain `mongo:7` container locally.

## Local development

```bash
# 1. install workspace deps
npm install

# 2. start Mongo
docker compose up -d mongo

# 3. configure env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. seed mock data (Ayala + Yishai Yosef)
npm run seed

# 5. dev (api on :3001, web on :3000)
npm run dev
```

Open <http://localhost:3000>. Login with the password from `apps/api/.env` (`DASHBOARD_PASSWORD`).

## Deploy to Railway

1. Push this repo to GitHub.
2. In Railway create **two services** from the same repo:
   - `api` → root `apps/api/Dockerfile`
   - `web` → root `apps/web/Dockerfile`
3. Add the **MongoDB plugin** and attach its `MONGO_URL` env var to the `api` service.
4. Set on `api`: `JWT_SECRET` (random), `DASHBOARD_PASSWORD` (your choice).
5. Set on `web`: `API_URL=http://api.railway.internal:3001`.
6. Disable the public domain on `api` (it should only be reachable from `web` over the private network).
7. After the first deploy run the one-off:

   ```bash
   railway run --service=api npm run seed
   ```

The `web` service is the only public URL.

## What's where

```
mashov-dashboard/
├── apps/
│   ├── api/             NestJS
│   │   └── src/
│   │       ├── modules/      auth + 7 entities + dashboard
│   │       └── seed/         seed script + mock dataset
│   └── web/             Next.js
│       └── src/
│           ├── app/
│           │   ├── login/
│           │   └── (dash)/   today, tasks, schedule, grades, behavior, messages, notifications, kids
│           ├── components/
│           └── lib/hooks/    TanStack Query hooks per entity
├── packages/
│   └── shared/          zod schemas + types
├── docker-compose.yml   local Mongo
├── railway.toml         Railway hints
└── docs/superpowers/specs/2026-05-13-nest-mongo-dashboard-design.md
```

## API (under `/api`, all routes require the session cookie except `auth/login` and `health`)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/auth/login` | `{ password }` → sets HTTP-only cookie, 30 days, sliding |
| `POST` | `/api/auth/logout` | clears cookie |
| `GET` | `/api/auth/me` | 200 if cookie valid |
| `GET/POST/PATCH/DELETE` | `/api/{entity}` | for kids, homework, schedule, grades, behavior, messages, notifications |
| `PATCH` | `/api/homework/:id` | `{ done: true|false }` toggles completion; server manages `completedAt` |
| `GET` | `/api/dashboard/summary?kidId=…` | aggregate for the dashboard pages |

## Why single-password auth

This is a family dashboard on a wall tablet. The threat model is "kids tapping things" + "anyone on the home Wi-Fi" — not enterprise security. One shared password, one long-lived cookie, and Railway's HTTPS in front. If that's not enough for your context, swap `auth.controller.ts` for a real user system.
