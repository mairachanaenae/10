-- The Investor's Command Center — initial schema (Supabase / Postgres).
-- Per-user rows, gated by Clerk JWT (auth.jwt() ->> 'sub' is the Clerk user id).
-- Apply in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists vector;

create table if not exists profiles (
  user_id text primary key,
  display_name text,
  currency text not null default 'NOK',
  freedom_target numeric not null default 100000,
  created_at timestamptz not null default now()
);

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  symbol text not null,
  name text not null,
  shares numeric not null default 0,
  value numeric not null default 0,
  day_gain numeric not null default 0,
  day_pct numeric not null default 0,
  asset_class text not null default 'Stock',
  -- optional dividend metrics for the safety score
  payout numeric, de numeric, years int, yield numeric,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  icon text,
  current numeric not null default 0,
  target numeric not null default 0,
  forecast text,
  unit text
);

create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  agent text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table if not exists agent_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references agent_runs(id) on delete cascade,
  ts timestamptz not null default now(),
  who text not null,
  text text not null
);

create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- Row-level security: a user only sees their own rows (Clerk sub == user_id).
alter table profiles    enable row level security;
alter table holdings    enable row level security;
alter table goals       enable row level security;
alter table agent_runs  enable row level security;
alter table agent_events enable row level security;
alter table agent_memory enable row level security;

create policy "own profile"   on profiles    using (user_id = auth.jwt() ->> 'sub');
create policy "own holdings"  on holdings     using (user_id = auth.jwt() ->> 'sub') with check (user_id = auth.jwt() ->> 'sub');
create policy "own goals"     on goals        using (user_id = auth.jwt() ->> 'sub') with check (user_id = auth.jwt() ->> 'sub');
create policy "own runs"      on agent_runs   using (user_id = auth.jwt() ->> 'sub') with check (user_id = auth.jwt() ->> 'sub');
create policy "own memory"    on agent_memory using (user_id = auth.jwt() ->> 'sub') with check (user_id = auth.jwt() ->> 'sub');
create policy "own events"    on agent_events using (
  run_id in (select id from agent_runs where user_id = auth.jwt() ->> 'sub')
);
