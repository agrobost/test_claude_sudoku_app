import { DIGITS, GRID_SIZE, type Digit, type Grid } from './sudoku/types';
import { PEERS } from './sudoku/units';

/**
 * Candidats par case sous forme de bitmask (bit d-1 = chiffre d possible).
 * Une case remplie a un masque à 0 : « case vide » ⇔ masque ≠ 0.
 */
export type CandidateGrid = readonly number[];

export const ALL_CANDIDATES = 0x1ff;

export function maskOfDigit(digit: Digit): number {
  return 1 << (digit - 1);
}

export function hasCandidate(mask: number, digit: Digit): boolean {
  return (mask & maskOfDigit(digit)) !== 0;
}

export function candidateCount(mask: number): number {
  let n = mask;
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}

export function digitsOfMask(mask: number): readonly Digit[] {
  return DIGITS.filter((d) => hasCandidate(mask, d));
}

/** Candidats déduits uniquement des contraintes ligne/colonne/boîte. */
export function computeCandidates(grid: Grid): CandidateGrid {
  const candidates: number[] = new Array<number>(GRID_SIZE).fill(0);
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    if (grid[cell] !== 0) continue;
    let used = 0;
    for (const peer of PEERS[cell]) {
      const value = grid[peer];
      if (value !== 0) used |= maskOfDigit(value);
    }
    candidates[cell] = ~used & ALL_CANDIDATES;
  }
  return candidates;
}
