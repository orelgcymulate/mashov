// =============================================================================
// Mashov Dashboard — TypeScript backend, one file.
//
// Reads kid credentials from .env, logs each kid into Mashov on demand,
// caches each data type with a TTL, and serves a static webapp from /public.
// =============================================================================

import 'dotenv/config';
import path from 'node:path';
import express, { Request, Response, NextFunction } from 'express';
import * as mashov from 'mashov-api';

// ---------- Types & config ---------------------------------------------------

interface Kid {
  id: string;
  name: string;
  color: string;
  semel: string;
  username: string;
  password: string;
}

interface Config {
  port: number;
  academicYear: number;
  cacheTtlMs: number;
  kids: Kid[];
}

function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const kids: Kid[] = [];
  for (let i = 1; i <= 10; i++) {
    const id = env[`KID_${i}_ID`];
    if (!id) continue;
    const semel = env[`KID_${i}_SEMEL`];
    const username = env[`KID_${i}_USERNAME`];
    const password = env[`KID_${i}_PASSWORD`];
    if (!semel || !username || !password) {
      console.warn(`[config] KID_${i} (${id}) missing semel/username/password — skipping.`);
      continue;
    }
    kids.push({
      id,
      name: env[`KID_${i}_NAME`] ?? id,
      color: env[`KID_${i}_COLOR`] ?? '#888',
      semel,
      username,
      password,
    });
  }
  return {
    port: Number(env.PORT) || 3000,
    academicYear: Number(env.ACADEMIC_YEAR) || new Date().getFullYear(),
    cacheTtlMs: (Number(env.CACHE_TTL_SECONDS) || 300) * 1000,
    kids,
  };
}

// ---------- Per-kid Mashov client (lazy login + simple TTL cache) ------------

type SectionFetcher = (info: mashov.LoginInfo) => Promise<unknown>;

const SECTIONS: Record<string, SectionFetcher> = {
  homework:      (info) => mashov.get(info, 'homework'),
  timetable:     (info) => mashov.get(info, 'timetable'),
  grades:        (info) => mashov.get(info, 'grades'),
  behavior:      (info) => mashov.get(info, 'behave'),
  messages:      (info) => mashov.getMail(info, 20),
  notifications: (info) => mashov.getNotifications(info, 20),
};

class KidClient {
  private login: mashov.LoginInfo | null = null;
  private loginInFlight: Promise<mashov.LoginInfo> | null = null;
  private cache = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(private kid: Kid, private year: number, private ttlMs: number) {}

  private async getLogin(): Promise<mashov.LoginInfo> {
    if (this.login) return this.login;
    if (!this.loginInFlight) {
      this.loginInFlight = mashov
        .loginToMashov(this.kid.semel, this.year, this.kid.username, this.kid.password)
        .then((info) => {
          this.login = info;
          return info;
        })
        .finally(() => {
          this.loginInFlight = null;
        });
    }
    return this.loginInFlight;
  }

  async section(name: string): Promise<unknown> {
    const fetcher = SECTIONS[name];
    if (!fetcher) throw new Error(`unknown section: ${name}`);

    const cached = this.cache.get(name);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const info = await this.getLogin();
    let value: unknown;
    try {
      value = await fetcher(info);
    } catch (_err) {
      // Login may have expired — drop it and try once more.
      this.login = null;
      const fresh = await this.getLogin();
      value = await fetcher(fresh);
    }
    this.cache.set(name, { value, expiresAt: Date.now() + this.ttlMs });
    return value;
  }
}

// ---------- App --------------------------------------------------------------

const config = loadConfig();
if (config.kids.length === 0) {
  console.warn('[server] No kids configured. Copy .env.example to .env and fill in KID_1_*.');
}

const clients = new Map<string, KidClient>(
  config.kids.map((k) => [k.id, new KidClient(k, config.academicYear, config.cacheTtlMs)]),
);

const app = express();
app.disable('x-powered-by');
app.use(express.json());

// Async wrapper so thrown errors become JSON instead of crashing.
const asyncRoute =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, kids: config.kids.map((k) => k.id) });
});

app.get('/api/kids', (_req, res) => {
  res.json(config.kids.map(({ id, name, color }) => ({ id, name, color })));
});

app.get(
  '/api/kids/:kidId/:section',
  asyncRoute(async (req, res) => {
    const client = clients.get(req.params.kidId);
    if (!client) return res.status(404).json({ error: 'unknown_kid' });
    if (!SECTIONS[req.params.section]) {
      return res.status(404).json({ error: 'unknown_section' });
    }
    const data = await client.section(req.params.section);
    res.json({ kidId: req.params.kidId, section: req.params.section, data });
  }),
);

app.get(
  '/api/kids/:kidId/summary',
  asyncRoute(async (req, res) => {
    const kid = config.kids.find((k) => k.id === req.params.kidId);
    const client = clients.get(req.params.kidId);
    if (!kid || !client) return res.status(404).json({ error: 'unknown_kid' });

    const entries = await Promise.all(
      Object.keys(SECTIONS).map(async (name) => {
        try {
          return [name, { ok: true, data: await client.section(name) }] as const;
        } catch (err) {
          return [name, { ok: false, error: (err as Error).message }] as const;
        }
      }),
    );
    res.json({
      kid: { id: kid.id, name: kid.name, color: kid.color },
      fetchedAt: new Date().toISOString(),
      sections: Object.fromEntries(entries),
    });
  }),
);

// JSON error handler.
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[route ${req.method} ${req.path}]`, err.message);
  if (!res.headersSent) {
    res.status(502).json({ error: 'mashov_upstream_error', message: err.message });
  }
});

// ---------- Static webapp ----------------------------------------------------

app.use(express.static(path.resolve('public')));

// ---------- Boot -------------------------------------------------------------

app.listen(config.port, () => {
  console.log(`[server] http://0.0.0.0:${config.port}`);
  console.log(`[server] Kids: ${config.kids.map((k) => k.id).join(', ') || '(none)'}`);
});
