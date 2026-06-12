import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  applyHintToCandidates,
  computeCandidates,
  findHint,
  parseGrid,
  type CandidateGrid,
  type CellRef,
  type Difficulty,
  type Digit,
  type Grid,
  type Hint,
} from '@/engine';
import { trackEvent } from '@/lib/analytics';
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
  /** Indice affiché (transient : jamais persisté, invalidé par toute saisie). */
  readonly hint: Hint | null;
  /** Candidats chaînés entre indices d'élimination successifs. */
  readonly hintCandidates: CandidateGrid | null;
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
  /** Calcule et affiche l'indice pédagogique suivant (compte un indice utilisé). */
  requestHint: () => Hint | null;
  /** Applique l'indice affiché (placement, correction ou éliminations). */
  applyCurrentHint: () => void;
  dismissHint: () => void;
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
        hint: null,
        hintCandidates: null,

        startGame: (puzzle, mode, dailyDate) => {
          trackEvent({ name: 'game_start', params: { mode, difficulty: puzzle.difficulty } });
          set({
            hint: null,
            hintCandidates: null,
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
          // toute saisie manuelle invalide l'indice affiché et la chaîne de candidats
          set({ game: next, hint: null, hintCandidates: null });
          return outcome;
        },

        erase: () => {
          const { game } = get();
          if (game === null || game.status !== 'playing' || game.selectedCell === null) return;
          const { state } = applyErase(game.play, game.selectedCell, parsedGivens(game));
          set({ game: { ...game, play: state }, hint: null, hintCandidates: null });
        },

        undo: () => {
          const { game } = get();
          if (game === null || game.status !== 'playing') return;
          set({ game: { ...game, play: applyUndo(game.play) }, hint: null, hintCandidates: null });
        },

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

        requestHint: () => {
          const { game, hintCandidates } = get();
          if (game === null || game.status !== 'playing') return null;
          const hint = findHint(game.play.cells, parsedSolution(game), hintCandidates ?? undefined);
          if (hint === null) return null;
          trackEvent({
            name: 'hint_used',
            params: { technique: hint.kind === 'technique' ? hint.technique : hint.kind },
          });
          set({ hint, game: { ...game, hintsUsed: game.hintsUsed + 1 } });
          return hint;
        },

        applyCurrentHint: () => {
          const { game, hint, hintCandidates } = get();
          if (game === null || hint === null || game.status !== 'playing') return;

          if (hint.kind === 'wrongCell') {
            const { state } = applyErase(game.play, hint.cell, parsedGivens(game));
            set({
              game: { ...game, play: state, selectedCell: hint.cell },
              hint: null,
              hintCandidates: null,
            });
            return;
          }

          const placement =
            hint.kind === 'revealCell' ? { cell: hint.cell, digit: hint.digit } : hint.placement;
          if (placement !== null) {
            const { state, outcome } = applyInput(game.play, {
              cell: placement.cell,
              digit: placement.digit,
              notesMode: false,
              givens: parsedGivens(game),
              solution: parsedSolution(game),
            });
            let next: ActiveGame = { ...game, play: state, selectedCell: placement.cell };
            if (outcome === 'won') next = finalize(next, 'won');
            set({ game: next, hint: null, hintCandidates: null });
            return;
          }

          // éliminations seules : on chaîne les candidats pour l'indice suivant
          const base = hintCandidates ?? computeCandidates(game.play.cells);
          set({ hint: null, hintCandidates: applyHintToCandidates(base, hint) });
        },

        dismissHint: () => set({ hint: null }),

        clearGame: () => set({ game: null, hint: null, hintCandidates: null }),
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
