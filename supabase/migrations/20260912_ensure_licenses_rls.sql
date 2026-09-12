-- TaxFlow Buyout: ensure licenses table shape + RLS (idempotent)
-- ---------------------------------------------------------------------------
-- WHY: The buyout flow unlocks premium by writing a row into `public.licenses`
--      (see src/lib/subscription.ts -> recordLicense / checkSubscriptionWithFallback).
--      recordLicense inserts {user_id, key, active}; checkSubscriptionWithFallback
--      filters by .eq('active', true). Both columns MUST exist.
--
--      IMPORTANT: production `licenses` was created manually long ago with a
--      BROKEN shape — read-only probing (2026-09-12) found it has ONLY
--      id / user_id / created_at. `key` and `active` are MISSING. The original
--      CREATE TABLE is commented out in supabase-schema.sql, so it was never
--      applied. A real buyer's insert would fail with "column does not exist"
--      -> "paid but not unlocked". The ALTER below patches the live table.
-- RUN:  Once, in Supabase SQL Editor:
--      https://supabase.com/dashboard/project/vwqhsztsyycmfizyslbh/sql
-- SAFE: Idempotent (guards prevent duplicate table/policy/column). Re-runnable.
-- ---------------------------------------------------------------------------

-- 1) Create table only if it does NOT exist (skipped when already present)
create table if not exists public.licenses (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- 1b) Patch the live table: add any columns the broken manual table is missing.
--     add column if not exists is a no-op for columns that already exist.
alter table if exists public.licenses
  add column if not exists key text not null default '',
  add column if not exists active boolean not null default true;

-- 2) Enable Row Level Security
alter table public.licenses enable row level security;

-- 3) Authenticated users may INSERT their OWN license (buyout unlock core permission)
drop policy if exists "insert own license" on public.licenses;
create policy "insert own license"
  on public.licenses for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 4) Authenticated users may READ their OWN license (premium check in checkSubscriptionWithFallback)
drop policy if exists "select own license" on public.licenses;
create policy "select own license"
  on public.licenses for select
  to authenticated
  using (auth.uid() = user_id);
