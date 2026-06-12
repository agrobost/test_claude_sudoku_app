-- Schéma initial — voir docs/ARCHITECTURE.md.
-- Toute évolution passe par une nouvelle migration (jamais de DDL manuel).

-- ============ Types ============
create type public.difficulty  as enum ('easy', 'medium', 'hard', 'expert');
create type public.game_mode   as enum ('classic', 'daily');
create type public.game_result as enum ('won', 'lost');

-- ============ puzzles : pool pré-généré (écrit uniquement par le seed, service role) ============
create table public.puzzles (
  id            uuid primary key default gen_random_uuid(),
  givens        char(81) not null check (givens   ~ '^[0-9]{81}$'), -- '0' = case vide
  solution      char(81) not null check (solution ~ '^[1-9]{81}$'),
  difficulty    public.difficulty not null,
  max_technique text not null,            -- technique la plus dure requise (sortie du grader)
  created_at    timestamptz not null default now()
);
create index puzzles_difficulty_idx on public.puzzles (difficulty);

-- ============ daily_puzzles : affectation date → grille (seedée ≥ 90 jours d'avance) ============
create table public.daily_puzzles (
  daily_date date primary key,
  puzzle_id  uuid not null unique references public.puzzles (id)
);

-- ============ profiles : 1-1 avec auth.users (indirection recommandée par Supabase) ============
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ games : journal append-only des parties terminées ============
create table public.games (
  id          uuid primary key,            -- généré CÔTÉ CLIENT → sync idempotente
  user_id     uuid not null references public.profiles (id) on delete cascade,
  puzzle_id   uuid not null references public.puzzles (id),
  mode        public.game_mode not null,
  daily_date  date,                        -- date LOCALE du joueur pour un daily
  difficulty  public.difficulty not null,  -- dénormalisé : stats sans join
  result      public.game_result not null,
  duration_ms integer  not null check (duration_ms > 0),
  mistakes    smallint not null default 0 check (mistakes between 0 and 3),
  hints_used  smallint not null default 0 check (hints_used >= 0),
  finished_at timestamptz not null default now(),
  check ((mode = 'daily') = (daily_date is not null))
);
create index games_user_idx  on public.games (user_id, finished_at desc);
create index games_daily_idx on public.games (daily_date) where daily_date is not null;
-- une seule victoire daily par joueur et par date (un re-sync de doublon est rejeté/ignoré)
create unique index games_one_daily_win_uq
  on public.games (user_id, daily_date)
  where daily_date is not null and result = 'won';

-- ============ GRANTS : privilèges de table pour le rôle authenticated ============
-- Explicites (on ne dépend PAS de l'auto-grant des default privileges Supabase,
-- qui varie selon la version de la CLI / le rôle créateur de la migration).
-- Les sessions anonymes ont le rôle `authenticated` ; `anon` (sans session) n'a
-- aucun accès à ces tables. La RLS ci-dessous filtre les lignes PAR-DESSUS ces grants.
-- games volontairement sans UPDATE/DELETE : le journal est append-only.
grant usage on schema public to authenticated;
grant select         on public.puzzles       to authenticated;
grant select         on public.daily_puzzles to authenticated;
grant select         on public.profiles      to authenticated;
grant select, insert on public.games         to authenticated;

-- ============ RLS : activée PARTOUT, default deny ============
alter table public.puzzles       enable row level security;
alter table public.daily_puzzles enable row level security;
alter table public.profiles      enable row level security;
alter table public.games         enable row level security;

-- puzzles : lecture pour tout utilisateur connecté (les anonymes ont le rôle authenticated) ;
-- aucune politique d'écriture → écritures client impossibles.
create policy "puzzles_select" on public.puzzles
  for select to authenticated
  using (true);

-- daily_puzzles : pas de lecture des grilles futures.
-- Tolérance « + 1 jour » : le daily est indexé sur la DATE LOCALE du joueur ;
-- un fuseau en avance (UTC+1…+14) atteint sa date locale avant minuit UTC.
create policy "daily_select_no_future" on public.daily_puzzles
  for select to authenticated
  using (daily_date <= (now() at time zone 'utc')::date + 1);

-- profiles : chacun voit la sienne (créée par trigger ; ni update ni delete client).
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- games : chacun lit et insère SES parties ; ni update ni delete (journal immuable,
-- l'effacement passe par la suppression de compte → cascade).
create policy "games_select_own" on public.games
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "games_insert_own" on public.games
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ============ RPC ============

-- Percentile du daily : « plus rapide que X % des joueurs » (premières victoires).
-- SECURITY DEFINER : agrège les parties des AUTRES sans exposer leurs lignes.
-- Le champ de comparaison exclut l'appelant et les durées < 30 s (anti-bruit).
create function public.get_daily_percentile(p_date date)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select duration_ms from public.games
    where user_id = (select auth.uid()) and daily_date = p_date and result = 'won'
  ),
  field as (
    select g.duration_ms from public.games g
    where g.daily_date = p_date
      and g.result = 'won'
      and g.duration_ms >= 30000
      and g.user_id <> (select auth.uid())
  )
  select case
    when not exists (select 1 from mine) then null
    else round(
      100.0 * (select count(*) from field f
               where f.duration_ms >= (select duration_ms from mine))
      / greatest((select count(*) from field), 1)
    )
  end;
$$;

-- Recharge du cache local : grilles jamais jouées par l'appelant, hors grilles
-- réservées au daily. SECURITY INVOKER : la RLS s'applique normalement.
create function public.fetch_unplayed_puzzles(p_difficulty public.difficulty, p_count int default 20)
returns setof public.puzzles
language sql
stable
set search_path = ''
as $$
  select p.* from public.puzzles p
  where p.difficulty = p_difficulty
    and not exists (select 1 from public.daily_puzzles d where d.puzzle_id = p.id)
    and not exists (
      select 1 from public.games g
      where g.user_id = (select auth.uid()) and g.puzzle_id = p.id
    )
  order by random()  -- acceptable à l'échelle v1 (pool de quelques milliers de lignes)
  limit least(greatest(p_count, 1), 50);
$$;

-- Exécution réservée aux sessions authentifiées.
revoke execute on function public.get_daily_percentile(date)                     from public, anon;
revoke execute on function public.fetch_unplayed_puzzles(public.difficulty, int) from public, anon;
grant  execute on function public.get_daily_percentile(date)                     to authenticated;
grant  execute on function public.fetch_unplayed_puzzles(public.difficulty, int) to authenticated;
