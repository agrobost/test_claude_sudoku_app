import {
  applyHintToCandidates,
  computeCandidates,
  digitsOfMask,
  findHint,
  parseGrid,
  withCell,
} from '@/engine';

import { EASY_PUZZLE, EASY_SOLUTION } from './fixtures';

const puzzle = parseGrid(EASY_PUZZLE);
const solution = parseGrid(EASY_SOLUTION);

describe('findHint', () => {
  it('signale d’abord une saisie fausse, avant toute technique', () => {
    const cell = 1; // case vide : solution = 8
    const wrong = withCell(puzzle, cell, 5);
    expect(findHint(wrong, solution)).toEqual({ kind: 'wrongCell', cell });
  });

  it('propose une technique dont le placement respecte la solution', () => {
    const hint = findHint(puzzle, solution);
    expect(hint?.kind).toBe('technique');
    if (hint?.kind !== 'technique') return;
    expect(hint.technique).toBe('nakedSingle');
    expect(hint.placement).toEqual({ cell: 41, digit: solution[41] });
  });

  it('révèle la case la plus contrainte quand aucune technique ne s’applique', () => {
    // grille vide : 9 candidats partout, aucune technique possible
    const empty = parseGrid('0'.repeat(81));
    expect(findHint(empty, solution)).toEqual({ kind: 'revealCell', cell: 0, digit: solution[0] });
  });

  it('renvoie null sur une grille terminée', () => {
    expect(findHint(solution, solution)).toBeNull();
  });

  it('mène à la solution complète en appliquant tous les indices', () => {
    let grid = puzzle;
    let guard = 200;
    for (;;) {
      const hint = findHint(grid, solution);
      if (hint === null) break;
      expect(hint.kind).not.toBe('wrongCell');
      if (hint.kind === 'technique' && hint.placement !== null) {
        grid = withCell(grid, hint.placement.cell, hint.placement.digit);
      } else if (hint.kind === 'revealCell') {
        grid = withCell(grid, hint.cell, hint.digit);
      }
      guard--;
      expect(guard).toBeGreaterThan(0);
    }
    expect(grid).toEqual(solution);
  });
});

describe('applyHintToCandidates', () => {
  it('retire le chiffre placé des candidats des pairs', () => {
    const candidates = computeCandidates(puzzle);
    const hint = findHint(puzzle, solution);
    if (hint?.kind !== 'technique' || hint.placement === null) {
      throw new Error('le premier indice attendu est un placement');
    }
    const next = applyHintToCandidates(candidates, hint);
    expect(next[hint.placement.cell]).toBe(0);
    // un pair de la case 41 (ligne 4) perd le candidat 4
    expect(digitsOfMask(next[38] ?? 0)).not.toContain(hint.placement.digit);
    // immuabilité
    expect(candidates[hint.placement.cell]).not.toBe(0);
  });

  it('applique une révélation comme un placement', () => {
    const empty = parseGrid('0'.repeat(81));
    const candidates = computeCandidates(empty);
    const next = applyHintToCandidates(candidates, { kind: 'revealCell', cell: 0, digit: 4 });
    expect(next[0]).toBe(0);
    expect(digitsOfMask(next[1] ?? 0)).not.toContain(4);
  });

  it('applique les éliminations d’une technique sans placement', () => {
    const empty = parseGrid('0'.repeat(81));
    const candidates = computeCandidates(empty);
    const next = applyHintToCandidates(candidates, {
      kind: 'technique',
      technique: 'nakedPair',
      cells: [0, 1],
      digits: [4, 5],
      unit: null,
      placement: null,
      eliminations: [
        { cell: 2, digit: 4 },
        { cell: 2, digit: 5 },
      ],
    });
    expect(digitsOfMask(next[2] ?? 0)).toEqual([1, 2, 3, 6, 7, 8, 9]);
  });

  it('laisse les candidats intacts pour une saisie fausse', () => {
    const candidates = computeCandidates(puzzle);
    const next = applyHintToCandidates(candidates, { kind: 'wrongCell', cell: 1 });
    expect(next).toEqual(candidates);
  });
});

describe('findHint avec candidats fournis', () => {
  it('repart de l’état de candidats transmis par l’appelant', () => {
    const empty = parseGrid('0'.repeat(81));
    // on force un état où la case 7 n'a plus qu'un candidat
    const threaded = computeCandidates(empty).map((mask, cell) => (cell === 7 ? 0b100 : mask));
    const hint = findHint(empty, solution, threaded);
    expect(hint).toEqual(
      expect.objectContaining({
        kind: 'technique',
        technique: 'nakedSingle',
        placement: { cell: 7, digit: 3 },
      }),
    );
  });
});
