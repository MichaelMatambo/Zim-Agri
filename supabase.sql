-- ZimAgri cloud backup: run ONCE in Supabase > SQL Editor > New query > Run.
-- Tables mirror the phone's SQLite tables. Row-level security: any signed-in (anonymous) user can read marketplace
-- listings, only the owner can add/change their own rows; farm records are private to their owner. Nothing is hard-deleted
-- (deleted = 1) so deletions can sync to other phones.

create table if not exists public.listings (
  id text primary key,
  farmer_id text, seller_name text,
  crop_type text not null, variety text,
  quantity_kg double precision not null, price_per_kg double precision not null,
  unit text default 'kg', description text, photo_b64 text,
  lat double precision, lon double precision,
  ward text, district text, province text, phone text,
  owner_uid uuid not null,
  deleted integer not null default 0,
  created_at bigint, updated_at bigint not null, synced_at bigint not null
);

create table if not exists public.records (
  id text primary key,
  farmer_id text,
  crop text not null, variety text, planting_date text,
  area_ha double precision default 0,
  seed_cost double precision default 0, fert_cost double precision default 0, labour_cost double precision default 0,
  harvest_date text, yield_kg double precision default 0, sale_price_per_kg double precision default 0, notes text,
  owner_uid uuid not null,
  deleted integer not null default 0,
  updated_at bigint not null, synced_at bigint not null
);

create table if not exists public.profiles (
  id uuid primary key,            -- the signed-in (anonymous) user id: the app remembers who it is
  farmer_id text,
  name text not null, phone text,
  province text, district text, ward text, farming_type text,
  updated_at bigint not null, synced_at bigint not null
);

create index if not exists listings_synced_at_idx on public.listings (synced_at);

alter table public.listings enable row level security;
alter table public.records  enable row level security;
alter table public.profiles enable row level security;

grant select, insert, update on public.listings to authenticated;
grant select, insert, update on public.records  to authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "listings readable"   on public.listings;
drop policy if exists "listings insert own" on public.listings;
drop policy if exists "listings update own" on public.listings;
create policy "listings readable"   on public.listings for select to authenticated using (true);
create policy "listings insert own" on public.listings for insert to authenticated with check (owner_uid = (select auth.uid()));
create policy "listings update own" on public.listings for update to authenticated using (owner_uid = (select auth.uid())) with check (owner_uid = (select auth.uid()));

drop policy if exists "records read own"   on public.records;
drop policy if exists "records insert own" on public.records;
drop policy if exists "records update own" on public.records;
create policy "records read own"   on public.records for select to authenticated using (owner_uid = (select auth.uid()));
create policy "records insert own" on public.records for insert to authenticated with check (owner_uid = (select auth.uid()));
create policy "records update own" on public.records for update to authenticated using (owner_uid = (select auth.uid())) with check (owner_uid = (select auth.uid()));

drop policy if exists "profiles read own"   on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles read own"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
