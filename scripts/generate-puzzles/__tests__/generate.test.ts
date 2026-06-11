import { countSolutions, isSolved, parseGrid, serializeGrid, solve } from '../../../src/engine';
import { countGivens, digPuzzle, fillRandomSolution } from '../generate';
import { mulberry32, randomInt, shuffled } from '../rng';

describe('mulberry32', () => {
  it('est déterministe à seed égal', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('diverge entre deux seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('reste dans [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randomInt / shuffled', () => {
  it('respecte les bornes incluses', () => {
    const rng = mulberry32(9);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(rng, 3, 6));
    expect([...seen].sort()).toEqual([3, 4, 5, 6]);
  });

  it('mélange en conservant le multiset, sans muter l’entrée', () => {
    const rng = mulberry32(11);
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const out = shuffled(input, rng);
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});

describe('fillRandomSolution', () => {
  it('produit une grille complète valide', () => {
    expect(isSolved(fillRandomSolution(mulberry32(5)))).toBe(true);
  });

  it('varie selon le seed et se reproduit à seed égal', () => {
    const a = serializeGrid(fillRandomSolution(mulberry32(1)));
    const b = serializeGrid(fillRandomSolution(mulberry32(2)));
    const c = serializeGrid(fillRandomSolution(mulberry32(1)));
    expect(a).not.toBe(b);
    expect(a).toBe(c);
  });
});

describe('digPuzzle', () => {
  it('préserve l’unicité de la solution et la cohérence avec la grille pleine', () => {
    const rng = mulberry32(21);
    const solution = fillRandomSolution(rng);
    const puzzle = digPuzzle(solution, 30, rng);

    expect(countSolutions(puzzle)).toBe(1);
    expect(serializeGrid(solve(puzzle)?.solution ?? [])).toBe(serializeGrid(solution));
    // les givens sont un sous-ensemble de la solution
    puzzle.forEach((value, cell) => {
      if (value !== 0) expect(value).toBe(solution[cell]);
    });
  });

  it('ne descend jamais sous la cible d’indices', () => {
    const rng = mulberry32(33);
    const solution = fillRandomSolution(rng);
    const puzzle = digPuzzle(solution, 40, rng);
    expect(countGivens(puzzle)).toBeGreaterThanOrEqual(40);
  });
});

describe('format des fixtures', () => {
  it('parseGrid accepte les sorties du générateur', () => {
    const rng = mulberry32(55);
    const grid = digPuzzle(fillRandomSolution(rng), 30, rng);
    expect(serializeGrid(parseGrid(serializeGrid(grid)))).toBe(serializeGrid(grid));
  });
});
