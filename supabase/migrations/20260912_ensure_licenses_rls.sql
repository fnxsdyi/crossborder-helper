-- TaxFlow Buyout: ensure licenses table + RLS (idempotent)
-- ---------------------------------------------------------------------------
-- WHY: The buyout flow unlocks premium by writing a row into `public.licenses`
--      (see src/lib/subscription.ts -> recordLicense / checkSubscriptionWithFallback).
--      The table was confirmed to EXIST in production (0 rows) via read-only API,
--      but its RLS + policies were NEVER created (the CREATE TABLE in
--      supabase-schema.sql is commented out). Without the policies below, a real
--      logged-in buyer's insert is rejected by RLS -> "paid but not unlocked".
-- RUN:  Once, in Supabase SQL Editor:
--      https://supabase.com/dashboard/project/vwqhsztsyycmfizyslbh/sql
-- SAFE: Idempotent (guards prevent duplicate table/policy). Re-runnable.
-- ---------------------------------------------------------------------------

-- (optional) print current state, then delete this block after checking:
-- select relname, relrowsecurity from pg_class where relname = 'licenses';
-- select * from pg_policies where tablename = 'licenses';

-- 1) Create table if missing (shape matches recordLicense insert: user_id, key, active)
create table if not exists public.licenses (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

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
