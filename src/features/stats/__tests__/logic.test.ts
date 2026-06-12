import { type GameRecord } from '../../history';
import { aggregateStats } from '../logic';

function record(overrides: Partial<GameRecord>): GameRecord {
  return {
    id: Math.random().toString(36),
    puzzleId: 'p',
    mode: 'classic',
    dailyDate: null,
    difficulty: 'easy',
    result: 'won',
    durationMs: 100_000,
    mistakes: 0,
    hintsUsed: 0,
    finishedAt: '2026-06-12T10:00:00.000Z',
    ...overrides,
  };
}

describe('aggregateStats', () => {
  it('reste neutre sans aucune partie', () => {
    const stats = aggregateStats([]);
    expect(stats.totalPlayed).toBe(0);
    expect(stats.winRatePercent).toBe(0);
    expect(stats.perDifficulty.easy).toEqual({ played: 0, won: 0, bestMs: null, avgMs: null });
  });

  it('agrège victoires, taux et temps par difficulté', () => {
    const stats = aggregateStats([
      record({ difficulty: 'easy', result: 'won', durationMs: 90_000 }),
      record({ difficulty: 'easy', result: 'won', durationMs: 150_000 }),
      record({ difficulty: 'easy', result: 'lost', durationMs: 30_000 }),
      record({ difficulty: 'hard', result: 'won', durationMs: 600_000 }),
    ]);
    expect(stats.totalPlayed).toBe(4);
    expect(stats.totalWon).toBe(3);
    expect(stats.winRatePercent).toBe(75);
    expect(stats.perDifficulty.easy).toEqual({
      played: 3,
      won: 2,
      bestMs: 90_000,
      avgMs: 120_000,
    });
    // les défaites n'entrent pas dans les temps
    expect(stats.perDifficulty.hard.bestMs).toBe(600_000);
    expect(stats.perDifficulty.medium.played).toBe(0);
  });
});
