import {
  candidateCount,
  computeCandidates,
  maskOfDigit,
  type CandidateGrid,
} from '../candidates';
import { GRID_SIZE, type CellRef, type Digit, type Grid } from '../sudoku/types';
import { PEERS } from '../sudoku/units';
import { TECHNIQUES } from '../techniques';
import { type TechniqueHint } from '../techniques/types';

export type Hint =
  /** Une saisie contredit la solution : la montrer avant toute pédagogie. */
  | { readonly kind: 'wrongCell'; readonly cell: CellRef }
  /** Une technique humaine s'applique : l'expliquer. */
  | ({ readonly kind: 'technique' } & TechniqueHint)
  /** Aucune technique connue : révéler la case la plus contrainte. */
  | { readonly kind: 'revealCell'; readonly cell: CellRef; readonly digit: Digit };

/**
 * Indice pédagogique suivant. `solution` est la solution stockée du puzzle.
 * `candidates` permet de chaîner les indices d'élimination (l'appelant rejoue
 * les éliminations déjà expliquées via applyHintToCandidates) ; par défaut les
 * candidats sont recalculés depuis la grille.
 * Retourne null si la grille est terminée.
 */
export function findHint(grid: Grid, solution: Grid, candidates?: CandidateGrid): Hint | null {
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    const value = grid[cell];
    if (value !== 0 && value !== solution[cell]) {
      return { kind: 'wrongCell', cell };
    }
  }

  const state = candidates ?? computeCandidates(grid);

  for (const { find } of TECHNIQUES) {
    const hit = find(state);
    if (hit !== null) return { kind: 'technique', ...hit };
  }

  // fallback : révéler la case vide la plus contrainte (déterministe)
  let bestCell: CellRef | null = null;
  let bestSize = 10;
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    if (grid[cell] !== 0) continue;
    const size = candidateCount(state[cell]);
    if (size > 0 && size < bestSize) {
      bestCell = cell;
      bestSize = size;
    }
  }
  if (bestCell === null) return null; // grille terminée

  const digit = solution[bestCell];
  if (digit === 0) return null; // solution incohérente : pas d'indice possible
  return { kind: 'revealCell', cell: bestCell, digit };
}

/**
 * Applique un indice à un état de candidats (immuable) : à utiliser par
 * l'appelant pour que les indices d'élimination successifs progressent.
 */
export function applyHintToCandidates(candidates: CandidateGrid, hint: Hint): CandidateGrid {
  const next = [...candidates];

  const place = (cell: CellRef, digit: Digit): void => {
    next[cell] = 0;
    for (const peer of PEERS[cell]) {
      next[peer] &= ~maskOfDigit(digit);
    }
  };

  if (hint.kind === 'revealCell') {
    place(hint.cell, hint.digit);
  } else if (hint.kind === 'technique') {
    if (hint.placement !== null) {
      place(hint.placement.cell, hint.placement.digit);
    }
    for (const { cell, digit } of hint.eliminations) {
      next[cell] &= ~maskOfDigit(digit);
    }
  }
  return next;
}
