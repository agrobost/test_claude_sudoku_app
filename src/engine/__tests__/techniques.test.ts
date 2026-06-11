import {
  ALL_CANDIDATES,
  cellAt,
  computeCandidates,
  digitsOfMask,
  findClaiming,
  findHiddenPair,
  findHiddenSingle,
  findNakedPair,
  findNakedSingle,
  findPointing,
  maskOfDigit,
  parseGrid,
  withCell,
  type CandidateGrid,
  type Digit,
} from '@/engine';

import { EASY_SOLUTION } from './fixtures';

function maskOf(...digits: Digit[]): number {
  return digits.reduce((mask, d) => mask | maskOfDigit(d), 0);
}

/** Grille de candidats synthétique : un masque par défaut + des cases imposées. */
function syntheticCandidates(
  defaultMask: number,
  overrides: Record<number, number>,
): CandidateGrid {
  const masks = new Array<number>(81).fill(defaultMask);
  for (const [cell, mask] of Object.entries(overrides)) {
    masks[Number(cell)] = mask;
  }
  return masks;
}

describe('computeCandidates', () => {
  it('donne 9 candidats partout sur une grille vide et 0 sur une case remplie', () => {
    const empty = parseGrid('0'.repeat(81));
    expect(computeCandidates(empty).every((m) => m === ALL_CANDIDATES)).toBe(true);

    const withOne = withCell(empty, 0, 5);
    const candidates = computeCandidates(withOne);
    expect(candidates[0]).toBe(0);
    // ses 20 pairs perdent le 5
    expect(digitsOfMask(candidates[1] ?? 0)).not.toContain(5);
    expect(digitsOfMask(candidates[9] ?? 0)).not.toContain(5);
    // une case hors ligne/colonne/boîte le garde
    expect(digitsOfMask(candidates[cellAt(4, 4)] ?? 0)).toContain(5);
  });
});

describe('findNakedSingle', () => {
  it('trouve la case à candidat unique', () => {
    const candidates = syntheticCandidates(maskOf(1, 2, 3), { 40: maskOf(7) });
    const hint = findNakedSingle(candidates);
    expect(hint?.placement).toEqual({ cell: 40, digit: 7 });
    expect(hint?.cells).toEqual([40]);
  });

  it('ne trouve rien quand toutes les cases ont plusieurs candidats', () => {
    expect(findNakedSingle(syntheticCandidates(maskOf(1, 2), {}))).toBeNull();
  });
});

describe('findHiddenSingle', () => {
  it('trouve le chiffre qui n’a plus qu’une case dans une unité', () => {
    // ligne 0 : le 7 n'est possible qu'en case 3 (qui a pourtant 2 candidats)
    const candidates = syntheticCandidates(maskOf(1, 2, 3), { 3: maskOf(1, 7) });
    const hint = findHiddenSingle(candidates);
    expect(hint?.placement).toEqual({ cell: 3, digit: 7 });
    expect(hint?.unit?.kind).toBe('row');
    expect(hint?.unit?.index).toBe(0);
  });

  it('laisse le naked single à sa technique dédiée', () => {
    const candidates = syntheticCandidates(maskOf(1, 2, 3), { 3: maskOf(7) });
    expect(findHiddenSingle(candidates)?.placement?.cell).not.toBe(3);
  });
});

describe('findNakedPair', () => {
  it('élimine les candidats de la paire dans le reste de l’unité', () => {
    const candidates = syntheticCandidates(maskOf(4, 5, 6), {
      0: maskOf(4, 5),
      1: maskOf(4, 5),
    });
    const hint = findNakedPair(candidates);
    expect(hint?.cells).toEqual([0, 1]);
    expect(hint?.digits).toEqual([4, 5]);
    // 7 autres cases de la ligne 0 × 2 chiffres
    expect(hint?.eliminations).toHaveLength(14);
    expect(hint?.eliminations).toContainEqual({ cell: 5, digit: 4 });
  });

  it('ignore une paire sans aucune élimination possible', () => {
    const candidates = syntheticCandidates(maskOf(1, 2, 3), {
      0: maskOf(4, 5),
      1: maskOf(4, 5),
    });
    expect(findNakedPair(candidates)).toBeNull();
  });
});

describe('findHiddenPair', () => {
  it('réduit les deux cases aux deux chiffres cachés', () => {
    // ligne 0 : 8 et 9 ne sont possibles qu'en cases 4 et 5
    const candidates = syntheticCandidates(maskOf(1, 2, 3), {
      4: maskOf(1, 8, 9),
      5: maskOf(1, 8, 9),
    });
    const hint = findHiddenPair(candidates);
    expect(hint?.cells).toEqual([4, 5]);
    expect(hint?.digits).toEqual([8, 9]);
    expect(hint?.eliminations).toEqual([
      { cell: 4, digit: 1 },
      { cell: 5, digit: 1 },
    ]);
  });
});

describe('findPointing', () => {
  it('élimine le chiffre du reste de la ligne quand une boîte le confine', () => {
    // boîte 0 : le 6 n'est possible qu'en cases 1 et 2 (ligne 0)
    const base = maskOf(1, 2, 3);
    const candidates = syntheticCandidates(base, {
      1: maskOf(1, 6),
      2: maskOf(2, 6),
      5: maskOf(1, 6),
      8: maskOf(2, 6),
    });
    const hint = findPointing(candidates);
    expect(hint?.technique).toBe('pointing');
    expect(hint?.cells).toEqual([1, 2]);
    expect(hint?.digits).toEqual([6]);
    expect(hint?.eliminations).toEqual([
      { cell: 5, digit: 6 },
      { cell: 8, digit: 6 },
    ]);
  });
});

describe('findClaiming', () => {
  it('élimine le chiffre du reste de la boîte quand une ligne le confine', () => {
    // ligne 4 : le 9 n'est possible qu'en cases 39 et 40 (boîte 4)
    const base = maskOf(1, 2, 3);
    const candidates = syntheticCandidates(base, {
      [cellAt(4, 3)]: maskOf(1, 9),
      [cellAt(4, 4)]: maskOf(2, 9),
      [cellAt(3, 3)]: maskOf(3, 9),
      [cellAt(5, 5)]: maskOf(1, 9),
    });
    const hint = findClaiming(candidates);
    expect(hint?.technique).toBe('claiming');
    expect(hint?.cells).toEqual([cellAt(4, 3), cellAt(4, 4)]);
    expect(hint?.digits).toEqual([9]);
    expect(hint?.eliminations).toEqual([
      { cell: cellAt(3, 3), digit: 9 },
      { cell: cellAt(5, 5), digit: 9 },
    ]);
  });
});

describe('cohérence avec une vraie grille', () => {
  it('le naked single d’une solution trouée se trouve immédiatement', () => {
    const solution = parseGrid(EASY_SOLUTION);
    const holed = withCell(solution, 40, 0);
    const hint = findNakedSingle(computeCandidates(holed));
    expect(hint?.placement).toEqual({ cell: 40, digit: solution[40] });
  });
});
