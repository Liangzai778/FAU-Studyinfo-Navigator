/**
 * Minimal, privacy-first page/feature counter for FAU Study Navigator.
 *
 * What is stored: one integer per day and path, and one integer per day and
 * feature event. No IP address, no user agent, no cookie, no visitor ID and no
 * referrer. The result cannot identify a person; it only answers "how often
 * was this page or button used".
 *
 * Deploy instructions are in ../README.md.
 */

type KVListResult = {
  keys: Array<{ name: string }>;
};

interface CounterStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  list(options: { prefix: string }): Promise<KVListResult>;
}

interface Env {
  COUNTERS: CounterStore;
  STATS_TOKEN: string;
  ALLOWED_ORIGINS?: string;
}

type Payload = {
  path?: unknown;
  event?: unknown;
};

const MAX_BODY_BYTES = 1024;
const MAX_PATH_LENGTH = 160;
const MAX_EVENT_LENGTH = 64;
const EVENT_PATTERN = /^[a-z0-9][a-z0-9_.-]*$/;
const MAX_DAYS = 90;
const RETENTION_SECONDS = 90 * 24 * 60 * 60;
const BERLIN_TIME_ZONE = 'Europe/Berlin';

function originAllowed(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function cors(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function berlinDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BERLIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function addDays(dateIso: string, days: number): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + days));
  return date.toISOString().slice(0, 10);
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function cleanPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const withoutQuery = value.split('?')[0]?.split('#')[0] ?? '';
  if (!withoutQuery.startsWith('/')) return null;
  return withoutQuery.slice(0, MAX_PATH_LENGTH);
}

function cleanEvent(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const event = value.trim().toLowerCase();
  if (!EVENT_PATTERN.test(event) || event.length > MAX_EVENT_LENGTH) return null;
  return event;
}

async function increment(store: CounterStore, key: string): Promise<void> {
  const current = Number.parseInt((await store.get(key)) ?? '0', 10);
  // Counts disappear automatically after 90 days; the stats endpoint reads at
  // most the same window, so no separate cleanup job is needed.
  await store.put(key, String(Number.isFinite(current) ? current + 1 : 1), {
    expirationTtl: RETENTION_SECONDS,
  });
}

async function record(env: Env, path: string | null, event: string | null): Promise<void> {
  const date = berlinDate();
  const writes: Promise<void>[] = [];
  if (path) writes.push(increment(env.COUNTERS, `p:${date}:${path}`));
  if (event) writes.push(increment(env.COUNTERS, `e:${date}:${event}`));
  await Promise.all(writes);
}

async function totals(env: Env, days: number): Promise<{
  dates: string[];
  pages: Map<string, number>;
  events: Map<string, number>;
  daily: Array<{ date: string; pageViews: number; events: number }>;
}> {
  const today = berlinDate();
  const dates = Array.from({ length: days }, (_, index) => addDays(today, -index));
  const pages = new Map<string, number>();
  const events = new Map<string, number>();
  const daily: Array<{ date: string; pageViews: number; events: number }> = [];

  for (const date of dates) {
    let pageViews = 0;
    let eventCount = 0;
    for (const [prefix, bucket, counter] of [
      [`p:${date}:`, pages, 'page'],
      [`e:${date}:`, events, 'event'],
    ] as const) {
      const list = await env.COUNTERS.list({ prefix });
      for (const key of list.keys) {
        const value = Number.parseInt((await env.COUNTERS.get(key.name)) ?? '0', 10);
        if (!Number.isFinite(value) || value <= 0) continue;
        const name = key.name.slice(prefix.length);
        bucket.set(name, (bucket.get(name) ?? 0) + value);
        if (counter === 'page') pageViews += value;
        else eventCount += value;
      }
    }
    daily.push({ date, pageViews, events: eventCount });
  }

  return { dates, pages, events, daily };
}

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = originAllowed(request, env);
    const headers = cors(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: origin ? 204 : 403, headers });
    }

    if (url.pathname === '/collect' && request.method === 'POST') {
      // Only same-site forms of abuse are interesting here; there is nothing
      // personal to protect beyond not storing identifiers in the first place.
      if (!origin) return json({ error: 'origin_not_allowed' }, 403, headers);
      const length = Number(request.headers.get('Content-Length') ?? '0');
      if (length > MAX_BODY_BYTES) return json({ error: 'body_too_large' }, 413, headers);

      let payload: Payload;
      try {
        payload = (await request.json()) as Payload;
      } catch {
        return json({ error: 'invalid_json' }, 400, headers);
      }

      const path = cleanPath(payload.path);
      const event = cleanEvent(payload.event);
      if (!path && !event) return json({ error: 'nothing_to_count' }, 400, headers);

      await record(env, path, event);
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === '/stats' && request.method === 'GET') {
      const authorization = request.headers.get('Authorization') ?? '';
      const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
      if (!env.STATS_TOKEN || !safeEqual(token, env.STATS_TOKEN)) {
        return json({ error: 'unauthorized' }, 401, headers);
      }

      const requestedDays = Number.parseInt(url.searchParams.get('days') ?? '30', 10);
      const days = Math.min(MAX_DAYS, Math.max(1, Number.isFinite(requestedDays) ? requestedDays : 30));
      const result = await totals(env, days);

      return json(
        {
          generatedAt: new Date().toISOString(),
          days,
          totals: {
            pageViews: [...result.pages.values()].reduce((sum, value) => sum + value, 0),
            events: [...result.events.values()].reduce((sum, value) => sum + value, 0),
          },
          pages: [...result.pages.entries()]
            .map(([path, count]) => ({ path, count }))
            .sort((left, right) => right.count - left.count),
          events: [...result.events.entries()]
            .map(([event, count]) => ({ event, count }))
            .sort((left, right) => right.count - left.count),
          daily: result.daily.slice().reverse(),
        },
        200,
        headers,
      );
    }

    return json({ error: 'not_found' }, 404, headers);
  },
};
