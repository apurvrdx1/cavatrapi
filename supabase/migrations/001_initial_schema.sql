-- ─── Cavatrapi initial schema ─────────────────────────────────────────────────
-- Auth: Clerk owns identity. Supabase Auth is DISABLED.
-- player.id = Clerk user ID (sub claim from JWT)

-- ─── players ──────────────────────────────────────────────────────────────────
create table if not exists players (
  id           text        primary key,  -- Clerk user ID
  username     text        not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ─── game_sessions ────────────────────────────────────────────────────────────
create table if not exists game_sessions (
  id              uuid        primary key default gen_random_uuid(),
  mode            text        not null check (mode in ('SUDDEN_DEATH', 'AREA_CONTROL')),
  p1_id           text        not null references players(id),
  p2_id           text        not null references players(id),
  winner_id       text        references players(id),  -- null = draw
  move_count      integer     not null default 0,
  duration_seconds integer,
  ended_at        timestamptz not null default now()
);

create index if not exists game_sessions_p1_idx on game_sessions(p1_id);
create index if not exists game_sessions_p2_idx on game_sessions(p2_id);

-- ─── player_stats ─────────────────────────────────────────────────────────────
-- Denormalized stats per player per mode, updated on each game_session write.
create table if not exists player_stats (
  player_id   text   not null references players(id),
  mode        text   not null check (mode in ('SUDDEN_DEATH', 'AREA_CONTROL')),
  wins        integer not null default 0,
  losses      integer not null default 0,
  draws       integer not null default 0,
  primary key (player_id, mode)
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
-- Server uses service role key — bypasses RLS entirely.
-- Client (future): read-only access to own player + stats.

alter table players enable row level security;
alter table game_sessions enable row level security;
alter table player_stats enable row level security;

-- Players can read their own row
create policy "players: self read"
  on players for select
  using (id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Players can read their own stats
create policy "player_stats: self read"
  on player_stats for select
  using (player_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Players can read game sessions they participated in
create policy "game_sessions: participant read"
  on game_sessions for select
  using (
    p1_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    or p2_id = (current_setting('request.jwt.claims', true)::json->>'sub')
  );

-- ─── increment_player_stats RPC ──────────────────────────────────────────────
-- Atomic upsert + increment for player stats. Called from the server after each game.
create or replace function increment_player_stats(
  p_player_id text,
  p_mode      text,
  p_wins      integer,
  p_losses    integer,
  p_draws     integer
) returns void language plpgsql as $$
begin
  insert into player_stats (player_id, mode, wins, losses, draws)
  values (p_player_id, p_mode, p_wins, p_losses, p_draws)
  on conflict (player_id, mode) do update
    set wins   = player_stats.wins   + excluded.wins,
        losses = player_stats.losses + excluded.losses,
        draws  = player_stats.draws  + excluded.draws;
end;
$$;

-- ─── updated_at trigger ───────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_updated_at
  before update on players
  for each row execute function set_updated_at();
