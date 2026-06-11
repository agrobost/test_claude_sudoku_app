# sudoku-app

App mobile de sudoku — Expo + TypeScript strict + expo-router, backend Supabase.

- **Produit** : [docs/PRD.md](docs/PRD.md)
- **Architecture, schéma SQL, RLS** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Conventions de code** : [CLAUDE.md](CLAUDE.md)

## Démarrage

```bash
npm install
npm run check          # typecheck + lint + tests
npx expo start         # dev server — nécessite un dev build (Expo Go ne suffit pas)
```

### Dev build (une fois par plateforme)

```bash
npm i -g eas-cli
eas init               # lie le projet à un compte Expo (renseigne extra.eas.projectId)
eas build --profile development --platform ios     # ou android
```

### Backend local (Supabase)

```bash
supabase start         # stack locale (Docker requis)
supabase db reset      # applique migrations + seed (grilles)
SUPABASE_ANON_KEY=<clé affichée par `supabase status`> npm run test:rls
```

### Génération des grilles

```bash
npm run seed:puzzles   # régénère supabase/seed.sql + assets/puzzles/pack.json
```

À relancer avant la mise en prod pour recaler la fenêtre des défis quotidiens
(90 jours à partir de la date de génération).

## Comptes externes à créer (phase 2)

| Service | Usage | Étape |
|---|---|---|
| Expo / EAS | builds dev + prod | E01 (dev build) |
| Supabase cloud | prod (un seul projet en v1) | E05→E08 |
| AppLovin MAX | pubs (bannière, interstitiel, rewarded) | E13 |
| Firebase | Analytics + Crashlytics | E12 |
| RevenueCat | IAP « Sans pub » | E15 |
| App Store Connect / Play Console | distribution (validations longues, anticiper) | E18 |
