# CLAUDE.md — conventions sudoku-app

App mobile de sudoku : Expo + TypeScript strict + expo-router, backend Supabase.
Périmètre produit : `docs/PRD.md`. Schéma, RLS et structure : `docs/ARCHITECTURE.md`.
Toute décision qui contredit ces deux fichiers doit être discutée AVANT d'être codée.

## Commandes

```bash
npm run check        # typecheck + lint + tests — DOIT être vert avant tout commit
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run test         # jest (ajouter -- --watch en dev)
npx expo start       # dev server (dev build EAS requis, Expo Go ne suffit pas)
eas build --profile development --platform ios|android
supabase start       # stack locale (db + auth) pour dev et tests d'intégration
supabase db diff -f <nom>   # générer une migration — JAMAIS de DDL manuel
npm run seed:puzzles # générer grilles + seed (scripts/generate-puzzles)
```

## Règles TypeScript

- `strict: true`. **Interdits** : `any` (implicite ou explicite), `@ts-ignore`,
  `as` pour faire taire une erreur, `!` (non-null assertion) hors tests.
  Cas légitime bloquant → `@ts-expect-error` + commentaire d'une ligne.
- Types `union` plutôt qu'`enum` TS (`type Difficulty = 'easy' | 'medium' | …`),
  alignés sur les enums Postgres.
- Exports nommés partout ; `export default` uniquement dans `app/` (exigé par expo-router).
- Pas de classe quand une fonction suffit. Données immuables dans l'engine.

## Patterns imposés

- `src/engine` = TypeScript **pur** : aucun import react / react-native / expo /
  supabase. Toute logique métier testable vit ici ou dans `features/*/logic`.
- Une feature n'importe une autre feature que via son `index.ts` public.
  Les écrans `app/` sont minces : composition, zéro logique métier.
- État client → Zustand ; données serveur → TanStack Query (jamais de fetch
  dans un composant) ; persistance locale → MMKV via `lib/mmkv.ts`.
- Tout accès pub/IAP passe par `features/monetization` ; les décisions
  d'affichage (caps, premium, quotas) sont des fonctions pures dans `gates.ts`.
- Tout texte visible passe par i18next (FR + EN). Aucune chaîne en dur dans le JSX.
- Dates : le « jour » métier = date locale du device, helpers dans `lib/dates.ts`
  uniquement (pas de `new Date()` éparpillés dans la logique).
- Analytics : uniquement via la façade typée `lib/analytics.ts` (events nommés,
  pas d'appel Firebase direct).
- Erreurs : jamais de `catch` vide ; une erreur attendue se modélise en retour
  typé, une erreur inattendue remonte à Crashlytics.

## Interdictions absolues

- Secrets en dur (clés MAX, RevenueCat, service role…) : tout passe par les
  variables d'env EAS / `.env` non commité. Seule l'anon key Supabase est
  publique by design (la sécurité = RLS).
- Nouvelle table sans RLS activée + politiques écrites dans la même migration.
- Écriture en base hors `supabase/migrations` (pas de DDL via le dashboard).
- Pub affichée sans consentement CMP/ATT recueilli, ou pendant une grille en cours.
- Dépendance ajoutée sans vérifier la compat Expo/New Architecture et sans la
  justifier dans la PR.
- `console.log` en code livré (logger ou rien).

## Git

- Conventional Commits en anglais (`feat:`, `fix:`, `chore:`, `docs:`…), une
  feature = une branche = une PR courte.
- Jamais de commit direct sur `main` ; `npm run check` vert avant push.

## Definition of Done d'une feature

1. `npm run check` vert (typecheck + lint + tests).
2. La logique métier nouvelle a ses tests unitaires (engine/logic : ≥ 90 % couverts).
3. FR **et** EN fournis pour toute chaîne ajoutée.
4. Fonctionne offline si la feature s'y prête (testé en mode avion).
5. Nouvelle table/colonne → migration + RLS + mention dans ARCHITECTURE.md.
6. Pas de TODO restant, pas de code mort, pas de `console.log`.
7. Testé sur iOS **et** Android (simulateur minimum, device pour pub/IAP/notifs).
8. PRD/ARCHITECTURE mis à jour si le comportement produit ou le schéma a changé.
