import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export type SyncStatus = 'pending' | 'synced' | 'failed';

// Local farmer profile (single row on this device)
export const farmers = sqliteTable('farmers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  district: text('district'),
  ward: text('ward'),
  province: text('province'),
  farming_type: text('farming_type'),
  sync_status: text('sync_status').$type<SyncStatus>().notNull().default('pending'),
  owner_uid: text('owner_uid'), // cloud identity (anonymous user id) this profile belongs to
  updated_at: integer('updated_at').notNull(),
});

// Marketplace listings. SQLite is the source of truth; sync_status tracks cloud backup.
export const listings = sqliteTable('listings', {
  id: text('id').primaryKey(),
  farmer_id: text('farmer_id').notNull(),
  seller_name: text('seller_name'),
  crop_type: text('crop_type').notNull(),
  variety: text('variety'),
  quantity_kg: real('quantity_kg').notNull(),
  price_per_kg: real('price_per_kg').notNull(),
  unit: text('unit').notNull().default('kg'),
  description: text('description'),
  photo_uri: text('photo_uri'),
  photo_b64: text('photo_b64'), // small JPEG thumbnail (base64) that travels with the listing when syncing
  lat: real('lat'),
  lon: real('lon'),
  ward: text('ward'),
  district: text('district'),
  province: text('province'),
  phone: text('phone').notNull(),
  sync_status: text('sync_status').$type<SyncStatus>().notNull().default('pending'),
  owner_uid: text('owner_uid'), // Firebase anonymous uid, set when the row is first pushed
  deleted: integer('deleted').notNull().default(0), // soft delete so deletions can sync
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

// Farm records (planting → harvest) with costs for the profit calculator
export const records = sqliteTable('records', {
  id: text('id').primaryKey(),
  farmer_id: text('farmer_id').notNull(),
  crop: text('crop').notNull(),
  variety: text('variety'),
  planting_date: text('planting_date'),
  area_ha: real('area_ha').notNull().default(0),
  seed_cost: real('seed_cost').notNull().default(0),
  fert_cost: real('fert_cost').notNull().default(0),
  labour_cost: real('labour_cost').notNull().default(0),
  harvest_date: text('harvest_date'),
  yield_kg: real('yield_kg').notNull().default(0),
  sale_price_per_kg: real('sale_price_per_kg').notNull().default(0),
  notes: text('notes'),
  sync_status: text('sync_status').$type<SyncStatus>().notNull().default('pending'),
  owner_uid: text('owner_uid'),
  deleted: integer('deleted').notNull().default(0),
  updated_at: integer('updated_at').notNull(),
});

export const info_articles = sqliteTable('info_articles', {
  id: text('id').primaryKey(),
  crop: text('crop').notNull(),
  topic: text('topic').notNull(),
  title: text('title').notNull(),
  body_md: text('body_md').notNull(),
});

// Key/value cache for the last OpenWeather response (also stores sync cursor)
export const weather_cache = sqliteTable('weather_cache', {
  key: text('key').primaryKey(),
  json: text('json').notNull(),
  fetched_at: integer('fetched_at').notNull(),
});
