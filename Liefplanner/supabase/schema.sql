-- LifePlanner 7: eine Zeile JSON pro Gerät / Demo (id = 'default')
-- In Supabase: SQL Editor → New query → ausführen
-- Falls früher „liefplanner_payload“ genutzt wurde: alter table public.liefplanner_payload rename to lifeplanner_payload;
-- (Index- und Policy-Namen ggf. in Supabase neu setzen oder alte Policies droppen und dieses Skript anpassen.)

create table if not exists public.lifeplanner_payload (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists lifeplanner_payload_updated_at_idx on public.lifeplanner_payload (updated_at desc);

alter table public.lifeplanner_payload enable row level security;

drop policy if exists "lifeplanner_payload_anon_all" on public.lifeplanner_payload;

-- Demo: anonyme Clients dürfen lesen/schreiben. Für Produktion Policies anpassen (Auth, household_id, …).
create policy "lifeplanner_payload_anon_all"
  on public.lifeplanner_payload
  for all
  to anon
  using (true)
  with check (true);
