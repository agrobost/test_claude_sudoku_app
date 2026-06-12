import { useGameStore, type ActiveGame } from '../game';

import { useHistoryStore, type GameRecord } from './store';

export function recordOf(game: ActiveGame, finishedAt: string): GameRecord {
  return {
    id: game.gameId,
    puzzleId: game.puzzle.id,
    mode: game.mode,
    dailyDate: game.dailyDate,
    difficulty: game.puzzle.difficulty,
    result: game.status === 'won' ? 'won' : 'lost',
    durationMs: Math.max(1, game.elapsedMs),
    mistakes: game.play.mistakes,
    hintsUsed: game.hintsUsed,
    finishedAt,
  };
}

type OnRecorded = (record: GameRecord) => void;

const onRecordedListeners: OnRecorded[] = [];

/** La sync (outbox, E10) et l'analytics s'abonnent ici. */
export function onGameRecorded(listener: OnRecorded): void {
  onRecordedListeners.push(listener);
}

/**
 * Enregistre une partie quand elle QUITTE le store (clearGame ou remplacement
 * par startGame) avec un statut terminal. Enregistrer à la sortie — et non à
 * l'instant de la défaite — laisse la place au « continuer » rewarded (E14)
 * sans jamais produire deux résultats pour la même partie.
 */
export function initGameRecorder(): () => void {
  const finalize = (game: ActiveGame): void => {
    if (game.status === 'playing') return; // partie remplacée sans fin : pas un résultat
    const record = recordOf(game, new Date().toISOString());
    useHistoryStore.getState().upsertRecord(record);
    for (const listener of onRecordedListeners) listener(record);
  };

  return useGameStore.subscribe((state, previousState) => {
    const previous = previousState.game;
    if (previous === null) return;
    const current = state.game;
    if (current === null || current.gameId !== previous.gameId) {
      finalize(previous);
    }
  });
}
