# Mashov Dashboard

Family home dashboard for the Israeli school system (Mashov).
TypeScript backend on your home network, vanilla-TS webapp on a wall-mounted tablet (iPad, Android, anything with a browser).

Inspired by Nimrod Mankovski's "Vibe Coding" project — a single panel that shows each kid's homework, today's schedule, teacher messages, and grades, refreshed automatically.

## What it does

- One Express + TypeScript server, runs anywhere Node 18+ runs.
- Logs each kid into Mashov via the unofficial [`mashov-api`](https://github.com/Apophisss/MashovApi) package, caches each section in memory.
- Serves a Hebrew-RTL webapp at `http://<your-server>:3000`.
- Five views: Today, Tasks (homework), Schedule (tomorrow), Messages, Grades.
- Auto-refresh every 5 minutes. Sticky kid + view selection via `localStorage`.
- No build step for the backend (`tsx`). One-line `esbuild` bundle for the frontend.

## Setup

```bash
# 1. clone, install
npm install

# 2. configure
cp .env.example .env
# edit .env — at minimum set KID_1_* (semel, username, password)
# look up your school's semel here: https://web.mashov.info/api/schools

# 3. run in dev (watches both backend and frontend)
npm run dev

# or production-style
npm run build && npm start
```

Then visit `http://<your-server-ip>:3000` on any browser.

## Run on a tablet (Android or iPad)

This is a plain webapp, so any tablet works. For a kiosk-style experience:

- **Android** — install [Fully Kiosk Browser](https://www.fully-kiosk.com/) (free). Set the start URL to `http://<your-server-ip>:3000`, enable autostart and screen-on. It hides the system UI and reloads on its own.
- **iPad** — open the URL in Safari and use "Add to Home Screen". Then turn on Guided Access (Settings → Accessibility) and start it from the icon for a fullscreen, locked experience.

Either way the brain lives on your home server and the tablet is just a thin client — exactly the architecture from Nimrod's post.

## Deploy with Docker

```bash
docker compose up -d --build
```

The image is multi-stage and ends up around ~150 MB on `node:20-alpine`. Works fine on a Raspberry Pi 4.

## API

All endpoints return JSON.

| Method | Path                              | What it returns                                 |
|--------|-----------------------------------|-------------------------------------------------|
| GET    | `/api/health`                     | `{ ok: true, kids: [ids] }`                     |
| GET    | `/api/kids`                       | array of `{ id, name, color }`                  |
| GET    | `/api/kids/:kidId/summary`        | all sections for one kid, parallel              |
| GET    | `/api/kids/:kidId/:section`       | single section: `homework`, `timetable`, `grades`, `behavior`, `messages`, `notifications` |

## Files

```
mashov-dashboard/
├── src/
│   ├── server.ts          # entire backend
│   └── mashov-api.d.ts    # types for the upstream npm package
├── web/
│   └── app.ts             # entire frontend (esbuild → public/app.js)
├── public/
│   ├── index.html
│   └── styles.css
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

## Adjusting the school bell schedule

`LESSON_TIMES` at the top of `web/app.ts` holds the start/end times for each lesson slot. Mashov returns lesson **numbers**, not clock times — change this table to match your school's bells.

## Notes & caveats

- The upstream `mashov-api` package is unofficial. Mashov can change their API at any moment. If a section breaks, the affected card shows an empty state and the rest of the dashboard keeps working.
- Credentials never leave your machine. They sit in `.env`, get sent only to `web.mashov.info`. Make sure to put the server on your LAN, not on the public internet.
- Israeli parent accounts usually have one credential per child — that's why the config has `KID_1_*`, `KID_2_*` blocks. If your school provides a single parent login that lists multiple children, you can still configure them as separate kids using the same username/password; Mashov will return only one child's data per session, so adjust if needed.
