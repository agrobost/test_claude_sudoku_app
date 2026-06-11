# PRD — Sudoku mobile (nom de travail : `sudoku-app`)

> Version 1.0 — 2026-06-11 — décisions issues de l'interview produit.
> Documents liés : [ARCHITECTURE.md](./ARCHITECTURE.md) · [CLAUDE.md](../CLAUDE.md)

## 1. Vision et objectif business

Un sudoku mobile **grand public, gratuit et jouable hors connexion**, qui génère du
revenu dès les premiers utilisateurs via la publicité (AppLovin MAX) et un achat
unique « Sans pub ». Le moteur de rétention : un **défi quotidien identique pour
tous** et une **série (streak)** à protéger. Le différenciateur produit : des
**indices pédagogiques** — l'app n'écrit pas un chiffre à ta place, elle explique
la technique de résolution qui débloque la situation.

**KPIs cibles (90 jours après lancement)**

| KPI | Cible |
|---|---|
| Rétention D1 / D7 | ≥ 25 % / ≥ 10 % |
| Participation au défi du jour | ≥ 30 % des DAU |
| ARPDAU (pub + IAP) | ≥ 0,015 € |
| Conversion « Sans pub » (joueurs J7+) | ≥ 1 % |
| Crash-free sessions | ≥ 99,5 % |

## 2. Persona principal

**Le joueur casual de transport** : 25-55 ans, joue 5-15 min dans le métro, la
salle d'attente, au lit. Ne veut **aucune friction** : pas de création de compte,
pas de tutoriel long, jeu disponible sans réseau. Niveau facile → difficile.
Sensible à la série quotidienne (« ne pas casser la chaîne »). Tolère la pub si
elle n'interrompt pas une grille en cours.

Persona secondaire (servi, non prioritaire) : le joueur régulier qui veut
progresser — c'est lui que les indices pédagogiques fidélisent.

## 3. Décisions structurantes (issues de l'interview)

| Sujet | Décision |
|---|---|
| Monétisation | Pubs AppLovin MAX + IAP unique « Sans pub » |
| Persona | Casual grand public |
| Core loop | Défi du jour + streak **et** bibliothèque illimitée par difficulté |
| Marché / langues | EU, FR + EN dès la v1, RGPD by design |
| Offline | Offline-first : jeu complet sans réseau, sync à la reconnexion |
| Compte | Anonyme d'abord (Supabase anonymous), liaison Apple/Google optionnelle |
| Notifications | Locales uniquement : rappel daily + protection de streak |
| Grilles | Pré-générées par script → Postgres ; daily servi par Supabase ; pack embarqué pour l'offline |
| Indices | Solveur **embarqué côté client** qui explique la technique ; 3 offerts/jour puis rewarded video |
| Erreurs | 3 erreurs max, rewarded video pour continuer |
| Social v1 | Percentile du daily + partage du résultat ; pas de leaderboard nominatif |
| Tracking | Firebase Analytics + Crashlytics, CMP TCF + ATT avant toute pub |

## 4. User stories priorisées

### P0 — sans ça, pas de lancement

| # | Story | Critères d'acceptation clés |
|---|---|---|
| U1 | En tant que joueur, je lance l'app et je joue une grille **immédiatement**, sans compte ni réseau. | Premier lancement → grille jouable en < 5 s, session anonyme créée en arrière-plan, pack de grilles embarqué. |
| U2 | En tant que joueur, je saisis des chiffres, des notes (crayon), j'annule, j'efface. | Saisie cellule/chiffre dans les deux sens, notes auto-nettoyées sur placement valide, undo illimité dans la partie. |
| U3 | En tant que joueur, je vois mes erreurs : à la 3ᵉ la partie s'arrête, une rewarded video me permet de continuer. | Erreur = saisie ≠ solution. Compteur visible. Défaite → choix « regarder une pub pour continuer » (1 fois max par partie) ou abandonner. |
| U4 | En tant que joueur bloqué, je demande un indice qui m'**explique la technique** à appliquer. | 3 indices offerts/jour ; ensuite rewarded video → +1. L'indice montre les cellules concernées + le nom et l'explication de la technique. Fallback : révéler la cellule si aucune technique connue ne s'applique. |
| U5 | En tant que joueur, je joue le **défi du jour**, le même que tout le monde. | Une grille par date calendaire, identique pour tous, jouable hors ligne si pré-téléchargée. Une seule victoire comptabilisée par jour. |
| U6 | En tant que joueur, j'entretiens une **série** de défis quotidiens réussis. | Streak = jours calendaires consécutifs avec daily gagné. Affichée sur l'accueil et le calendrier. Record conservé. |
| U7 | En tant que joueur, je choisis une nouvelle grille par difficulté (facile/moyen/difficile/expert). | Jamais deux fois la même grille pour un même joueur. Fonctionne hors ligne (pack local, recharge en ligne). |
| U8 | En tant que joueur, je quitte l'app et je **reprends ma partie** exactement où j'étais. | État complet persisté localement (saisies, notes, chrono, erreurs, indices). |
| U9 | En tant qu'éditeur, je monétise par la pub sans détruire l'expérience. | Interstitiel uniquement **après** une fin de partie, jamais pendant ; pas avant la 3ᵉ partie d'un nouvel utilisateur ; ≥ 3 min entre deux interstitiels. Bannière sur l'écran de jeu uniquement. Aucune pub sans consentement CMP/ATT recueilli. |
| U10 | En tant que joueur, j'achète « Sans pub » une fois et je restaure mon achat. | IAP non-consommable. Supprime bannières + interstitiels ; les rewarded restent disponibles (volontaires). Bouton « Restaurer mes achats ». |
| U11 | En tant que résident EU, mes droits RGPD sont respectés. | CMP TCF v2.2 + ATT (iOS) avant toute pub ; consentement modifiable dans les réglages ; suppression de compte = effacement serveur complet ; politique de confidentialité accessible. |
| U12 | En tant que joueur, mes résultats sont synchronisés quand je retrouve du réseau. | File locale idempotente ; aucune perte de résultat ; aucune action utilisateur requise. |

### P1 — dans la v1 si le planning tient (sinon v1.1 immédiate)

| # | Story | Critères d'acceptation clés |
|---|---|---|
| U13 | À la fin du défi du jour, je vois que je suis « plus rapide que X % des joueurs » et je partage mon résultat. | Percentile calculé serveur (RPC), affiché seulement en ligne ; partage natif texte sans spoiler de la grille. |
| U14 | Je reçois un rappel quotidien et une alerte si ma série va expirer. | Notifications **locales**, opt-in explicite, heure du rappel configurable, alerte streak à 20 h locale si daily non gagné. |
| U15 | Je consulte mes statistiques. | Parties jouées/gagnées, taux de réussite, meilleur temps et temps moyen par difficulté, streak actuel/record. Calcul local d'abord. |
| U16 | Je lie mon compte Apple ou Google pour sécuriser ma progression. | Liaison de l'identité sur la session anonyme (même uid) ; bandeau incitatif non bloquant ; déconnexion propre. |
| U17 | Je rejoue les défis des jours passés du mois courant. | Jouables depuis le calendrier, comptent pour compléter le mois, **ne modifient pas** la streak (sauf le jour J). |

### P2 — confort, après la v1 si gratuit à faire

- U18 : mode sombre suivant le système.
- U19 : réglages de confort (surlignage des paires identiques, vérification désactivable des erreurs — sans impact monétisation).

## 5. Écrans de la v1

1. **Accueil** (onglet) — CTA défi du jour (état fait/à faire + flamme streak), « Continuer la partie », « Nouvelle partie » avec choix de difficulté.
2. **Jeu** (plein écran) — grille 9×9, pavé 1-9, mode notes, gomme, annuler, bouton indice (compteur restant), chrono, erreurs ×/3, pause ; bannière pub en bas (non-premium).
3. **Fin de partie** (overlay sur l'écran Jeu) — victoire : temps, stats, percentile + partage (daily) ; défaite : « continuer » (rewarded) ou abandonner.
4. **Défi du jour** (onglet) — calendrier mensuel, jours réussis cochés, streak courante/record, accès aux jours passés.
5. **Statistiques** (onglet) — voir U15.
6. **Réglages** (onglet) — Sans pub (achat + restauration), compte (lier/délier), notifications, langue, confidentialité (revoir le consentement, politique), supprimer mon compte, à propos/licences.
7. **Paywall « Sans pub »** (modale) — accessible depuis Réglages et depuis l'overlay de fin de partie.

Onboarding : **aucun écran dédié**. Les prompts ATT puis CMP s'affichent au bon
moment (avant la première pub), un tooltip contextuel guide la première grille.

## 6. Règles métier précises

- **Jour calendaire** : le daily est indexé sur la **date locale** du device ; le serveur publie les grilles à l'avance (≥ 90 jours) et autorise la lecture jusqu'à date UTC+1 jour pour couvrir les fuseaux en avance. Détails en architecture.
- **Streak** : suite de dates locales consécutives avec daily **gagné**. Gagner le daily du jour J avant minuit local maintient la série. Rejouer un jour passé ne la répare pas.
- **Indices** : quota de 3/jour offert, remis à zéro à minuit local, stocké localement. Rewarded → +1 indice, sans plafond. L'indice consomme le quota même en fallback « révéler la cellule ».
- **Erreurs** : une saisie contraire à la solution = 1 erreur (les notes n'en déclenchent jamais). 3 erreurs = défaite ; une seule « continuation » par rewarded et par partie, qui remet le compteur à 2/3.
- **Interstitiels** : après fin de partie (victoire, défaite ou abandon) uniquement ; jamais avant la 3ᵉ partie de la vie de l'utilisateur ; intervalle minimal de 3 min ; jamais pour les acheteurs « Sans pub ».
- **Percentile** : « plus rapide que X % » comparé aux **premières victoires** des autres joueurs sur la même date, durées < 30 s exclues (anti-bruit).
- **Difficulté du daily** : `medium` constant en v1 (persona casual) — ajustable côté données sans mise à jour de l'app.
- **Pack embarqué** : ~240 grilles (60 × 4 difficultés) dans le binaire ; recharge en ligne quand < 20 grilles non jouées restent dans une difficulté.
- **Réinstallation** : sans compte lié, la progression est perdue (assumé v1, l'app incite à lier) ; l'achat « Sans pub » se restaure toujours via le store.

## 7. Monétisation — placements

| Placement | Format | Condition |
|---|---|---|
| Fin de partie | Interstitiel | Règles U9 ; jamais si premium |
| Écran de jeu | Bannière | Jamais si premium |
| Indice supplémentaire | Rewarded | Volontaire, même pour premium |
| Continuer après 3 erreurs | Rewarded | Volontaire, même pour premium |
| « Sans pub » | IAP non-consommable | Prix cible 4,99 € (à AB-tester plus tard) |

## 8. HORS SCOPE v1 — explicite

| Exclu | Pourquoi pas maintenant |
|---|---|
| Leaderboard nominatif / amis | Anti-triche + modération de pseudos = gros chantier ; le percentile suffit à la comparaison |
| Multijoueur / duel | Infra temps réel sans preuve de demande |
| Variantes (killer, 6×6, 16×16) | Multiplie moteur, UI et génération ; la v1 prouve d'abord le modèle |
| Abonnement, packs d'indices IAP | Un seul SKU en v1 ; on complexifiera quand il y aura du volume |
| Push serveur / campagnes | Les notifications locales couvrent le besoin de rétention v1 |
| Sync multi-appareils de la partie **en cours** | Seuls les résultats sont synchronisés ; reprise = même device |
| Thèmes payants, avatars | Cosmétique sans levier prouvé |
| Layout tablette dédié, web | Cibles iPhone/Android phone d'abord |
| Email/magic link comme méthode de liaison | Apple + Google couvrent la cible ; le deep-linking email ajoute du support |
| Génération de grilles on-device | Les grilles viennent du pool pré-généré ; le device ne fait que résoudre/expliquer |

## 9. Critères de lancement (checklist)

- [ ] Toutes les stories P0 livrées et recettées sur iOS + Android physiques.
- [ ] Parcours offline complet validé en mode avion (jeu, daily pré-chargé, reprise, sync différée).
- [ ] CMP + ATT recueillis avant toute requête pub ; refus = pubs non personnalisées, app pleinement jouable.
- [ ] Suppression de compte testée de bout en bout (données effacées en base).
- [ ] FR et EN complets (zéro chaîne en dur), stores en deux langues.
- [ ] Fiches App Privacy (Apple) et Data Safety (Google) cohérentes avec les SDK embarqués (MAX, Firebase).
- [ ] Crash-free ≥ 99,5 % sur une semaine de TestFlight/internal testing.
- [ ] `npm run check` (typecheck + lint + tests) vert, logique métier couverte par tests unitaires.
