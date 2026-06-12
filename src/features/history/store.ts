import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type Difficulty } from '@/engine';
import { localDateOf, type LocalDate } from '@/lib/dates';
import { zustandStorage } from '@/lib/mmkv';

import { type GameMode } from '../game';

export type GameRecord = {
  /** gameId client : clé d'idempotence locale ET serveur. */
  readonly id: string;
  readonly puzzleId: string;
  readonly mode: GameMode;
  readonly dailyDate: LocalDate | null;
  readonly difficulty: Difficulty;
  readonly result: 'won' | 'lost';
  readonly durationMs: number;
  readonly mistakes: number;
  readonly hintsUsed: number;
  readonly finishedAt: string; // ISO 8601
};

type HistoryStore = {
  readonly records: readonly GameRecord[];
  /** Ajoute ou remplace (par id) un enregistrement. */
  upsertRecord: (record: GameRecord) => void;
  /** Fusion (restauration serveur après liaison de compte) : l'existant gagne. */
  mergeRecords: (records: readonly GameRecord[]) => void;
  clearAll: () => void;
};

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      records: [],

      upsertRecord: (record) => {
        const others = get().records.filter((r) => r.id !== record.id);
        set({ records: [...others, record] });
      },

      mergeRecords: (incoming) => {
        const known = new Set(get().records.map((r) => r.id));
        const additions = incoming.filter((r) => !known.has(r.id));
        if (additions.length > 0) set({ records: [...get().records, ...additions] });
      },

      clearAll: () => set({ records: [] }),
    }),
    {
      name: 'history-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

/** Dates locales des dailies gagnés (pour le calendrier). */
export function wonDailyDates(records: readonly GameRecord[]): ReadonlySet<LocalDate> {
  const dates = new Set<LocalDate>();
  for (const record of records) {
    if (record.mode === 'daily' && record.result === 'won' && record.dailyDate !== null) {
      dates.add(record.dailyDate);
    }
  }
  return dates;
}

/**
 * Dates gagnées LE JOUR MÊME (la streak ne se répare pas en rejouant hier,
 * cf. PRD §6) : la victoire doit dater du jour du défi.
 */
export function wonOnTimeDates(records: readonly GameRecord[]): ReadonlySet<LocalDate> {
  const dates = new Set<LocalDate>();
  for (const record of records) {
    if (
      record.mode === 'daily' &&
      record.result === 'won' &&
      record.dailyDate !== null &&
      localDateOf(new Date(record.finishedAt)) === record.dailyDate
    ) {
      dates.add(record.dailyDate);
    }
  }
  return dates;
}
