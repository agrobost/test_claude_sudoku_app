import {
  boxOf,
  colOf,
  countSolutions,
  DIGITS,
  GRID_SIZE,
  rowOf,
  type CellValue,
  type Grid,
} from '../../src/engine';

import { shuffled, type Rng } from './rng';

/** Remplit une grille complète valide aléatoire (backtracking, ordre des chiffres mélangé). */
export function fillRandomSolution(rng: Rng): Grid {
  const board: CellValue[] = new Array<CellValue>(GRID_SIZE).fill(0);
  const rowMask = new Array<number>(9).fill(0);
  const colMask = new Array<number>(9).fill(0);
  const boxMask = new Array<number>(9).fill(0);

  const fill = (cell: number): boolean => {
    if (cell === GRID_SIZE) return true;
    const row = rowOf(cell);
    const col = colOf(cell);
    const box = boxOf(cell);
    for (const digit of shuffled(DIGITS, rng)) {
      const bit = 1 << (digit - 1);
      if (((rowMask[row] | colMask[col] | boxMask[box]) & bit) !== 0) continue;
      board[cell] = digit;
      rowMask[row] |= bit;
      colMask[col] |= bit;
      boxMask[box] |= bit;
      if (fill(cell + 1)) return true;
      board[cell] = 0;
      rowMask[row] &= ~bit;
      colMask[col] &= ~bit;
      boxMask[box] &= ~bit;
    }
    return false;
  };

  if (!fill(0)) {
    // impossible sur une grille vide, mais on échoue bruyamment plutôt que silencieusement
    throw new Error('fillRandomSolution: backtracking failed on empty grid');
  }
  return board;
}

/**
 * Creuse une solution complète en retirant des cases (ordre aléatoire, une passe)
 * tant que la solution reste unique, jusqu'à viser `targetGivens` indices.
 * L'unicité est garantie par construction.
 */
export function digPuzzle(solution: Grid, targetGivens: number, rng: Rng): Grid {
  const grid: CellValue[] = [...solution];
  let givens = GRID_SIZE;
  for (const cell of shuffled([...grid.keys()], rng)) {
    if (givens <= targetGivens) break;
    const saved = grid[cell];
    grid[cell] = 0;
    if (countSolutions(grid, 2) !== 1) {
      grid[cell] = saved;
    } else {
      givens--;
    }
  }
  return grid;
}

/** Nombre d'indices (cases non vides). */
export function countGivens(grid: Grid): number {
  return grid.reduce<number>((count, value) => (value === 0 ? count : count + 1), 0);
}
