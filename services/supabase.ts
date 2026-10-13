/**
 * Cloud backup on Supabase (Postgres) over plain HTTPS (REST): Anonymous Auth + PostgREST tables.
 * No SDK is needed. Every request either succeeds, fails with a clear message, or times out after 15 s,
 * so the offline sync queue can never hang.
 */
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';

// Clean up common .env mistakes: quotes/spaces, missing https://, a pasted /rest/v1 or /auth/v1 suffix, trailing slash.
const cleanUrl = (u: string) => {
  let x = u.trim().replace(/^["']|["']$/g, '').replace(/\/(rest|auth)\/v1.*$/i, '').replace(/\/+$/, '');
  if (x && !/^https?:\/\//i.test(x)) x = 'https://' + x;
  return x;
};
const URL_ = cleanUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
const KEY = (process.env.EXPO_PUBLIC_SUPABASE_KEY ?? '').trim().replace(/^["']|["']$/g, '');
export const cloudConfigured = !!(URL_ && KEY);
export const cloudHost = URL_.replace(/^https?:\/\//, '');

// tiny key/value store on the local SQLite (keeps the anonymous session between launches)
const kvGet = (k: string) => db.select().from(schema.weather_cache).where(eq(schema.weather_cache.key, 'sb:' + k)).get()?.json ?? null;
const kvSet = (k: string, v: string) => db.insert(schema.weather_cache).values({ key: 'sb:' + k, json: v, fetched_at: Date.now() }).onConflictDoUpdate({ target: schema.weather_cache.key, set: { json: v, fetched_at: Date.now() } }).run();

async function http(path: string, init: RequestInit & { headers?: Record<string, string> }, ms = 15000): Promise<any> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(URL_ + path, { ...init, signal: ctl.signal, headers: { apikey: KEY, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
    const text = await r.text();
    let j: any = null; try { j = JSON.parse(text); } catch {}
    if (!r.ok) { const e: any = new Error(`${r.status} ${j?.error_code ?? j?.code ?? ''} ${j?.msg ?? j?.message ?? j?.error_description ?? text.slice(0, 160)}`.trim()); e.status = r.status; throw e; }
    return j;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new Error('Timed out: cannot reach the server');
    throw e;
  } finally { clearTimeout(timer); }
}

type Session = { uid: string; token: string; refresh: string; exp: number };
const loadSession = (): Session | null => { try { return JSON.parse(kvGet('session') ?? 'null'); } catch { return null; } };
const toSession = (j: any): Session => ({ uid: j.user.id, token: j.access_token, refresh: j.refresh_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 });

/** Anonymous sign-in: the same user id is reused on later launches (refresh token), also while offline. */
export async function ensureSignedIn(): Promise<{ uid: string; token: string }> {
  if (!cloudConfigured) throw new Error('Cloud backup is not configured (.env)');
  let s = loadSession();
  if (s && s.exp > Date.now() + 60_000) return { uid: s.uid, token: s.token };
  if (s) {
    try {
      s = toSession(await http('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh }) }));
      kvSet('session', JSON.stringify(s));
      return { uid: s.uid, token: s.token };
    } catch (e: any) { if (!/^(400|401|403|422)/.test(String(e?.message))) throw e; /* refresh rejected: sign in again */ }
  }
  s = toSession(await http('/auth/v1/signup', { method: 'POST', body: JSON.stringify({}) }));
  kvSet('session', JSON.stringify(s));
  return { uid: s.uid, token: s.token };
}

/** Insert or update one row (primary key id). Row-level security makes sure only the owner can change it. */
export const upsertRow = (table: string, row: Record<string, any>, token: string) =>
  http(`/rest/v1/${table}?on_conflict=id`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });

/** Rows whose synced_at is newer than `since`, oldest first. */
export const changedSince = (table: string, since: number, token: string, limit = 200): Promise<Record<string, any>[]> =>
  http(`/rest/v1/${table}?select=*&synced_at=gt.${since}&order=synced_at.asc&limit=${limit}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } }, 20000);

export const friendlyError = (e: any): string => {
  const m = String(e?.message ?? e);
  if (/anonymous_provider_disabled|Anonymous sign-ins are disabled/i.test(m)) return 'Enable anonymous sign-ins: Supabase > Authentication > Sign In / Providers';
  if (/Invalid API key|No API key|apikey/i.test(m)) return 'Supabase key is wrong: check .env, then restart with --clear';
  if (/PGRST205|42P01|schema cache|does not exist/i.test(m)) return 'Tables are missing: run supabase.sql in the Supabase SQL Editor';
  if (/42501|row-level security|permission denied/i.test(m)) return 'Security policy blocked the write: run supabase.sql again';
  if (/Network request failed|Timed out/i.test(m)) return `Cannot reach ${cloudHost || 'the server'}: check the phone's internet connection`;
  return m.slice(0, 140);
};

/** Read rows with a PostgREST query string, e.g. selectRows('profiles', 'id=eq.123', token). */
export const selectRows = (table: string, queryString: string, token: string): Promise<Record<string, any>[]> =>
  http(`/rest/v1/${table}?select=*&${queryString}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
