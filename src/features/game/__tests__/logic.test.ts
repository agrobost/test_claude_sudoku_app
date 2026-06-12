import { DIGITS, maskOfDigit, parseGrid, type Digit } from '@/engine';

import {
  applyErase,
  applyInput,
  applyUndo,
  buildPlayState,
  digitCounts,
  isEditable,
  MAX_MISTAKES,
  wrongCells,
  type PlayState,
} from '../logic';

const GIVENS_STR =
  '003020600900305001001806400008102900700000008006708200002609500800203009005010300';
const SOLUTION_STR =
  '483921657967345821251876493548132976729564138136798245372689514814253769695417382';

const givens = parseGrid(GIVENS_STR);
const solution = parseGrid(SOLUTION_STR);

function input(
  state: PlayState,
  cell: number,
  digit: Digit,
  notesMode = false,
): ReturnType<typeof applyInput> {
  return applyInput(state, { cell, digit, notesMode, givens, solution });
}

describe('applyInput — placements', () => {
  it('place un chiffre correct sans erreur', () => {
    const { state, outcome } = input(buildPlayState(givens), 0, 4); // solution[0] = 4
    expect(outcome).toBe('placed');
    expect(state.cells[0]).toBe(4);
    expect(state.mistakes).toBe(0);
  });

  it('compte une erreur quand la saisie contredit la solution, et la laisse affichée', () => {
    const { state, outcome } = input(buildPlayState(givens), 0, 5);
    expect(outcome).toBe('mistake');
    expect(state.cells[0]).toBe(5);
    expect(state.mistakes).toBe(1);
    expect(wrongCells(state.cells, solution)).toEqual([0]);
  });

  it('refuse de modifier une case donnée', () => {
    // case 2 = given '3'
    const { state, outcome } = input(buildPlayState(givens), 2, 5);
    expect(outcome).toBe('noop');
    expect(state.cells[2]).toBe(3);
    expect(isEditable(givens, 2)).toBe(false);
  });

  it('déclare la défaite à la 3e erreur', () => {
    let state = buildPlayState(givens);
    let outcome: string = 'noop';
    // le chiffre 1 est faux pour les cases vides 0, 1 et 3 (solution : 4, 8, 9)
    for (const cell of [0, 1, 3]) {
      ({ state, outcome } = input(state, cell, 1));
    }
    expect(outcome).toBe('lost');
    expect(state.mistakes).toBe(MAX_MISTAKES);
  });

  it('déclare la victoire quand la dernière case correcte est posée', () => {
    let state = buildPlayState(givens);
    let outcome = 'noop';
    givens.forEach((value, cell) => {
      if (value !== 0) return;
      const digit = solution[cell];
      if (digit === 0) throw new Error('solution incomplète');
      ({ state, outcome } = input(state, cell, digit));
    });
    expect(outcome).toBe('won');
  });
});

describe('applyInput — notes', () => {
  it('bascule une note sur une case vide', () => {
    const first = input(buildPlayState(givens), 0, 7, true);
    expect(first.outcome).toBe('note');
    expect(first.state.notes[0]).toBe(maskOfDigit(7));
    const second = input(first.state, 0, 7, true);
    expect(second.state.notes[0]).toBe(0);
  });

  it('nettoie la note du chiffre posé chez les pairs, et l’undo la restaure', () => {
    // note 4 sur la case 1 (même ligne que la case 0)
    const noted = input(buildPlayState(givens), 1, 4, true).state;
    const placed = input(noted, 0, 4).state; // 4 correct en case 0
    expect(placed.notes[1] & maskOfDigit(4)).toBe(0);
    const undone = applyUndo(placed);
    expect(undone.cells[0]).toBe(0);
    expect(undone.notes[1] & maskOfDigit(4)).not.toBe(0);
  });

  it('remplace les notes de la case par la valeur posée', () => {
    const noted = input(buildPlayState(givens), 0, 9, true).state;
    const placed = input(noted, 0, 4).state;
    expect(placed.notes[0]).toBe(0);
  });
});

describe('applyErase / applyUndo', () => {
  it('efface valeur et notes, et l’undo restaure les deux', () => {
    let state = input(buildPlayState(givens), 0, 5).state; // valeur fausse posée
    state = applyErase(state, 0, givens).state;
    expect(state.cells[0]).toBe(0);
    const undone = applyUndo(state);
    expect(undone.cells[0]).toBe(5);
  });

  it('ne rembourse pas les erreurs à l’undo', () => {
    const { state } = input(buildPlayState(givens), 0, 5);
    const undone = applyUndo(state);
    expect(undone.cells[0]).toBe(0);
    expect(undone.mistakes).toBe(1);
  });

  it('est sans effet sur une case donnée ou vide', () => {
    const state = buildPlayState(givens);
    expect(applyErase(state, 2, givens).outcome).toBe('noop');
    expect(applyErase(state, 0, givens).outcome).toBe('noop');
    expect(applyUndo(state)).toBe(state);
  });
});

describe('digitCounts', () => {
  it('compte les occurrences posées par chiffre', () => {
    const counts = digitCounts(solution);
    for (const digit of DIGITS) {
      expect(counts.get(digit)).toBe(9);
    }
    const empty = digitCounts(buildPlayState(givens).cells);
    expect(empty.get(3)).toBe([...GIVENS_STR].filter((c) => c === '3').length);
  });
});
