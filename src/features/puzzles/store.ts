import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type Difficulty } from '@/engine';
import { zustandStorage } from '@/lib/mmkv';

import { PACK_PUZZLES, type PackPuzzle } from './pack';

/** Seuil de recharge en ligne : sous N grilles inédites par difficulté (cf. PRD §6). */
export const REFILL_THRESHOLD = 20;

type PuzzlesStore = {
  /** ids déjà servis à ce joueur (pack ou téléchargées). */
  readonly consumed: Record<string, true>;
  /** grilles téléchargées en attente (fetch_unplayed_puzzles). */
  readonly downloaded: readonly PackPuzzle[];
  takePuzzle: (difficulty: Difficulty) => PackPuzzle;
  addDownloaded: (puzzles: readonly PackPuzzle[]) => void;
  resetAll: () => void;
  unseenCount: (difficulty: Difficulty) => number;
};

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export const usePuzzlesStore = create<PuzzlesStore>()(
  persist(
    (set, get) => ({
      consumed: {},
      downloaded: [],

      takePuzzle: (difficulty) => {
        const { consumed, downloaded } = get();

        const fresh = downloaded.filter((p) => p.difficulty === difficulty && !consumed[p.id]);
        if (fresh.length > 0) {
          const puzzle = pickRandom(fresh);
          set({
            consumed: { ...consumed, [puzzle.id]: true },
            downloaded: downloaded.filter((p) => p.id !== puzzle.id),
          });
          return puzzle;
        }

        const packUnseen = PACK_PUZZLES.filter(
          (p) => p.difficulty === difficulty && !consumed[p.id],
        );
        if (packUnseen.length > 0) {
          const puzzle = pickRandom(packUnseen);
          set({ consumed: { ...consumed, [puzzle.id]: true } });
          return puzzle;
        }

        // tout le stock local est épuisé (offline prolongé) : on recycle le pack
        // de cette difficulté plutôt que de bloquer le joueur (cas assumé, PRD §6)
        const packOfDifficulty = PACK_PUZZLES.filter((p) => p.difficulty === difficulty);
        const nextConsumed = { ...consumed };
        for (const p of packOfDifficulty) delete nextConsumed[p.id];
        const puzzle = pickRandom(packOfDifficulty);
        set({ consumed: { ...nextConsumed, [puzzle.id]: true } });
        return puzzle;
      },

      addDownloaded: (puzzles) => {
        const { consumed, downloaded } = get();
        const known = new Set(downloaded.map((p) => p.id));
        const additions = puzzles.filter((p) => !known.has(p.id) && !consumed[p.id]);
        if (additions.length > 0) set({ downloaded: [...downloaded, ...additions] });
      },

      resetAll: () => set({ consumed: {}, downloaded: [] }),

      unseenCount: (difficulty) => {
        const { consumed, downloaded } = get();
        const inPack = PACK_PUZZLES.filter(
          (p) => p.difficulty === difficulty && !consumed[p.id],
        ).length;
        const inDownloads = downloaded.filter(
          (p) => p.difficulty === difficulty && !consumed[p.id],
        ).length;
        return inPack + inDownloads;
      },
    }),
    {
      name: 'puzzles-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ consumed: state.consumed, downloaded: state.downloaded }),
    },
  ),
);
