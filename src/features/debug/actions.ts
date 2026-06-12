/**
 * Actions du menu debug. Tout passe par les APIs publiques des features :
 * remplir une grille = de vraies saisies dans le store (chrono, victoire,
 * recorder et sync suivent le même chemin qu'en jeu). Les seeds d'historique
 * restent LOCAUX (upsert direct, jamais mis en file de sync : leurs puzzleId
 * fictifs seraient rejetés par la FK serveur).
 */
import { randomUUID } from 'expo-crypto';

import { DIGITS, parseGrid, type Difficulty, type Digit } from '@/engine';
import { setAnalyticsConsent } from '@/features/consent';
import { useGameStore } from '@/features/game';
import { useHistoryStore, type GameRecord } from '@/features/history';
import {
  freshQuota,
  MIN_GAMES_BEFORE_INTERSTITIAL,
  useMonetizationStore,
} from '@/features/monetization';
import { refreshNotifications } from '@/features/notifications';
import { usePuzzlesStore } from '@/features/puzzles';
import { useSettingsStore } from '@/features/settings';
import { writeOutbox } from '@/features/sync';
import { addDays, localNoonIso, todayLocalDate, type LocalDate } from '@/lib/dates';
import { kv } from '@/lib/mmkv';

function digitOf(value: number): Digit | null {
  return DIGITS.find((d) => d === value) ?? null;
}

/**
 * Remplit les cases vides ou fausses avec la solution, en en laissant
 * `leave` au joueur (1 → tester la dernière saisie ; 0 → victoire immédiate).
 */
export function debugFillSolution(leave: number): void {
  const initial = useGameStore.getState().game;
  if (initial === null || initial.status !== 'playing') return;
  if (initial.notesMode) useGameStore.getState().toggleNotesMode();

  const solution = parseGrid(initial.puzzle.solution);
  const targets: number[] = [];
  for (let cell = 0; cell < 81; cell++) {
    if (initial.play.cells[cell] !== solution[cell]) targets.push(cell);
  }

  for (const cell of targets.slice(0, Math.max(0, targets.length - leave))) {
    const game = useGameStore.getState().game;
    if (game === null || game.status !== 'playing') return;
    const digit = digitOf(solution[cell] ?? 0);
    if (digit === null) continue;
    useGameStore.getState().selectCell(cell);
    if ((useGameStore.getState().game?.play.cells[cell] ?? 0) !== 0) {
      useGameStore.getState().erase();
    }
    useGameStore.getState().inputDigit(digit);
  }
}

/** Saisit des chiffres faux dans des cases vides jusqu'à la défaite (3 erreurs). */
export function debugLoseByMistakes(): void {
  const initial = useGameStore.getState().game;
  if (initial === null || initial.status !== 'playing') return;
  if (initial.notesMode) useGameStore.getState().toggleNotesMode();

  for (let attempts = 0; attempts < 6; attempts++) {
    const game = useGameStore.getState().game;
    if (game === null || game.status !== 'playing') return;
    const cell = game.play.cells.findIndex((value) => value === 0);
    if (cell === -1) return;
    const right = parseGrid(game.puzzle.solution)[cell] ?? 0;
    const wrong = digitOf(right === 9 ? 1 : right + 1);
    if (wrong === null) return;
    useGameStore.getState().selectCell(cell);
    useGameStore.getState().inputDigit(wrong);
  }
}

/** Daily gagné « à l'heure » : finishedAt à midi local du jour du défi. */
function wonDailyRecord(date: LocalDate): GameRecord {
  return {
    id: randomUUID(),
    puzzleId: `debug-daily-${date}`,
    mode: 'daily',
    dailyDate: date,
    difficulty: 'medium',
    result: 'won',
    durationMs: 180_000 + Math.floor(Math.random() * 240_000),
    mistakes: 0,
    hintsUsed: 0,
    finishedAt: localNoonIso(date),
  };
}

/** Sème `days` dailies gagnés consécutifs en terminant aujourd'hui (local only). */
export function debugSeedDailyStreak(days: number): void {
  const today = todayLocalDate();
  for (let i = 0; i < days; i++) {
    useHistoryStore.getState().upsertRecord(wonDailyRecord(addDays(today, -i)));
  }
  refreshNotifications();
}

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/** Sème `count` parties classiques réparties sur 30 jours (stats, local only). */
export function debugSeedClassicHistory(count: number): void {
  const today = todayLocalDate();
  for (let i = 0; i < count; i++) {
    useHistoryStore.getState().upsertRecord({
      id: randomUUID(),
      puzzleId: `debug-classic-${String(i)}-${randomUUID().slice(0, 8)}`,
      mode: 'classic',
      dailyDate: null,
      difficulty: DIFFICULTIES[i % DIFFICULTIES.length] ?? 'easy',
      result: Math.random() < 0.7 ? 'won' : 'lost',
      durationMs: 120_000 + Math.floor(Math.random() * 900_000),
      mistakes: Math.floor(Math.random() * 3),
      hintsUsed: Math.floor(Math.random() * 4),
      finishedAt: localNoonIso(addDays(today, -Math.floor(Math.random() * 30))),
    });
  }
}

export function debugClearHistory(): void {
  useHistoryStore.getState().clearAll();
  refreshNotifications();
}

export function debugGrantHints(count: number): void {
  const today = todayLocalDate();
  for (let i = 0; i < count; i++) {
    useMonetizationStore.getState().grantBonusHintToday(today);
  }
}

export function debugResetHintQuota(): void {
  useMonetizationStore.setState({ hintQuota: freshQuota(todayLocalDate()) });
}

/** Rend l'interstitiel immédiatement éligible : ≥ 3 parties, cap des 3 min levé. */
export function debugMakeInterstitialEligible(): void {
  useMonetizationStore.setState({
    totalGamesFinished: Math.max(
      MIN_GAMES_BEFORE_INTERSTITIAL,
      useMonetizationStore.getState().totalGamesFinished,
    ),
    lastInterstitialAt: null,
  });
}

/** Simule l'entitlement « Sans pub » (écrasé au prochain sync RevenueCat). */
export function debugSetNoAds(noAds: boolean): void {
  useMonetizationStore.getState().setNoAds(noAds);
}

/** Efface TOUT le stockage local et remet les stores en mémoire à neuf. */
export function debugFactoryReset(): void {
  useGameStore.getState().clearGame();
  useHistoryStore.getState().clearAll();
  usePuzzlesStore.getState().resetAll();
  writeOutbox([]);
  useMonetizationStore.setState({
    noAds: false,
    totalGamesFinished: 0,
    lastInterstitialAt: null,
    hintQuota: null,
  });
  useSettingsStore.getState().setLanguageOverride(null);
  useSettingsStore.getState().setNotificationsEnabled(false);
  setAnalyticsConsent(false);
  kv.clearAll();
  refreshNotifications();
}
