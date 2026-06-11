import { computeCandidates, maskOfDigit } from './candidates';
import { parseGrid, serializeGrid } from './sudoku/grid';
import { type Difficulty, type Digit, type Grid } from './sudoku/types';
import { PEERS } from './sudoku/units';
import { solve } from './solver/solve';
import { TECHNIQUES, type TechniqueId } from './techniques';

export type MaxTechnique = TechniqueId | 'backtracking' | 'none';

export type GradeResult = {
  readonly difficulty: Difficulty;
  /** Technique la plus dure requise pour résoudre sans backtracking. */
  readonly maxTechnique: MaxTechnique;
};

const RANK_TO_DIFFICULTY: Record<0 | 1 | 2 | 3, Difficulty> = {
  0: 'easy',
  1: 'easy',
  2: 'medium',
  3: 'hard',
};

/**
 * Note un puzzle en le résolvant avec les seules techniques humaines du moteur
 * d'indices : la difficulté est la technique la plus dure requise ; un puzzle
 * qui résiste est 'expert' (résolu par backtracking, indices via revealCell).
 * Retourne null si le puzzle n'a pas une solution unique.
 */
export function gradePuzzle(givens: Grid): GradeResult | null {
  const solved = solve(givens);
  if (solved === null || !solved.unique) return null;
  const solution = solved.solution;

  const candidates = [...computeCandidates(givens)];
  let remaining = givens.filter((v) => v === 0).length;
  let maxRank: 0 | 1 | 2 | 3 = 0;
  let maxTechnique: MaxTechnique = 'none';

  const place = (cell: number, digit: Digit): void => {
    // garde-fou : une technique qui contredit la solution est un bug du moteur
    if (solution[cell] !== digit) {
      throw new Error(
        `Grader invariant violated: technique places ${digit} at ${cell} on ${serializeGrid(givens)}`,
      );
    }
    candidates[cell] = 0;
    for (const peer of PEERS[cell]) {
      candidates[peer] &= ~maskOfDigit(digit);
    }
    remaining--;
  };

  while (remaining > 0) {
    let progressed = false;
    for (const { id, rank, find } of TECHNIQUES) {
      const hint = find(candidates);
      if (hint === null) continue;
      if (rank > maxRank) {
        maxRank = rank;
        maxTechnique = id;
      }
      if (hint.placement !== null) {
        place(hint.placement.cell, hint.placement.digit);
      }
      for (const { cell, digit } of hint.eliminations) {
        candidates[cell] &= ~maskOfDigit(digit);
      }
      progressed = true;
      break; // on repart toujours de la technique la plus simple
    }
    if (!progressed) {
      return { difficulty: 'expert', maxTechnique: 'backtracking' };
    }
  }

  return { difficulty: RANK_TO_DIFFICULTY[maxRank], maxTechnique };
}

/** Variante pratique pour les scripts : prend le format 81 caractères. */
export function gradePuzzleString(givens: string): GradeResult | null {
  return gradePuzzle(parseGrid(givens));
}
