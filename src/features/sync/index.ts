import NetInfo from '@react-native-community/netinfo';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

import { currentUserId } from '../auth';
import { onGameRecorded, useHistoryStore, type GameRecord } from '../history';
import { refillPuzzles } from '../puzzles';

import { enqueue, flushWith, isGameRecord, readOutbox, writeOutbox, type GamesWriter } from './outbox';

export { enqueue, flushWith, isGameRecord, readOutbox, writeOutbox } from './outbox';

/** Codes Postgres « rejet métier définitif » : doublon (23505) ou FK absente (23503). */
const REJECTED_CODES = new Set(['23505', '23503']);

function liveWriter(): GamesWriter | null {
  if (supabase === null) return null;
  const client = supabase;
  return {
    insertGame: async (row) => {
      const { error } = await client
        .from('games')
        .upsert(row, { onConflict: 'id', ignoreDuplicates: true });
      if (error === null) return { kind: 'ok' };
      if (typeof error.code === 'string' && REJECTED_CODES.has(error.code)) {
        return { kind: 'rejected', reason: error.code };
      }
      return { kind: 'retry', reason: error.message };
    },
  };
}

let flushInFlight = false;

/** Pousse la file des résultats vers le serveur (idempotent, tolérant au offline). */
export async function flushOutbox(): Promise<void> {
  if (flushInFlight) return;
  const writer = liveWriter();
  if (writer === null) return;
  const queue = readOutbox();
  if (queue.length === 0) return;
  const userId = await currentUserId();
  if (userId === null) return;

  flushInFlight = true;
  try {
    const result = await flushWith(writer, userId, queue);
    writeOutbox(result.remaining);
    if (result.rejectedCount > 0) {
      logger.warn(`outbox : ${result.rejectedCount} résultat(s) rejeté(s) définitivement`);
    }
  } catch (error) {
    logger.warn('flush outbox interrompu', error);
  } finally {
    flushInFlight = false;
  }
}

function isServerGameRow(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function recordFromServerRow(row: Record<string, unknown>): GameRecord | null {
  const candidate = {
    id: row.id,
    puzzleId: row.puzzle_id,
    mode: row.mode,
    dailyDate: row.daily_date ?? null,
    difficulty: row.difficulty,
    result: row.result,
    durationMs: row.duration_ms,
    mistakes: row.mistakes,
    hintsUsed: row.hints_used,
    finishedAt: row.finished_at,
  };
  return isGameRecord(candidate) ? candidate : null;
}

/** Restauration de l'historique serveur (liaison de compte, réinstallation). */
export async function pullServerHistory(): Promise<number> {
  if (supabase === null) return 0;
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('finished_at', { ascending: false })
    .limit(1000);
  if (error !== null) {
    logger.warn('restauration de l’historique impossible', error);
    return 0;
  }
  const rows: unknown[] = Array.isArray(data) ? data : [];
  const records = rows
    .filter(isServerGameRow)
    .map(recordFromServerRow)
    .filter((r): r is GameRecord => r !== null);
  useHistoryStore.getState().mergeRecords(records);
  return records.length;
}

/**
 * Branche la sync : chaque partie enregistrée part en file, la file se vide
 * au retour du réseau, le stock de grilles se recharge sous le seuil.
 */
export function initSync(): () => void {
  onGameRecorded((record) => {
    enqueue(record);
    void flushOutbox();
  });

  const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    if (state.isConnected === true) {
      void flushOutbox();
      void refillPuzzles();
    }
  });

  void flushOutbox();
  void refillPuzzles();
  if (useHistoryStore.getState().records.length === 0) {
    void pullServerHistory();
  }

  return unsubscribeNetInfo;
}
