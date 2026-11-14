-- Upscale schema. Run in Supabase → SQL editor (or `supabase db push`).
-- Players are Supabase auth users (anonymous guests included).
-- Money rows are written only by the server (service role) after Stripe confirms
-- a TEST-MODE payment; users can read their own rows but never write them.

create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  adult_confirmed_at timestamptz,
  self_excluded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type text not null check (type in ('kickstarter')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  commission_rate numeric(4, 3) not null default 0.15,
  rollover_cents integer not null default 0, -- bank carried over when nobody wins
  created_at timestamptz not null default now()
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  kind text not null check (kind in ('quick-baseline', 'baseline', 'daily', 'exam')),
  topic text not null,
  phrase text,
  transcript text not null, -- transcripts and metrics only, never audio or video
  metrics jsonb not null,
  flags jsonb not null default '{}',
  rating_before integer,
  rating_after integer,
  created_at timestamptz not null default now()
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id),
  player_id uuid not null references public.players (id) on delete cascade,
  stake_cents integer not null check (stake_cents in (5000, 10000, 25000)),
  goal jsonb not null,
  baseline jsonb not null,
  status text not null default 'active' check (status in ('active', 'won', 'lost', 'appeal_review')),
  payout_cents integer,
  stripe_session_id text not null unique, -- makes confirmation idempotent
  created_at timestamptz not null default now()
);

create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  kind text not null check (kind in ('stake_in', 'card_fee', 'payout', 'commission', 'rollover')),
  amount_cents integer not null,
  test_mode boolean not null default true check (test_mode), -- this product never moves real money
  created_at timestamptz not null default now()
);

create table public.rating_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  attempt_id uuid references public.attempts (id) on delete set null,
  rating integer not null,
  created_at timestamptz not null default now()
);

create table public.simulated_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  display_name text not null,
  stake_cents integer not null,
  outcome text not null check (outcome in ('on_track', 'behind', 'quit')),
  created_at timestamptz not null default now()
);

create table public.reminders (
  player_id uuid primary key references public.players (id) on delete cascade,
  enabled boolean not null default false,
  local_time time not null default '19:00',
  updated_at timestamptz not null default now()
);

create index on public.attempts (player_id, created_at desc);
create index on public.entries (player_id);
create index on public.ledger (entry_id);
create index on public.rating_history (player_id, created_at);

-- Row-level security: each player sees only their own data.
alter table public.players enable row level security;
alter table public.games enable row level security;
alter table public.attempts enable row level security;
alter table public.entries enable row level security;
alter table public.ledger enable row level security;
alter table public.rating_history enable row level security;
alter table public.simulated_players enable row level security;
alter table public.reminders enable row level security;

create policy "own player row" on public.players for select using (id = auth.uid());
create policy "create own player row" on public.players for insert with check (id = auth.uid());

create policy "games are public" on public.games for select using (true);
create policy "simulated pool is public" on public.simulated_players for select using (true);

create policy "read own attempts" on public.attempts for select using (player_id = auth.uid());
create policy "add own attempts" on public.attempts for insert with check (player_id = auth.uid());

create policy "read own entries" on public.entries for select using (player_id = auth.uid());
create policy "read own ledger" on public.ledger for select
  using (exists (select 1 from public.entries e where e.id = entry_id and e.player_id = auth.uid()));

create policy "read own rating" on public.rating_history for select using (player_id = auth.uid());
create policy "add own rating" on public.rating_history for insert with check (player_id = auth.uid());

create policy "own reminders" on public.reminders for all
  using (player_id = auth.uid()) with check (player_id = auth.uid());

-- The current open Kickstarter game.
insert into public.games (slug, type, starts_at, ends_at, commission_rate)
values ('kickstarter-2026-11', 'kickstarter', '2026-11-14', '2026-12-14', 0.15);
