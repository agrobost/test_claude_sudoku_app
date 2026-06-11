import { countSolutions, isSolved, parseGrid, serializeGrid, solve, withCell } from '@/engine';

import { EASY_PUZZLE, EASY_SOLUTION, HARD_PUZZLE } from './fixtures';

describe('solve', () => {
  it('résout une grille connue vers sa solution unique', () => {
    const result = solve(parseGrid(EASY_PUZZLE));
    expect(result).not.toBeNull();
    expect(result?.unique).toBe(true);
    expect(serializeGrid(result?.solution ?? [])).toBe(EASY_SOLUTION);
  });

  it('résout une grille très difficile (backtracking pur) en restant cohérent avec les givens', () => {
    const givens = parseGrid(HARD_PUZZLE);
    const result = solve(givens);
    expect(result).not.toBeNull();
    expect(result?.unique).toBe(true);
    const solution = result?.solution ?? [];
    expect(isSolved(solution)).toBe(true);
    givens.forEach((value, cell) => {
      if (value !== 0) expect(solution[cell]).toBe(value);
    });
  });

  it('renvoie la grille elle-même pour une solution déjà complète', () => {
    const result = solve(parseGrid(EASY_SOLUTION));
    expect(result?.unique).toBe(true);
    expect(serializeGrid(result?.solution ?? [])).toBe(EASY_SOLUTION);
  });

  it('signale la non-unicité d’une grille sous-contrainte', () => {
    const underConstrained = parseGrid('123456789'.padEnd(81, '0'));
    const result = solve(underConstrained);
    expect(result).not.toBeNull();
    expect(result?.unique).toBe(false);
  });

  it('renvoie null pour une grille avec conflit visible', () => {
    const grid = withCell(parseGrid(EASY_PUZZLE), 0, 3); // doublon de 3 en ligne 0
    expect(solve(grid)).toBeNull();
    expect(countSolutions(grid)).toBe(0);
  });

  it('renvoie null pour une grille sans conflit visible mais insoluble', () => {
    // ligne 0 : 1..8 placés, et un 9 bloque la colonne de la dernière case
    const unsolvable = parseGrid('12345678' + '0'.repeat(9) + '9' + '0'.repeat(63));
    expect(solve(unsolvable)).toBeNull();
  });
});

describe('countSolutions', () => {
  it('compte exactement 1 pour une grille bien posée', () => {
    expect(countSolutions(parseGrid(EASY_PUZZLE))).toBe(1);
  });

  it('s’arrête à la limite demandée sur une grille ouverte', () => {
    const empty = parseGrid('0'.repeat(81));
    expect(countSolutions(empty)).toBe(2);
    expect(countSolutions(empty, 5)).toBe(5);
  });
});
