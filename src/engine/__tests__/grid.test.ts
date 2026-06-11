import {
  cellAt,
  emptyCells,
  findConflicts,
  isComplete,
  isSolved,
  parseGrid,
  PEERS,
  serializeGrid,
  UNITS,
  withCell,
} from '@/engine';

import { EASY_PUZZLE, EASY_SOLUTION } from './fixtures';

describe('parseGrid / serializeGrid', () => {
  it('fait un aller-retour sans perte sur une grille connue', () => {
    expect(serializeGrid(parseGrid(EASY_PUZZLE))).toBe(EASY_PUZZLE);
  });

  it("accepte '.' comme case vide", () => {
    const dots = EASY_PUZZLE.replaceAll('0', '.');
    expect(serializeGrid(parseGrid(dots))).toBe(EASY_PUZZLE);
  });

  it('rejette une longueur invalide', () => {
    expect(() => parseGrid('123')).toThrow('expected 81 chars');
  });

  it('rejette un caractère invalide', () => {
    expect(() => parseGrid('x' + EASY_PUZZLE.slice(1))).toThrow('unexpected char');
  });
});

describe('unités et pairs', () => {
  it('définit 27 unités de 9 cases', () => {
    expect(UNITS).toHaveLength(27);
    for (const unit of UNITS) expect(unit.cells).toHaveLength(9);
  });

  it('donne 20 pairs par case', () => {
    for (const peers of PEERS) expect(peers).toHaveLength(20);
  });

  it('les pairs de la case 0 couvrent sa ligne, sa colonne et sa boîte', () => {
    const peers = PEERS[0];
    expect(peers).toEqual(
      expect.arrayContaining([1, 8, cellAt(1, 0), cellAt(8, 0), cellAt(1, 1), cellAt(2, 2)]),
    );
  });
});

describe('findConflicts', () => {
  it('ne trouve aucun conflit dans une grille valide', () => {
    expect(findConflicts(parseGrid(EASY_PUZZLE))).toHaveLength(0);
    expect(findConflicts(parseGrid(EASY_SOLUTION))).toHaveLength(0);
  });

  it('détecte les deux cases d’un doublon de ligne', () => {
    const grid = withCell(parseGrid(EASY_PUZZLE), cellAt(0, 0), 3);
    // la ligne 0 contient déjà un 3 en colonne 2
    expect(findConflicts(grid)).toEqual([cellAt(0, 0), cellAt(0, 2)]);
  });
});

describe('isComplete / isSolved', () => {
  it('reconnaît une solution valide', () => {
    const solution = parseGrid(EASY_SOLUTION);
    expect(isComplete(solution)).toBe(true);
    expect(isSolved(solution)).toBe(true);
  });

  it('refuse une grille incomplète', () => {
    expect(isSolved(parseGrid(EASY_PUZZLE))).toBe(false);
  });

  it('refuse une grille complète mais contradictoire', () => {
    const solution = parseGrid(EASY_SOLUTION);
    const corrupted = withCell(solution, 0, solution[1]);
    expect(isComplete(corrupted)).toBe(true);
    expect(isSolved(corrupted)).toBe(false);
  });
});

describe('withCell / emptyCells', () => {
  it('ne mute pas la grille d’origine', () => {
    const grid = parseGrid(EASY_PUZZLE);
    const next = withCell(grid, 0, 4);
    expect(grid[0]).toBe(0);
    expect(next[0]).toBe(4);
  });

  it('liste exactement les cases vides', () => {
    const grid = parseGrid(EASY_PUZZLE);
    const empties = emptyCells(grid);
    expect(empties).toHaveLength([...EASY_PUZZLE].filter((c) => c === '0').length);
    for (const cell of empties) expect(grid[cell]).toBe(0);
  });
});
