import { type GameRecord } from '../../history';
import { flushWith, isGameRecord, toGameRow, type GamesWriter } from '../outbox';

function record(id: string, overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    id,
    puzzleId: 'puzzle-1',
    mode: 'classic',
    dailyDate: null,
    difficulty: 'easy',
    result: 'won',
    durationMs: 120_000,
    mistakes: 1,
    hintsUsed: 0,
    finishedAt: '2026-06-12T10:00:00.000Z',
    ...overrides,
  };
}

function writerWith(outcomes: Record<string, 'ok' | 'rejected' | 'retry'>): {
  writer: GamesWriter;
  calls: string[];
} {
  const calls: string[] = [];
  const writer: GamesWriter = {
    insertGame: (row) => {
      const id = typeof row.id === 'string' ? row.id : '?';
      calls.push(id);
      const kind = outcomes[id] ?? 'ok';
      return Promise.resolve(
        kind === 'ok' ? { kind } : { kind, reason: 'test' },
      );
    },
  };
  return { writer, calls };
}

describe('flushWith', () => {
  it('vide la file quand tout passe', async () => {
    const { writer, calls } = writerWith({});
    const result = await flushWith(writer, 'user-1', [record('a'), record('b')]);
    expect(result).toEqual({ remaining: [], syncedCount: 2, rejectedCount: 0 });
    expect(calls).toEqual(['a', 'b']);
  });

  it('sort les rejets définitifs de la file sans bloquer la suite', async () => {
    const { writer } = writerWith({ b: 'rejected' });
    const result = await flushWith(writer, 'user-1', [record('a'), record('b'), record('c')]);
    expect(result.remaining).toEqual([]);
    expect(result.syncedCount).toBe(2);
    expect(result.rejectedCount).toBe(1);
  });

  it('s’arrête au premier échec temporaire et garde le reste en ordre', async () => {
    const { writer, calls } = writerWith({ b: 'retry' });
    const result = await flushWith(writer, 'user-1', [record('a'), record('b'), record('c')]);
    expect(result.syncedCount).toBe(1);
    expect(result.remaining.map((r) => r.id)).toEqual(['b', 'c']);
    expect(calls).toEqual(['a', 'b']); // c n'est jamais tenté
  });
});

describe('toGameRow', () => {
  it('mappe en colonnes serveur avec bornes saines', () => {
    const row = toGameRow(record('a', { mistakes: 7, durationMs: 0.4 }), 'user-9');
    expect(row).toMatchObject({
      id: 'a',
      user_id: 'user-9',
      puzzle_id: 'puzzle-1',
      mode: 'classic',
      daily_date: null,
      result: 'won',
      duration_ms: 1,
      mistakes: 3,
    });
  });
});

describe('isGameRecord', () => {
  it('accepte un enregistrement valide et rejette les corrompus', () => {
    expect(isGameRecord(record('a'))).toBe(true);
    expect(isGameRecord({ ...record('a'), result: 'meh' })).toBe(false);
    expect(isGameRecord({ ...record('a'), dailyDate: 'pas-une-date' })).toBe(false);
    expect(isGameRecord(null)).toBe(false);
  });

  it('exige une date locale valide pour un daily', () => {
    expect(isGameRecord(record('a', { mode: 'daily', dailyDate: '2026-06-12' }))).toBe(true);
  });
});
