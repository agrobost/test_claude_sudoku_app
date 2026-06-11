import { findConflicts } from '../sudoku/grid';
import { DIGITS, GRID_SIZE, type CellValue, type Grid } from '../sudoku/types';
import { boxOf, colOf, rowOf } from '../sudoku/units';

export type SolveResult = {
  readonly solution: Grid;
  /** true si la grille n'admet qu'une seule solution. */
  readonly unique: boolean;
};

const ALL_DIGITS_MASK = 0x1ff; // bits 0..8 = chiffres 1..9

type SearchState = {
  board: Uint8Array;
  rowMask: number[];
  colMask: number[];
  boxMask: number[];
  found: Uint8Array | null;
  count: number;
  limit: number;
};

function bitCount(mask: number): number {
  let n = mask;
  let count = 0;
  while (n !== 0) {
    n &= n - 1;
    count++;
  }
  return count;
}

function candidatesMaskAt(state: SearchState, cell: number): number {
  const used = state.rowMask[rowOf(cell)] | state.colMask[colOf(cell)] | state.boxMask[boxOf(cell)];
  return ~used & ALL_DIGITS_MASK;
}

function search(state: SearchState): void {
  if (state.count >= state.limit) return;

  // MRV : la case vide la plus contrainte d'abord
  let bestCell = -1;
  let bestMask = 0;
  let bestSize = 10;
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    if (state.board[cell] !== 0) continue;
    const mask = candidatesMaskAt(state, cell);
    const size = bitCount(mask);
    if (size === 0) return; // impasse
    if (size < bestSize) {
      bestCell = cell;
      bestMask = mask;
      bestSize = size;
      if (size === 1) break;
    }
  }

  if (bestCell === -1) {
    // plus de case vide : solution trouvée
    state.count++;
    if (state.found === null) state.found = Uint8Array.from(state.board);
    return;
  }

  const row = rowOf(bestCell);
  const col = colOf(bestCell);
  const box = boxOf(bestCell);
  for (let digit = 1; digit <= 9; digit++) {
    const bit = 1 << (digit - 1);
    if ((bestMask & bit) === 0) continue;
    state.board[bestCell] = digit;
    state.rowMask[row] |= bit;
    state.colMask[col] |= bit;
    state.boxMask[box] |= bit;
    search(state);
    state.board[bestCell] = 0;
    state.rowMask[row] &= ~bit;
    state.colMask[col] &= ~bit;
    state.boxMask[box] &= ~bit;
    if (state.count >= state.limit) return;
  }
}

function makeState(grid: Grid, limit: number): SearchState {
  const state: SearchState = {
    board: Uint8Array.from(grid),
    rowMask: new Array<number>(9).fill(0),
    colMask: new Array<number>(9).fill(0),
    boxMask: new Array<number>(9).fill(0),
    found: null,
    count: 0,
    limit,
  };
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    const value = grid[cell];
    if (value === 0) continue;
    const bit = 1 << (value - 1);
    state.rowMask[rowOf(cell)] |= bit;
    state.colMask[colOf(cell)] |= bit;
    state.boxMask[boxOf(cell)] |= bit;
  }
  return state;
}

/**
 * Compte les solutions en s'arrêtant à `limit` (2 suffit pour tester l'unicité).
 * Une grille contenant un conflit visible a 0 solution.
 */
export function countSolutions(grid: Grid, limit = 2): number {
  if (findConflicts(grid).length > 0) return 0;
  const state = makeState(grid, limit);
  search(state);
  return state.count;
}

/**
 * Résout par backtracking (heuristique MRV) et teste l'unicité.
 * Retourne null si la grille est invalide ou sans solution.
 */
export function solve(grid: Grid): SolveResult | null {
  if (findConflicts(grid).length > 0) return null;
  const state = makeState(grid, 2);
  search(state);
  if (state.found === null) return null;
  const solution: CellValue[] = [];
  for (const value of state.found) {
    const digit = DIGITS[value - 1];
    if (digit === undefined) {
      throw new Error(`Solver invariant violated: cell value ${value}`);
    }
    solution.push(digit);
  }
  return { solution, unique: state.count === 1 };
}
