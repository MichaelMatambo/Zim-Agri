/**
 * Offline-first sync.
 * - Every write goes to SQLite first with sync_status='pending' (deletes are soft: deleted=1, so they sync too).
 * - When NetInfo says we are online: sign in anonymously (once), PUSH pending rows to Supabase (REST), then PULL listings
 *   other farmers changed since the last sync (cursor = upload time, so late uploads from offline phones are not missed).
 * - Conflict rule: LAST WRITE WINS on `updated_at`.
 * - Offline or Firebase not configured: the app keeps working; sync simply waits.
 */
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { useEffect, useState } from 'react';
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '../db';
import { cloudConfigured, ensureSignedIn, upsertRow, changedSince, selectRows, friendlyError } from './supabase';

type State = { online: boolean; syncing: boolean; pending: number; lastSync: number | null; error: string | null; configured: boolean; uid: string | null };
let state: State = { online: true, syncing: false, pending: 0, lastSync: null, error: null, configured: cloudConfigured, uid: null };
const subs = new Set<(s: State) => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f(state)); };

export function countPending() {
  const l = db.select({ n: sql<number>`count(*)` }).from(schema.listings).where(sql`${schema.listings.sync_status} != 'synced'`).get()?.n ?? 0;
  const r = db.select({ n: sql<number>`count(*)` }).from(schema.records).where(sql`${schema.records.sync_status} != 'synced'`).get()?.n ?? 0;
  const f = db.select({ n: sql<number>`count(*)` }).from(schema.farmers).where(sql`${schema.farmers.sync_status} != 'synced'`).get()?.n ?? 0;
  set({ pending: l + r + f });
}

const CURSOR = 'sync_cursor';
const getCursor = () => Number(db.select().from(schema.weather_cache).where(eq(schema.weather_cache.key, CURSOR)).get()?.json ?? 0);
const setCursor = (n: number) => db.insert(schema.weather_cache).values({ key: CURSOR, json: String(n), fetched_at: Date.now() }).onConflictDoUpdate({ target: schema.weather_cache.key, set: { json: String(n), fetched_at: Date.now() } }).run();

// The local file path and sync flag stay on the phone; the small base64 thumbnail (photo_b64) travels with the listing.
const strip = (row: any) => { const { photo_uri, sync_status, ...rest } = row; return row.deleted ? { ...rest, photo_b64: null } : rest; };
const LISTING_COLS = ['id', 'farmer_id', 'seller_name', 'crop_type', 'variety', 'quantity_kg', 'price_per_kg', 'unit', 'description', 'photo_b64', 'lat', 'lon', 'ward', 'district', 'province', 'phone', 'owner_uid', 'deleted', 'created_at', 'updated_at'];
const pickListing = (remote: any, local: any) => { const v: any = {}; for (const c of LISTING_COLS) v[c] = remote[c] ?? null; v.deleted = remote.deleted ? 1 : 0; v.photo_uri = local?.photo_uri ?? null; v.sync_status = 'synced'; return v; };
const nice = friendlyError;

export async function syncNow() {
  if (!cloudConfigured || !state.online || state.syncing) { countPending(); return; }
  set({ syncing: true, error: null });
  try {
    const { uid, token } = await ensureSignedIn();
    set({ uid });
    // ---- PUSH: every pending row, one HTTPS request each (clear errors, 15 s timeout) ----
    let firstFail: any = null;
    for (const t of ['farmers', 'listings', 'records'] as const) {
      const table: any = schema[t];
      const rows = db.select().from(table).where(sql`${table.sync_status} != 'synced'`).all() as any[];
      for (const row of rows) {
        try {
          // the farmer profile is stored in the cloud table `profiles`, keyed by the signed-in user id
          if (t === 'farmers') await upsertRow('profiles', { id: uid, farmer_id: row.id, name: row.name, phone: row.phone, province: row.province, district: row.district, ward: row.ward, farming_type: row.farming_type, updated_at: row.updated_at, synced_at: Date.now() }, token);
          else await upsertRow(t, { ...strip(row), owner_uid: uid, synced_at: Date.now() }, token);
          db.update(table).set({ sync_status: 'synced', owner_uid: uid }).where(eq(table.id, row.id)).run();
        } catch (e) {
          firstFail = firstFail ?? e;
          db.update(table).set({ sync_status: 'failed' }).where(eq(table.id, row.id)).run();
        }
      }
    }
    // ---- PULL: listings from everyone (incl. deletions) changed since the last sync ----
    let cursor = getCursor();
    for (let page = 0; page < 5; page++) {
      const docs = await changedSince('listings', cursor, token);
      for (const remote of docs) {
        const local = db.select().from(schema.listings).where(eq(schema.listings.id, remote.id)).get();
        if (!local || (remote.updated_at ?? 0) > local.updated_at) { // last-write-wins
          const vals = pickListing(remote, local);
          db.insert(schema.listings).values(vals).onConflictDoUpdate({ target: schema.listings.id, set: vals }).run();
        }
        cursor = Math.max(cursor, remote.synced_at ?? 0);
      }
      setCursor(cursor);
      if (docs.length < 200) break;
    }
    // ---- RESTORE: if this phone has no profile yet but the cloud knows this identity, bring the profile back ----
    if (!db.select().from(schema.farmers).limit(1).get()) {
      const [p] = await selectRows('profiles', `id=eq.${uid}`, token);
      if (p) db.insert(schema.farmers).values({ id: p.farmer_id ?? uid, name: p.name, phone: p.phone ?? '', province: p.province, district: p.district, ward: p.ward, farming_type: p.farming_type, sync_status: 'synced', owner_uid: uid, updated_at: p.updated_at ?? Date.now() }).run();
    }
    set({ lastSync: Date.now() });
    if (firstFail) set({ error: nice(firstFail) });
  } catch (e: any) {
    set({ error: nice(e) });
  } finally {
    set({ syncing: false });
    countPending();
  }
}

let started = false;
/**
 * Call once at app start. Syncing is automatic: whenever the phone gets (or regains) internet, when the app returns to the
 * foreground, and every 45 s while something is still waiting. Nothing needs to be tapped.
 */
export function startSync() {
  if (started) return; started = true;
  countPending();
  NetInfo.addEventListener((s) => {
    const online = !!(s.isConnected && s.isInternetReachable !== false);
    set({ online });
    if (online) syncNow();
  });
  AppState.addEventListener('change', (st) => { if (st === 'active') syncNow(); });
  setInterval(() => { if (state.online && (state.pending > 0 || state.error)) syncNow(); }, 45_000);
  syncNow();
}

export function useSync() {
  const [s, setS] = useState(state);
  useEffect(() => { subs.add(setS); setS(state); return () => { subs.delete(setS); }; }, []);
  return s;
}
