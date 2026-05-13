# Mashov Dashboard — NestJS + MongoDB Rewrite

**Status:** Design approved 2026-05-13
**Author:** Orel Gabay (with Claude)

## Background

The repo currently contains a family dashboard for the Israeli Mashov school system: Express + `mashov-api` + a vanilla-TypeScript tablet webapp in `public/`. It pulls data from Mashov on demand and caches it.

This design **fully replaces** that stack. Mashov is dropped. Data is now self-managed in MongoDB through a NestJS API, and a single Next.js webapp serves both the family display AND data entry. The app is deployed to Railway.

## Goals

1. **CRUD-managed data**, not scraped from Mashov.
2. **One unified Next.js webapp** that displays the dashboard and lets the user add/edit/delete entries.
3. **Persistent session**: after a single password login, the tablet stays authenticated indefinitely (sliding 30-day cookie).
4. **Auto-refresh every minute**, plus instant refresh when the tab returns from background.
5. **Deployable to Railway** as separate services (API + web + Mongo plugin).
6. **Seeded with realistic mock data** for two kids — Ayala (איילה) and Yishai Yosef (ישי יוסף).

## Non-goals

- Multi-user accounts, roles, registration. Single shared password only.
- Real-time push (WebSockets / SSE). Per-minute polling is sufficient.
- Any Mashov integration. The existing `mashov-api` dependency and `src/server.ts`/`web/app.ts`/`public/*` will be removed.
- Mobile-native app. The Next.js webapp must work on a tablet browser but is not packaged.

## Architecture

Two services on Railway behind one MongoDB instance. The browser talks **only** to the web service. The web service proxies `/api/*` requests to the NestJS api service over Railway's private network. This keeps cookies first-party and removes any CORS / cross-site concerns.

```
                                          ┌────────────────┐    Mongo wire    ┌──────────┐
                                          │  NestJS (api)  │ ────────────────▶│ MongoDB  │
                                          │  port 3001     │   private net    │ (plugin) │
                                          └────────────────┘                  └──────────┘
                                                  ▲
                                                  │ proxied /api/*
                                                  │ (Railway private network)
┌─────────────────┐    HTTPS                ┌────────────────┐
│  Browser/tablet │ ──────────────────────▶ │ Next.js (web)  │
│                 │   /api/* + /pages       │  port 3000     │
└─────────────────┘   first-party cookies   └────────────────┘
        │                                          │
        │ 60s polling, JWT cookie auto-sent        │ JWT cookie verified
        ▼                                          ▼
   User (browser, tablet)                  Sliding 30-day session
```

Railway hosts three units:

| Unit | Type | Public? | Notes |
|---|---|---|---|
| `api` | NestJS service | **no** | private only; only reachable from `web` over `api.railway.internal` |
| `web` | Next.js service | yes (HTTPS) | exposes both UI pages and a proxy at `/api/*` → api service |
| `mongo` | Railway MongoDB plugin | no | attached to `api` only |

The Next.js proxy is implemented via a `rewrites()` rule in `next.config.ts`:

```ts
async rewrites() {
  return [{ source: '/api/:path*', destination: `${process.env.API_URL}/api/:path*` }];
}
```

`API_URL` in production is the internal Railway hostname `http://api.railway.internal:3001`. Locally it's `http://localhost:3001`. The browser never sees the api hostname.

## Repo layout (monorepo, npm workspaces)

```
mashov-dashboard/
├── apps/
│   ├── api/                           NestJS service
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── common/                global pipes, filters, JWT guard, zod-pipe
│   │   │   ├── modules/
│   │   │   │   ├── auth/              login, logout, me, JwtAuthGuard
│   │   │   │   ├── kids/
│   │   │   │   ├── homework/
│   │   │   │   ├── schedule/
│   │   │   │   ├── grades/
│   │   │   │   ├── behavior/
│   │   │   │   ├── messages/
│   │   │   │   ├── notifications/
│   │   │   │   └── dashboard/         aggregate summary endpoint
│   │   │   └── seed/
│   │   │       ├── seed.ts            CLI entry: `npm run seed`
│   │   │       └── data.ts            mock dataset (ported from existing src/mock.ts)
│   │   ├── test/
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                           Next.js App Router
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── providers.tsx      QueryClient, Toaster
│       │   │   ├── middleware.ts      checks JWT cookie on (dash)/*
│       │   │   ├── (auth)/
│       │   │   │   └── login/page.tsx
│       │   │   └── (dash)/
│       │   │       ├── layout.tsx     TopBar + BottomNav + KidTabs
│       │   │       ├── today/page.tsx
│       │   │       ├── tasks/page.tsx
│       │   │       ├── schedule/page.tsx
│       │   │       ├── grades/page.tsx
│       │   │       ├── behavior/page.tsx
│       │   │       ├── messages/page.tsx
│       │   │       ├── notifications/page.tsx
│       │   │       └── kids/page.tsx
│       │   ├── lib/
│       │   │   ├── api-client.ts      fetch wrapper with credentials
│       │   │   ├── auth.ts            cookie/JWT helpers
│       │   │   └── hooks/             useKids, useHomework, etc.
│       │   └── components/
│       │       ├── ui/                shadcn primitives
│       │       ├── forms/             one form per entity
│       │       ├── cards/             one card/row per entity
│       │       ├── KidTabs.tsx
│       │       ├── TopBar.tsx
│       │       └── BottomNav.tsx
│       ├── tailwind.config.ts
│       ├── next.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                        @repo/shared
│       └── src/
│           ├── kid.ts                 zod schema + inferred types
│           ├── homework.ts
│           ├── schedule.ts
│           ├── grade.ts
│           ├── behavior.ts
│           ├── message.ts
│           ├── notification.ts
│           └── index.ts
│
├── docker-compose.yml                 local: mongo + api + web
├── railway.toml                       Railway services config
├── package.json                       workspaces root
└── README.md
```

The existing files (`src/`, `web/`, `public/`, root `package.json` scripts, `Dockerfile`, etc.) are removed or replaced as part of the migration.

## Data model

All collections share Mongoose `timestamps: true` (`createdAt`, `updatedAt`).

### `kids`

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `slug` | string, unique | URL-friendly identifier (e.g. `ayala`) |
| `name` | string | Display name in Hebrew |
| `color` | string | Hex color, e.g. `#ff6f9c` |

### `homework`

| Field | Type | Notes |
|---|---|---|
| `kidId` | ObjectId → kids | indexed |
| `subject` | string | |
| `homework` | string | Free-text description |
| `lessonDate` | Date | When the homework was assigned |
| `dueDate` | Date? | optional; defaults to `lessonDate` |
| `teacherName` | string? | |
| `done` | boolean | defaults to `false`; toggled by tapping the task in the UI |
| `completedAt` | Date? | set by the api when `done` flips `false → true`, cleared when flipped back |

Index: `{ kidId: 1, lessonDate: -1 }`. Secondary index: `{ kidId: 1, done: 1, lessonDate: -1 }` for filtered queries.

### `scheduleSlots` (timetable, recurring weekly)

| Field | Type | Notes |
|---|---|---|
| `kidId` | ObjectId → kids | indexed |
| `day` | number 1..7 | 1=Sun..7=Sat (matches existing UI) |
| `lesson` | number 1..8 | period number |
| `subject` | string | |
| `roomNum` | string? | |
| `teacher` | string? | |

Index: `{ kidId: 1, day: 1, lesson: 1 }` unique.

### `grades`

| Field | Type | Notes |
|---|---|---|
| `kidId` | ObjectId | |
| `subject` | string | |
| `event` | string | e.g. "מבחן שברים" |
| `grade` | number 0..100 | |
| `gradeType` | string | e.g. "מבחן", "בוחן", "פרויקט" |
| `eventDate` | Date | |
| `teacherName` | string? | |

Index: `{ kidId: 1, eventDate: -1 }`.

### `behaviorEvents`

| Field | Type | Notes |
|---|---|---|
| `kidId` | ObjectId | |
| `subject` | string | |
| `eventType` | string | e.g. "ציון לשבח", "איחור", "שיעורי בית חסרים" |
| `note` | string | |
| `date` | Date | |
| `justified` | boolean | |
| `teacherName` | string? | |

Index: `{ kidId: 1, date: -1 }`.

### `messages`

| Field | Type | Notes |
|---|---|---|
| `kidId` | ObjectId | |
| `subject` | string | |
| `sender` | string | |
| `body` | string? | |
| `sentAt` | Date | |
| `isNew` | boolean | UI flag |

Index: `{ kidId: 1, sentAt: -1 }`.

### `notifications`

| Field | Type | Notes |
|---|---|---|
| `kidId` | ObjectId | |
| `text` | string | |
| `date` | Date | |
| `isNew` | boolean | |

Index: `{ kidId: 1, date: -1 }`.

## REST API

All routes prefixed `/api`. JSON request/response. Cookies for auth.

### Auth

| Method | Path | Body | Response | Guard |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `{ password }` | 204 + sets cookie | public |
| `POST` | `/api/auth/logout` | — | 204 + clears cookie | public |
| `GET` | `/api/auth/me` | — | `{ ok: true }` or 401 | public |

`password` is checked against `DASHBOARD_PASSWORD` env var. JWT signed with `JWT_SECRET`, payload `{ sub: 'dashboard' }`, expiry 30 days. Cookie attributes: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`, `Max-Age=30d`.

### Entity CRUD (uniform)

For each entity in `{ kids, homework, schedule, grades, behavior, messages, notifications }`:

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/{entity}` | optional `?kidId=` filter (`kids` ignores it) |
| `GET` | `/api/{entity}/:id` | 404 if missing |
| `POST` | `/api/{entity}` | zod-validated body |
| `PATCH` | `/api/{entity}/:id` | partial update |
| `DELETE` | `/api/{entity}/:id` | 204 |

All require valid JWT cookie. 401 otherwise.

### Homework-specific behavior

`PATCH /api/homework/:id` with `{ done: true }` (or `false`) toggles completion. The api service, not the client, owns `completedAt`:

- When the request transitions `done` from `false` to `true`: the service sets `completedAt = new Date()`.
- When it transitions `true` to `false`: the service clears `completedAt = null`.
- When `done` is omitted or unchanged: `completedAt` is untouched.

`GET /api/homework` accepts an optional `?done=true|false` query param to filter. By default it returns all (done and pending).

### Aggregate endpoint

`GET /api/dashboard/summary?kidId=<id>&kidId=<id>...`

Returns, in a single query, every section for every requested kid:

```json
{
  "fetchedAt": "2026-05-13T10:00:00Z",
  "kids": {
    "<kidId>": {
      "homework": [...],
      "schedule": [...],
      "grades": [...],
      "behavior": [...],
      "messages": [...],
      "notifications": [...]
    }
  }
}
```

Implemented in the NestJS service by parallel `Model.find()` calls and assembling the response. This is what the dashboard pages call on initial render and on each 60-second poll.

### Sliding session

A NestJS interceptor on all authenticated routes re-issues the JWT cookie with a fresh 30-day expiry on every successful response. As long as the tablet polls at least once every 30 days, the session never expires.

## Frontend behavior

### Stack

- Next.js App Router (TypeScript)
- Tailwind CSS, RTL layout via `<html dir="rtl" lang="he">` and logical CSS properties
- shadcn/ui (Dialog, Input, Button, Select, Toast)
- TanStack Query v5 — data fetching, caching, polling
- react-hook-form + zod (schemas imported from `@repo/shared`)
- dayjs with `he` locale for Hebrew date formatting

### Auth flow

1. `middleware.ts` matches `/{today,tasks,schedule,grades,behavior,messages,notifications,kids}*`. It reads the JWT cookie and verifies signature + expiry. On failure, redirects to `/login` with `?next=<path>`.
2. `/login` shows a single password input. Submit posts `POST /api/auth/login`. On success, redirect to `?next` or `/today`.
3. The API client adds `credentials: 'include'` to every request. The browser sends the cookie automatically.
4. On any 401 from the API, a global TanStack Query error handler triggers `router.push('/login')`.

### Data layer

A single `QueryClient` configured globally:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30_000,
      retry: 1,
    },
  },
});
```

Per-entity hooks live in `apps/web/src/lib/hooks/`:

- `useKids()` → `GET /api/kids`
- `useHomework({ kidId })`, `useSchedule({ kidId })`, ... — one per entity
- `useDashboardSummary(kidIds)` → `GET /api/dashboard/summary?...` — used by the Today page and as a warm-up on dashboard mount
- Mutations: `useCreate<Entity>`, `useUpdate<Entity>`, `useDelete<Entity>` — each invalidates the matching `[entity, ...]` query key on success

### Pages

| Route | Display | Entry |
|---|---|---|
| `/login` | password input | — |
| `/today` | today's lessons (per kid) + urgent homework alerts | read-only |
| `/tasks` | homework list per kid, pending first then completed (collapsed/dimmed); each card shows a checkbox | tap the checkbox/card body → toggle `done` (optimistic update + `PATCH /api/homework/:id`); long-press or kebab menu → edit/delete; "+" → create dialog |
| `/schedule` | weekly grid (rows = lessons, columns = days) per kid | tap empty cell → create; tap filled → edit/delete |
| `/grades` | list + per-kid average | "+" / edit / delete |
| `/behavior` | list with type badge | "+" / edit / delete |
| `/messages` | list with `isNew` markers | "+" / edit / delete |
| `/notifications` | list with `isNew` markers | "+" / edit / delete |
| `/kids` | manage kids (name, color, slug) | "+" / edit / delete |

### Edit pattern

For each entity, three components:

- `<EntityForm>` — react-hook-form bound to the zod schema from `@repo/shared`
- `<EntityFormDialog mode="create" | "edit">` — wraps the form in shadcn `Dialog`, handles submit + mutation invalidation
- `<EntityCard>` / `<EntityRow>` — display + edit/delete buttons

Add/edit/delete confirmations use toasts. Destructive actions (delete) use `AlertDialog`.

The Tasks page extends this pattern with a checkbox affordance on each `<HomeworkCard>`. Tapping the checkbox calls a `useToggleHomeworkDone` mutation that does an **optimistic update** (instantly flips `done` in the cached query) and fires `PATCH /api/homework/:id`. On error the cache rolls back and a toast appears. Completed homework moves to a "הושלמו" section at the bottom of the list, dimmed but still editable.

### Layout

```
┌─────────────────────────────────────────────┐
│ TopBar:  clock · date · kid tabs · logout  │
├─────────────────────────────────────────────┤
│                                             │
│              Page content                   │
│                                             │
├─────────────────────────────────────────────┤
│ BottomNav: today · tasks · schedule · …    │
└─────────────────────────────────────────────┘
```

Kid tab "שניהם" shows all kids; selecting a single kid filters. Selection is persisted in `localStorage`.

### Connection persistence (summary)

The combination achieves "stay connected, refresh every minute":

- 30-day HttpOnly JWT cookie with sliding renewal on every authenticated response → no logout while in use
- TanStack Query `refetchInterval: 60_000` → all visible queries refetch every minute
- `refetchOnWindowFocus` + `refetchOnReconnect` → instant refresh after sleep, lost connection, or tab switch

After one login, the tablet can sit untouched for weeks and keep streaming the latest data.

## Seed script

`apps/api/src/seed/seed.ts`, runnable via `npm run seed` (workspace-scoped: `npm run -w apps/api seed`):

1. Connect to Mongo.
2. **Drop** existing collections (homework, schedule, grades, behavior, messages, notifications, kids).
3. Insert two kids:
   - `{ slug: 'ayala', name: 'איילה', color: '#ff6f9c' }`
   - `{ slug: 'yishai-yosef', name: 'ישי יוסף', color: '#4a90e2' }`
4. Insert the existing mock dataset from `src/mock.ts` (8 homework + full weekly schedule + 8 grades + 3 behavior + 10 messages + 3 notifications for Ayala; 10/38/10/4/10/4 for Yishai Yosef). Relative offsets (`lessonOffset`, `daysAgo`) are converted to absolute `Date` values at runtime so the data always looks fresh.
5. For homework: items with `lessonOffset < 0` (already past) are seeded with `done: true` and a `completedAt` shortly after `lessonDate`; future items are seeded with `done: false`. This gives the Tasks page a realistic mix of pending and completed work on first render.
6. The script is **idempotent**: re-running drops and re-inserts; no duplicates.

Locally: `npm run seed`. On Railway: `railway run npm run seed` after first deploy.

## Validation

Zod schemas in `packages/shared/src/<entity>.ts` are the single source of truth. They:

- Generate TypeScript types via `z.infer<>` (used by both api and web).
- Power NestJS validation via a `ZodValidationPipe` registered globally.
- Power react-hook-form via `@hookform/resolvers/zod` on the web.

Each entity has two zod schemas: `Create<Entity>Schema` (input) and `<Entity>Schema` (with `_id`, timestamps).

## Environment variables

### api

| Var | Notes |
|---|---|
| `MONGO_URL` | Provided by Railway Mongo plugin |
| `JWT_SECRET` | Random 32+ byte string |
| `DASHBOARD_PASSWORD` | The single shared login password |
| `PORT` | Defaults to 3001 |
| `CORS_ORIGIN` | The web service URL (for cookies to survive cross-site in dev) |

### web

| Var | Notes |
|---|---|
| `API_URL` | Server-side: `http://api.railway.internal:3001`. Client-side: derived from `NEXT_PUBLIC_API_URL`. |
| `NEXT_PUBLIC_API_URL` | Public URL of the api service, used by browser fetch |
| `PORT` | Defaults to 3000 |

## Local development

`docker-compose.yml` brings up Mongo on `localhost:27017`. Two terminals:

```
npm run -w apps/api dev      # NestJS on :3001
npm run -w apps/web dev      # Next.js on :3000
```

`.env.local` files in each app point at `mongodb://localhost:27017/mashov`, `JWT_SECRET=dev`, `DASHBOARD_PASSWORD=dev`, `API_URL=http://localhost:3001`.

## Deployment

Railway services configured via `railway.toml`. Two separate services from the same monorepo, each with a different start command and build root. Mongo attached as a plugin to the api service. After first deploy, run `railway run --service=api npm run seed` to populate the database. Subsequent deploys do not re-seed.

## Migration plan (out of scope for this spec, into the implementation plan)

The implementation plan will detail the order of:

1. Create new `apps/` and `packages/` layout, leaving old code in place.
2. Move existing mock data into `apps/api/src/seed/data.ts`.
3. Build api modules entity-by-entity with tests.
4. Build web pages entity-by-entity.
5. Wire up auth + middleware.
6. Wire up polling + TanStack Query.
7. Delete the old `src/`, `web/`, `public/`, top-level scripts.
8. Add Docker + Railway configs.
9. Deploy + seed.

## Open questions

None at this time. All decisions captured above.
