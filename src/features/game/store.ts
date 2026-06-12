import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { parseGrid, type CellRef, type Difficulty, type Digit, type Grid } from '@/engine';
import { nowMs } from '@/lib/dates';
import { zustandStorage } from '@/lib/mmkv';

import {
  applyErase,
  applyInput,
  applyUndo,
  buildPlayState,
  type InputOutcome,
  type PlayState,
} from './logic';

export type GameMode = 'classic' | 'daily';
export type GameStatus = 'playing' | 'won' | 'lost';

export type PuzzleSpec = {
  readonly id: string;
  readonly givens: string;
  readonly solution: string;
  readonly difficulty: Difficulty;
};

export type ActiveGame = {
  readonly gameId: string;
  readonly puzzle: PuzzleSpec;
  readonly mode: GameMode;
  readonly dailyDate: string | null;
  readonly play: PlayState;
  readonly status: GameStatus;
  readonly selectedCell: CellRef | null;
  readonly notesMode: boolean;
  readonly hintsUsed: number;
  readonly continueUsed: boolean;
  /** Temps accumulé hors run courant ; le run courant part de runStartedAt. */
  readonly elapsedMs: number;
  readonly runStartedAt: number | null;
};

type GameStore = {
  readonly game: ActiveGame | null;
  startGame: (puzzle: PuzzleSpec, mode: GameMode, dailyDate: string | null) => void;
  selectCell: (cell: CellRef | null) => void;
  toggleNotesMode: () => void;
  inputDigit: (digit: Digit) => InputOutcome;
  erase: () => void;
  undo: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  /** Abandon volontaire : la partie se termine en défaite. */
  abandonGame: () => void;
  /** Décrémente le compteur après un « continuer » (rewarded, E14). */
  reviveAfterDefeat: () => void;
  registerHintUsed: () => void;
  applyHintPlacement: (cell: CellRef, digit: Digit) => InputOutcome;
  clearHintWrongCell: (cell: CellRef) => void;
  clearGame: () => void;
};

export function parsedGivens(game: ActiveGame): Grid {
  return parseGrid(game.puzzle.givens);
}

export function parsedSolution(game: ActiveGame): Grid {
  return parseGrid(game.puzzle.solution);
}

/** Durée jouée totale, gelée quand le timer est en pause ou la partie finie. */
export function elapsedMsOf(game: ActiveGame, now: number): number {
  return game.elapsedMs + (game.runStartedAt === null ? 0 : Math.max(0, now - game.runStartedAt));
}

function frozen(game: ActiveGame, now: number): Pick<ActiveGame, 'elapsedMs' | 'runStartedAt'> {
  return { elapsedMs: elapsedMsOf(game, now), runStartedAt: null };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      const withGame = (updater: (game: ActiveGame) => ActiveGame | null): void => {
        const { game } = get();
        if (game !== null) set({ game: updater(game) });
      };

      const finalize = (game: ActiveGame, status: 'won' | 'lost'): ActiveGame => ({
        ...game,
        status,
        ...frozen(game, nowMs()),
      });

      return {
        game: null,

        startGame: (puzzle, mode, dailyDate) => {
          set({
            game: {
              gameId: randomUUID(),
              puzzle,
              mode,
              dailyDate,
              play: buildPlayState(parseGrid(puzzle.givens)),
              status: 'playing',
              selectedCell: null,
              notesMode: false,
              hintsUsed: 0,
              continueUsed: false,
              elapsedMs: 0,
              runStartedAt: nowMs(),
            },
          });
        },

        selectCell: (cell) => withGame((game) => ({ ...game, selectedCell: cell })),

        toggleNotesMode: () => withGame((game) => ({ ...game, notesMode: !game.notesMode })),

        inputDigit: (digit) => {
          const { game } = get();
          if (game === null || game.status !== 'playing' || game.selectedCell === null) {
            return 'noop';
          }
          const { state, outcome } = applyInput(game.play, {
            cell: game.selectedCell,
            digit,
            notesMode: game.notesMode,
            givens: parsedGivens(game),
            solution: parsedSolution(game),
          });
          let next: ActiveGame = { ...game, play: state };
          if (outcome === 'won' || outcome === 'lost') {
            next = finalize(next, outcome === 'won' ? 'won' : 'lost');
          }
          set({ game: next });
          return outcome;
        },

        erase: () =>
          withGame((game) => {
            if (game.status !== 'playing' || game.selectedCell === null) return game;
            const { state } = applyErase(game.play, game.selectedCell, parsedGivens(game));
            return { ...game, play: state };
          }),

        undo: () =>
          withGame((game) =>
            game.status === 'playing' ? { ...game, play: applyUndo(game.play) } : game,
          ),

        pauseTimer: () =>
          withGame((game) =>
            game.status === 'playing' && game.runStartedAt !== null
              ? { ...game, ...frozen(game, nowMs()) }
              : game,
          ),

        resumeTimer: () =>
          withGame((game) =>
            game.status === 'playing' && game.runStartedAt === null
              ? { ...game, runStartedAt: nowMs() }
              : game,
          ),

        abandonGame: () =>
          withGame((game) => (game.status === 'playing' ? finalize(game, 'lost') : game)),

        reviveAfterDefeat: () =>
          withGame((game) =>
            game.status === 'lost' && !game.continueUsed
              ? {
                  ...game,
                  status: 'playing',
                  continueUsed: true,
                  runStartedAt: nowMs(),
                  play: { ...game.play, mistakes: game.play.mistakes - 1 },
                }
              : game,
          ),

        registerHintUsed: () => withGame((game) => ({ ...game, hintsUsed: game.hintsUsed + 1 })),

        applyHintPlacement: (cell, digit) => {
          const { game } = get();
          if (game === null || game.status !== 'playing') return 'noop';
          const { state, outcome } = applyInput(game.play, {
            cell,
            digit,
            notesMode: false,
            givens: parsedGivens(game),
            solution: parsedSolution(game),
          });
          let next: ActiveGame = { ...game, play: state, selectedCell: cell };
          if (outcome === 'won') next = finalize(next, 'won');
          set({ game: next });
          return outcome;
        },

        clearHintWrongCell: (cell) =>
          withGame((game) => {
            if (game.status !== 'playing') return game;
            const { state } = applyErase(game.play, cell, parsedGivens(game));
            return { ...game, play: state, selectedCell: cell };
          }),

        clearGame: () => set({ game: null }),
      };
    },
    {
      name: 'game-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      // l'undo ne survit pas à un kill : on ne persiste pas la pile
      partialize: (state) => ({
        game:
          state.game === null
            ? null
            : { ...state.game, play: { ...state.game.play, undoStack: [] } },
      }),
      merge: (persisted, current) => {
        // données disque = entrée non fiable : validation + chrono remis en pause
        // (un runStartedAt d'avant le kill gonflerait la durée de tout l'arrêt)
        if (typeof persisted !== 'object' || persisted === null || !('game' in persisted)) {
          return current;
        }
        const game = persisted.game;
        if (!isPersistedGame(game)) return current;
        return { ...current, game: { ...game, runStartedAt: null } };
      },
    },
  ),
);

function isNumberArray(value: unknown, length: number): value is number[] {
  return (
    Array.isArray(value) && value.length === length && value.every((v) => typeof v === 'number')
  );
}

function isPersistedGame(value: unknown): value is ActiveGame {
  if (typeof value !== 'object' || value === null) return false;
  const candidate: Record<string, unknown> = { ...value };
  const puzzle = candidate.puzzle;
  if (typeof puzzle !== 'object' || puzzle === null) return false;
  const puzzleRecord: Record<string, unknown> = { ...puzzle };
  const play = candidate.play;
  if (typeof play !== 'object' || play === null) return false;
  const playRecord: Record<string, unknown> = { ...play };
  return (
    typeof candidate.gameId === 'string' &&
    typeof puzzleRecord.id === 'string' &&
    typeof puzzleRecord.givens === 'string' &&
    puzzleRecord.givens.length === 81 &&
    typeof puzzleRecord.solution === 'string' &&
    puzzleRecord.solution.length === 81 &&
    (puzzleRecord.difficulty === 'easy' ||
      puzzleRecord.difficulty === 'medium' ||
      puzzleRecord.difficulty === 'hard' ||
      puzzleRecord.difficulty === 'expert') &&
    (candidate.mode === 'classic' || candidate.mode === 'daily') &&
    (candidate.dailyDate === null || typeof candidate.dailyDate === 'string') &&
    (candidate.status === 'playing' || candidate.status === 'won' || candidate.status === 'lost') &&
    isNumberArray(playRecord.cells, 81) &&
    isNumberArray(playRecord.notes, 81) &&
    typeof playRecord.mistakes === 'number' &&
    Array.isArray(playRecord.undoStack) &&
    typeof candidate.hintsUsed === 'number' &&
    typeof candidate.continueUsed === 'boolean' &&
    typeof candidate.elapsedMs === 'number'
  );
}
