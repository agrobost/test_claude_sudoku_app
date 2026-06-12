import { type Difficulty } from '@/engine';

import { type GameRecord } from '../history';

export type DifficultyStats = {
  readonly played: number;
  readonly won: number;
  /** Meilleur et moyen temps des VICTOIRES uniquement. */
  readonly bestMs: number | null;
  readonly avgMs: number | null;
};

export type OverallStats = {
  readonly totalPlayed: number;
  readonly totalWon: number;
  readonly winRatePercent: number;
  readonly perDifficulty: Readonly<Record<Difficulty, DifficultyStats>>;
};

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export function aggregateStats(records: readonly GameRecord[]): OverallStats {
  const perDifficulty: Record<Difficulty, DifficultyStats> = {
    easy: emptyStats(),
    medium: emptyStats(),
    hard: emptyStats(),
    expert: emptyStats(),
  };

  const winDurations: Record<Difficulty, number[]> = { easy: [], medium: [], hard: [], expert: [] };

  for (const record of records) {
    const bucket = perDifficulty[record.difficulty];
    const won = record.result === 'won';
    perDifficulty[record.difficulty] = {
      ...bucket,
      played: bucket.played + 1,
      won: bucket.won + (won ? 1 : 0),
      bestMs: bucket.bestMs,
      avgMs: bucket.avgMs,
    };
    if (won) winDurations[record.difficulty].push(record.durationMs);
  }

  for (const difficulty of DIFFICULTIES) {
    const durations = winDurations[difficulty];
    if (durations.length === 0) continue;
    const best = Math.min(...durations);
    const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    perDifficulty[difficulty] = { ...perDifficulty[difficulty], bestMs: best, avgMs: avg };
  }

  const totalPlayed = records.length;
  const totalWon = records.filter((r) => r.result === 'won').length;
  return {
    totalPlayed,
    totalWon,
    winRatePercent: totalPlayed === 0 ? 0 : Math.round((100 * totalWon) / totalPlayed),
    perDifficulty,
  };
}

function emptyStats(): DifficultyStats {
  return { played: 0, won: 0, bestMs: null, avgMs: null };
}
