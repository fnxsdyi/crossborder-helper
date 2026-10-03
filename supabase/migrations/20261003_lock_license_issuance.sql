-- TF-02: lock license issuance to server-side (webhook, PR #12) only.
-- ---------------------------------------------------------------------------
-- WHY: Before this, the "insert own license" RLS policy let ANY authenticated
--      user insert a license row for themselves (active=true) via the anon/
--      authenticated Supabase client — i.e. free self-unlock ("fake unlock").
--      The webhook (PR #12) now issues buyout licenses server-side via the
--      service-role key, which BYPASSES RLS entirely, so client inserts are no
--      longer needed and must be disabled.
--
-- DEPENDS ON: PR #12 (webhook server-side issuance) must be MERGED and DEPLOYED
--      before this migration is run, otherwise no license is ever issued and
--      buyers cannot unlock.
--
-- SAFE: Idempotent (drop policy if exists + recreate). Re-runnable.
-- RUN:  Once, in Supabase SQL Editor, AFTER PR #12 is live:
--      https://supabase.com/dashboard/project/vwqhsztsyycmfizyslbh/sql
-- ---------------------------------------------------------------------------

-- 1) Disable client-side inserts: replace the permissive policy with a deny.
drop policy if exists "insert own license" on public.licenses;
create policy "no client insert" on public.licenses
  for insert to authenticated
  with check (false);

-- 2) Preserve read access for premium checks (checkSubscriptionWithFallback).
drop policy if exists "select own license" on public.licenses;
create policy "select own license" on public.licenses
  for select to authenticated
  using (auth.uid() = user_id);
