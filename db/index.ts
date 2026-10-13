import { openDatabaseSync } from 'expo-sqlite/next';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { seedArticles } from './seed';

const sqlite = openDatabaseSync('zimagri.db');
export const db = drizzle(sqlite, { schema });
export { schema };

// Create tables on first launch (idempotent). Kept as plain SQL so no migration step is needed in Expo Go.
export function initDb() {
  sqlite.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS farmers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, district TEXT, ward TEXT, province TEXT, farming_type TEXT, sync_status TEXT NOT NULL DEFAULT 'pending', owner_uid TEXT, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS listings (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, seller_name TEXT, crop_type TEXT NOT NULL, variety TEXT, quantity_kg REAL NOT NULL, price_per_kg REAL NOT NULL, unit TEXT NOT NULL DEFAULT 'kg', description TEXT, photo_uri TEXT, photo_b64 TEXT, lat REAL, lon REAL, ward TEXT, district TEXT, province TEXT, phone TEXT NOT NULL, sync_status TEXT NOT NULL DEFAULT 'pending', owner_uid TEXT, deleted INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, farmer_id TEXT NOT NULL, crop TEXT NOT NULL, variety TEXT, planting_date TEXT, area_ha REAL NOT NULL DEFAULT 0, seed_cost REAL NOT NULL DEFAULT 0, fert_cost REAL NOT NULL DEFAULT 0, labour_cost REAL NOT NULL DEFAULT 0, harvest_date TEXT, yield_kg REAL NOT NULL DEFAULT 0, sale_price_per_kg REAL NOT NULL DEFAULT 0, notes TEXT, sync_status TEXT NOT NULL DEFAULT 'pending', owner_uid TEXT, deleted INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS info_articles (id TEXT PRIMARY KEY, crop TEXT NOT NULL, topic TEXT NOT NULL, title TEXT NOT NULL, body_md TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS weather_cache (key TEXT PRIMARY KEY, json TEXT NOT NULL, fetched_at INTEGER NOT NULL);
  `);
  // databases created by an earlier build do not have the photo column yet
  for (const q of ['ALTER TABLE listings ADD COLUMN photo_b64 TEXT', 'ALTER TABLE listings ADD COLUMN owner_uid TEXT', 'ALTER TABLE listings ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0', 'ALTER TABLE records ADD COLUMN owner_uid TEXT', 'ALTER TABLE records ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0', "ALTER TABLE farmers ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'pending'", 'ALTER TABLE farmers ADD COLUMN owner_uid TEXT']) { try { sqlite.execSync(q); } catch {} }
  seedArticles(db);
}

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
