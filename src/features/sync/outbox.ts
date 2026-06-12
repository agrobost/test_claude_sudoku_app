import { isLocalDate } from '@/lib/dates';
import { kv } from '@/lib/mmkv';

import { type GameRecord } from '../history';

const OUTBOX_KEY = 'sync-outbox';

export function isGameRecord(value: unknown): value is GameRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record: Record<string, unknown> = { ...value };
  return (
    typeof record.id === 'string' &&
    typeof record.puzzleId === 'string' &&
    (record.mode === 'classic' || record.mode === 'daily') &&
    (record.dailyDate === null || isLocalDate(record.dailyDate)) &&
    (record.difficulty === 'easy' ||
      record.difficulty === 'medium' ||
      record.difficulty === 'hard' ||
      record.difficulty === 'expert') &&
    (record.result === 'won' || record.result === 'lost') &&
    typeof record.durationMs === 'number' &&
    typeof record.mistakes === 'number' &&
    typeof record.hintsUsed === 'number' &&
    typeof record.finishedAt === 'string'
  );
}

function isRecordArray(value: unknown): value is GameRecord[] {
  return Array.isArray(value) && value.every(isGameRecord);
}

export function readOutbox(): readonly GameRecord[] {
  return kv.getJSON(OUTBOX_KEY, isRecordArray) ?? [];
}

export function writeOutbox(records: readonly GameRecord[]): void {
  kv.setJSON(OUTBOX_KEY, records);
}

/** Ajoute (ou remplace par id) un résultat à pousser. */
export function enqueue(record: GameRecord): void {
  const others = readOutbox().filter((r) => r.id !== record.id);
  writeOutbox([...others, record]);
}

type InsertOutcome =
  /** Ligne acceptée (ou doublon d'id ignoré). */
  | { readonly kind: 'ok' }
  /** Rejet définitif : inutile de réessayer (contrainte métier). */
  | { readonly kind: 'rejected'; readonly reason: string }
  /** Échec temporaire (réseau, serveur) : réessayer plus tard. */
  | { readonly kind: 'retry'; readonly reason: string };

/** Sous-ensemble du client Supabase utilisé par la sync (injectable en test). */
export type GamesWriter = {
  insertGame: (row: Record<string, unknown>) => Promise<InsertOutcome>;
};

export function toGameRow(record: GameRecord, userId: string): Record<string, unknown> {
  return {
    id: record.id,
    user_id: userId,
    puzzle_id: record.puzzleId,
    mode: record.mode,
    daily_date: record.dailyDate,
    difficulty: record.difficulty,
    result: record.result,
    duration_ms: Math.max(1, Math.round(record.durationMs)),
    mistakes: Math.min(3, Math.max(0, record.mistakes)),
    hints_used: Math.max(0, record.hintsUsed),
    finished_at: record.finishedAt,
  };
}

export type FlushResult = {
  readonly remaining: readonly GameRecord[];
  readonly syncedCount: number;
  readonly rejectedCount: number;
};

/**
 * Pousse la file dans l'ordre. S'arrête au premier échec TEMPORAIRE
 * (le reste attend la prochaine connexion) ; les rejets définitifs
 * (ex. : seconde victoire daily d'une même date) sortent de la file.
 */
export async function flushWith(
  writer: GamesWriter,
  userId: string,
  queue: readonly GameRecord[],
): Promise<FlushResult> {
  const remaining: GameRecord[] = [];
  let syncedCount = 0;
  let rejectedCount = 0;

  for (const [index, record] of queue.entries()) {
    const outcome = await writer.insertGame(toGameRow(record, userId));
    if (outcome.kind === 'ok') {
      syncedCount++;
      continue;
    }
    if (outcome.kind === 'rejected') {
      rejectedCount++;
      continue;
    }
    remaining.push(...queue.slice(index));
    break;
  }

  return { remaining, syncedCount, rejectedCount };
}
