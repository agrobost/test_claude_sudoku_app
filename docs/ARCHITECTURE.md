# ARCHITECTURE — sudoku-app

> Version 1.0 — 2026-06-11. Périmètre : voir [PRD.md](./PRD.md). Conventions : voir [CLAUDE.md](../CLAUDE.md).

## 1. Vue d'ensemble

```
┌────────────────────────── App Expo (iOS/Android) ──────────────────────────┐
│  UI (expo-router) ── stores Zustand ── TanStack Query ── outbox sync       │
│        │                    │                                │              │
│  src/engine (TS pur) : solveur, techniques, indices          │              │
│  MMKV : partie en cours, réglages, quotas, pack grilles, file outbox       │
│  SDK natifs : AppLovin MAX · Firebase Analytics/Crashlytics · RevenueCat   │
└──────────────┬──────────────────────────────────────────────┬──────────────┘
               │ supabase-js (anon session JWT)               │ stores (IAP)
┌──────────────▼──────────────────────────────┐   ┌───────────▼─────────────┐
│ Supabase : Auth (anonymous + Apple/Google)  │   │ App Store / Play        │
│ Postgres + RLS : puzzles, dailies, games    │   │ (RevenueCat par-dessus) │
│ RPC : percentile, unplayed · Edge: delete   │   └─────────────────────────┘
└──────────────▲──────────────────────────────┘
               │ seed (service role, CI)
        scripts/generate-puzzles : génération + calibrage par techniques
```

Principes :
- **Offline-first** : tout le gameplay fonctionne sans réseau ; le serveur sert
  des données (grilles, daily, percentile) et archive des résultats. Aucune
  écriture serveur n'est bloquante pour l'UX.
- **Le client ne génère jamais de grilles** ; il les **résout** (validation,
  erreurs, indices pédagogiques) via `src/engine`, du TypeScript pur sans
  dépendance React Native — testable à 100 %.
- **Écritures append-only** : un résultat de partie est immuable → la sync est
  un upsert idempotent, zéro conflit à résoudre.

## 2. Stack et bibliothèques

| Rôle | Choix | Notes |
|---|---|---|
| Framework | Expo (dernier SDK stable au bootstrap) + React Native | **Dev build EAS obligatoire** (Expo Go impossible : MAX, Firebase, MMKV, RevenueCat) |
| Langage | TypeScript `strict` | Interdits : voir CLAUDE.md |
| Navigation | expo-router (typed routes) | |
| État client | Zustand (+ middleware persist→MMKV) | Stores petits, par feature |
| État serveur | TanStack Query | Cache, retries, `networkMode: 'offlineFirst'` |
| Stockage local | react-native-mmkv | Synchrone, rapide |
| Backend | Supabase : Auth, Postgres + RLS | Storage **non utilisé en v1** |
| Pub | react-native-applovin-max | Vérifier compat New Architecture au bootstrap |
| IAP | RevenueCat (react-native-purchases) | Reçus, restore, entitlement `no_ads` ; alternative écartée : expo-iap (validation de reçus à notre charge) |
| Analytics/Crash | @react-native-firebase/analytics + crashlytics | Consent Mode : rien ne part avant consentement |
| Consentement | CMP certifiée TCF v2.2 intégrée selon la doc MAX (Google UMP) + ATT iOS | |
| Notifications | expo-notifications (locales uniquement) | Permission POST_NOTIFICATIONS (Android 13+) |
| i18n | i18next + expo-localization | FR + EN, clés typées |
| Réseau | @react-native-community/netinfo | Déclencheur de la sync outbox |
| Tests | Jest (preset jest-expo) | E2E hors scope v1 |

## 3. Schéma SQL Supabase (migration `0001_init.sql`)

```sql
-- ============ Types ============
create type public.difficulty  as enum ('easy', 'medium', 'hard', 'expert');
create type public.game_mode   as enum ('classic', 'daily');
create type public.game_result as enum ('won', 'lost');

-- ============ puzzles : pool pré-généré (écrit uniquement par le seed CI) ============
create table public.puzzles (
  id            uuid primary key default gen_random_uuid(),
  givens        char(81) not null check (givens   ~ '^[0-9]{81}$'), -- '0' = case vide
  solution      char(81) not null check (solution ~ '^[1-9]{81}$'),
  difficulty    public.difficulty not null,
  max_technique text not null,            -- technique la plus dure requise (sortie du grader)
  created_at    timestamptz not null default now()
);
create index puzzles_difficulty_idx on public.puzzles (difficulty);

-- ============ daily_puzzles : affectation date → grille (≥ 90 jours d'avance) ============
create table public.daily_puzzles (
  daily_date date primary key,
  puzzle_id  uuid not null unique references public.puzzles (id)
);

-- ============ profiles : 1-1 avec auth.users (indirection recommandée Supabase) ============
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

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
-- une seule victoire daily par joueur et par date (le re-sync d'un doublon est ignoré)
create unique index games_one_daily_win_uq
  on public.games (user_id, daily_date)
  where daily_date is not null and result = 'won';
```

### Politiques RLS

RLS activée sur **toutes** les tables. Les clients n'ont **aucun** droit
d'écriture sur `puzzles` / `daily_puzzles` (seed via service role uniquement),
et `games` est en insertion seule (journal immuable ; l'effacement passe par la
suppression de compte → cascade).

```sql
alter table public.puzzles       enable row level security;
alter table public.daily_puzzles enable row level security;
alter table public.profiles      enable row level security;
alter table public.games         enable row level security;

-- puzzles : lecture libre pour tout utilisateur connecté (les anonymes ont le rôle authenticated)
create policy "puzzles_select" on public.puzzles
  for select to authenticated using (true);

-- daily_puzzles : pas de lecture des grilles futures.
-- +1 jour : le daily est indexé sur la DATE LOCALE du joueur ; un fuseau en avance
-- (UTC+2…+14) atteint sa date locale avant minuit UTC.
create policy "daily_select_no_future" on public.daily_puzzles
  for select to authenticated
  using (daily_date <= (now() at time zone 'utc')::date + 1);

-- profiles : chacun voit la sienne (créée par trigger, ni update ni delete client)
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

-- games : chacun lit et insère SES parties ; ni update ni delete
create policy "games_select_own" on public.games
  for select to authenticated using (user_id = (select auth.uid()));
create policy "games_insert_own" on public.games
  for insert to authenticated with check (user_id = (select auth.uid()));
```

### Fonctions RPC

```sql
-- Percentile du daily : « plus rapide que X % des joueurs ».
-- SECURITY DEFINER : agrège les parties des AUTRES sans exposer leurs lignes (RLS).
create function public.get_daily_percentile(p_date date)
returns numeric language sql stable security definer set search_path = public as $$
  with mine as (
    select duration_ms from public.games
    where user_id = (select auth.uid()) and daily_date = p_date and result = 'won'
  ),
  field as (
    select duration_ms from public.games
    where daily_date = p_date and result = 'won'
      and duration_ms >= 30000              -- anti-bruit : victoires < 30 s exclues
  )
  select case
    when not exists (select 1 from mine) then null
    else round(100.0 * (select count(*) from field f
                        where f.duration_ms >= (select duration_ms from mine))
               / greatest((select count(*) from field), 1))
  end;
$$;

-- Recharge du cache local : grilles jamais jouées par l'appelant, hors grilles réservées au daily.
-- SECURITY INVOKER : la RLS s'applique (puzzles lisibles, games limitées aux siennes).
create function public.fetch_unplayed_puzzles(p_difficulty public.difficulty, p_count int default 20)
returns setof public.puzzles language sql stable as $$
  select p.* from public.puzzles p
  where p.difficulty = p_difficulty
    and not exists (select 1 from public.daily_puzzles d where d.puzzle_id = p.id)
    and not exists (select 1 from public.games g
                    where g.user_id = (select auth.uid()) and g.puzzle_id = p.id)
  order by random()                          -- acceptable à l'échelle v1 (pool ~10k lignes)
  limit least(greatest(p_count, 1), 50);
$$;

-- Verrouillage : exécution réservée aux sessions authentifiées
revoke execute on function public.get_daily_percentile(date)                      from public, anon;
revoke execute on function public.fetch_unplayed_puzzles(public.difficulty, int)  from public, anon;
grant  execute on function public.get_daily_percentile(date)                      to authenticated;
grant  execute on function public.fetch_unplayed_puzzles(public.difficulty, int)  to authenticated;
```

### Edge Function `delete-account` (RGPD)

Le client ne peut pas supprimer son propre `auth.users`. Contrat :
`POST /functions/v1/delete-account` avec le JWT de l'utilisateur → la fonction
vérifie le JWT, appelle `auth.admin.deleteUser(uid)` (service role) → cascade
`profiles` → `games`. Réponse 204. Le client purge ensuite MMKV et redémarre
une session anonyme.

### Configuration Auth

- Anonymous sign-ins **activés** ; providers **Apple** et **Google** pour la
  liaison (`linkIdentity` sur la session anonyme → même `uid`, zéro migration de données).
- Maintenance (hors v1, à planifier) : purge des users anonymes sans `games`
  et inactifs > 90 jours.

### Sémantique du « jour »

Le daily est indexé sur la **date locale du device** (comme Wordle : chacun
bascule à son minuit, tout le monde a la même grille pour une date calendaire
donnée). Conséquences : la RLS autorise UTC+1 jour ; streak, quota d'indices et
notifications raisonnent tous en date locale ; le percentile compare les joueurs
d'une même date calendaire.

## 4. Navigation (expo-router)

```
app/
  _layout.tsx                 # Providers (Query, i18n, thème) + bootstrap (auth anonyme, consent gate)
  (tabs)/
    _layout.tsx               # Tab bar
    index.tsx                 # Accueil
    daily.tsx                 # Calendrier du défi du jour
    stats.tsx                 # Statistiques
    settings.tsx              # Réglages
  game/[gameId].tsx           # Écran de jeu (stack plein écran, header custom)
  paywall.tsx                 # Modale « Sans pub »
  legal/privacy.tsx           # Politique de confidentialité
  legal/about.tsx             # À propos / licences
```

La fin de partie est un **overlay dans l'écran de jeu** (pas une route) : l'état
de la partie reste monté pour la continuation rewarded.

## 5. Arborescence par feature

```
src/
  engine/                 # TS PUR — aucun import react/react-native/expo
    sudoku/               # types Grid/Cell, parse/serialize(81 chars), contraintes
    solver/               # backtracking + comptage de solutions (unicité)
    techniques/           # 1 fichier = 1 technique (nakedSingle, hiddenSingle,
                          #   nakedPair, hiddenPair, pointingPair, claiming)
    hints/                # findHint orchestrateur gradué + fallback revealCell
  features/
    game/                 # Board, pavé, notes, chrono, useGameStore, overlay fin de partie
    puzzles/              # pack embarqué, cache MMKV, refill (fetch_unplayed_puzzles)
    daily/                # query daily, calendrier, streak (logique pure + tests), percentile, partage
    stats/                # agrégats locaux + écran
    auth/                 # bootstrap anonyme, liaison Apple/Google, suppression de compte
    monetization/         # ads.ts (wrapper MAX), iap.ts (RevenueCat), gates.ts (logique PURE
                          #   de cap/fréquence), hintQuota.ts (3/jour, date locale)
    consent/              # orchestration ATT → CMP → init SDKs
    notifications/        # scheduling local (rappel daily, alerte streak)
  lib/                    # supabase.ts, mmkv.ts, i18n.ts, analytics.ts (façade typée), dates.ts
  components/             # primitives UI partagées (Button, Sheet, …)
  theme/                  # tokens (couleurs, espacements, typo), clair/sombre
supabase/
  migrations/             # SQL ci-dessus
  functions/delete-account/
scripts/
  generate-puzzles/       # générateur + grader (réutilise src/engine) → seed.sql + pack JSON
assets/puzzles/pack.json  # ~240 grilles embarquées
```

Règles d'imports : `engine` n'importe rien de l'app ; une feature n'importe une
autre feature que via son `index.ts` public ; les écrans (`app/`) restent minces
(composition de features).

## 6. Gestion d'état

| Store / cache | Contenu | Persistance |
|---|---|---|
| `useGameStore` (Zustand) | partie en cours : grille, notes, undo, chrono, erreurs, indices | MMKV (reprise après kill) |
| `useSettingsStore` | langue, thème, notifications (opt-in + heure) | MMKV |
| `useEntitlementsStore` | `noAds` (RevenueCat), quota d'indices du jour | MMKV |
| TanStack Query | `['daily', localDate]`, `['percentile', date]`, `['unplayed', difficulty]`, `['history']` | cache mémoire + hydratation MMKV pour `daily` |
| Outbox (module dédié) | résultats de parties à pousser | file MMKV |

**Sync outbox** : fin de partie → écriture locale (stats immédiates) + enqueue →
flush au retour réseau (NetInfo) et au démarrage → `upsert … on conflict (id) do
nothing` → dequeue sur succès (ou doublon). Append-only ⇒ aucun conflit. Les
stats lisent le local d'abord ; l'historique serveur ne sert qu'à la
restauration après liaison de compte.

**Démarrage à froid** : 1) hydratation MMKV (UI immédiate) · 2)
`signInAnonymously` si aucune session · 3) prefetch daily J/J+1 + refill si
réseau · 4) flush outbox. Les étapes 2-4 sont non bloquantes.

**Consentement (avant toute pub)** : ATT (iOS) → CMP TCF → init MAX (signaux
consentement) → Firebase Consent Mode (`analytics_storage` selon consentement,
Crashlytics activé après acceptation). Refus ⇒ pubs non personnalisées, app
pleinement fonctionnelle. Réouverture du CMP depuis Réglages.

## 7. Moteur sudoku (le cœur testé)

```ts
// API publique de src/engine (signatures simplifiées)
parseGrid(s: string): Grid                       // 81 chars, '0' = vide
serializeGrid(g: Grid): string
findConflicts(g: Grid): CellRef[]                // contraintes ligne/colonne/boîte
isSolved(g: Grid): boolean
solve(g: Grid): { solution: Grid; unique: boolean } | null   // backtracking + comptage
findHint(g: Grid, notes: Notes): Hint            // { technique, cells, digits, i18nKey }
```

- **Techniques v1** (ordre d'essai) : naked single → hidden single → naked pair
  → hidden pair → pointing pair → claiming. Si aucune ne s'applique :
  `revealCell` (fallback assumé, surtout en expert).
- **Grader** (côté script, même moteur) : résout en n'utilisant que les
  techniques humaines ; la difficulté = la technique la plus dure requise
  (easy : singles · medium : + pairs · hard : + pointing/claiming · expert :
  nécessite plus → résolu par backtracking, indices via fallback).
- L'erreur de saisie est jugée **contre la solution stockée** (pas seulement les
  conflits visibles), conformément au PRD.

## 8. Stratégie de tests

- **Unitaires (Jest), la priorité absolue** : `src/engine` (grilles de référence
  par technique, propriété « solve(givens) == solution » sur tout le pack,
  unicité), streak (fuseaux, changement d'année, jour manqué), quota d'indices
  (reset minuit local), `gates.ts` (cap interstitiels, grace period, premium),
  réducteur outbox (idempotence, retries). Seuil de couverture **90 % sur
  `src/engine` et `features/*/logic`**, bloquant en CI.
- **Intégration légère** : RPC et RLS vérifiées par script supabase-js avec deux
  users de test (A ne lit pas les games de B ; daily futur invisible) sur la
  stack locale `supabase start`.
- **Hors scope v1** : tests UI de composants et E2E (Maestro envisagé v1.1).
  La recette manuelle suit la checklist du PRD §9.

## 9. CI/CD et environnements

- **GitHub Actions** (sur PR) : `npm run check` = typecheck + ESLint + Jest. Le
  seed des puzzles tourne en job manuel (service role en secret GitHub).
- **EAS** : profils `development` (dev client), `preview` (internal
  testing/TestFlight), `production`. Secrets (clés MAX, RevenueCat, Supabase
  URL/anon key) via variables EAS — l'anon key est publique by design, la
  sécurité repose sur la RLS.
- **Environnements Supabase** : local (`supabase start`) pour le dev et les
  tests d'intégration ; un seul projet cloud en v1 (prod). Migrations
  versionnées dans `supabase/migrations`, jamais de DDL manuel.

## 10. Risques et points de vigilance

| Risque | Mitigation |
|---|---|
| Compat New Architecture des SDK natifs (MAX, Firebase, MMKV, RevenueCat) | Vérification au bootstrap (E01/E12) ; fallback : désactiver new-arch le temps des mises à jour |
| Calibrage de difficulté perçue | Le grader par techniques est objectif ; ajuster le mapping via les données de complétion Firebase |
| Triche sur les temps du daily (percentile) | Enjeu faible (pas de noms) ; plancher 30 s ; durcir en v1.1 si besoin |
| Quota d'indices contournable en changeant l'horloge | Accepté en v1 (stockage local) |
| Croissance des users anonymes | Purge planifiée des anonymes sans données (>90 j) |
| eCPM EU + taux de refus CMP | Pubs non personnalisées servies quand même ; suivre le taux d'opt-in dans Firebase |
| Transferts hors EU (Firebase/Crashlytics) | Documentés dans la politique de confidentialité (DPF/SCC Google) ; collecte conditionnée au consentement |
