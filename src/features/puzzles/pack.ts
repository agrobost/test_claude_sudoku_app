import { type Difficulty } from '@/engine';

import packJson from '../../../assets/puzzles/pack.json';

export type PackPuzzle = {
  readonly id: string;
  readonly givens: string;
  readonly solution: string;
  readonly difficulty: Difficulty;
};

function isDifficulty(value: unknown): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard' || value === 'expert';
}

export function isPackPuzzle(value: unknown): value is PackPuzzle {
  if (typeof value !== 'object' || value === null) return false;
  const record: Record<string, unknown> = { ...value };
  return (
    typeof record.id === 'string' &&
    typeof record.givens === 'string' &&
    record.givens.length === 81 &&
    typeof record.solution === 'string' &&
    record.solution.length === 81 &&
    isDifficulty(record.difficulty)
  );
}

function loadPack(): readonly PackPuzzle[] {
  const entries: unknown = packJson.puzzles;
  if (!Array.isArray(entries) || entries.length === 0 || !entries.every(isPackPuzzle)) {
    // pack embarqué dans le binaire : une corruption est un défaut de build
    throw new Error('assets/puzzles/pack.json invalide');
  }
  return entries;
}

/** Pack embarqué : ~60 grilles par difficulté, jouables sans réseau. */
export const PACK_PUZZLES: readonly PackPuzzle[] = loadPack();
