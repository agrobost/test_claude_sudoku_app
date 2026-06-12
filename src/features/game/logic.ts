import {
  DIGITS,
  maskOfDigit,
  PEERS,
  type CellRef,
  type CellValue,
  type Digit,
  type Grid,
} from '@/engine';

/** Règle produit : 3 erreurs = défaite (cf. PRD §6). */
export const MAX_MISTAKES = 3;

const UNDO_LIMIT = 200;

export type MoveSnapshot = {
  readonly cell: CellRef;
  readonly prevValue: CellValue;
  readonly prevNotes: number;
  /** Notes retirées chez les pairs par un placement correct (pour l'undo). */
  readonly clearedPeerNotes: readonly { readonly cell: CellRef; readonly mask: number }[];
};

export type PlayState = {
  readonly cells: readonly CellValue[];
  /** Notes du joueur : bitmask par case (même convention que l'engine). */
  readonly notes: readonly number[];
  readonly mistakes: number;
  readonly undoStack: readonly MoveSnapshot[];
};

export type InputOutcome = 'noop' | 'note' | 'placed' | 'won' | 'mistake' | 'lost';

export function buildPlayState(givens: Grid): PlayState {
  return {
    cells: [...givens],
    notes: new Array<number>(givens.length).fill(0),
    mistakes: 0,
    undoStack: [],
  };
}

export function isEditable(givens: Grid, cell: CellRef): boolean {
  return givens[cell] === 0;
}

export function isWon(cells: readonly CellValue[], solution: Grid): boolean {
  return cells.every((value, cell) => value === solution[cell]);
}

/** Cases dont la valeur contredit la solution (affichées en erreur). */
export function wrongCells(cells: readonly CellValue[], solution: Grid): readonly CellRef[] {
  const out: CellRef[] = [];
  cells.forEach((value, cell) => {
    if (value !== 0 && value !== solution[cell]) out.push(cell);
  });
  return out;
}

/** Occurrences posées par chiffre (le pavé grise un chiffre complet : 9/9). */
export function digitCounts(cells: readonly CellValue[]): ReadonlyMap<Digit, number> {
  const counts = new Map<Digit, number>(DIGITS.map((d) => [d, 0]));
  for (const value of cells) {
    if (value === 0) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function pushSnapshot(stack: readonly MoveSnapshot[], snapshot: MoveSnapshot): MoveSnapshot[] {
  const next = [...stack, snapshot];
  return next.length > UNDO_LIMIT ? next.slice(next.length - UNDO_LIMIT) : next;
}

export type InputParams = {
  readonly cell: CellRef;
  readonly digit: Digit;
  readonly notesMode: boolean;
  readonly givens: Grid;
  readonly solution: Grid;
};

export type InputResult = { readonly state: PlayState; readonly outcome: InputOutcome };

export function applyInput(state: PlayState, params: InputParams): InputResult {
  const { cell, digit, notesMode, givens, solution } = params;
  if (!isEditable(givens, cell)) return { state, outcome: 'noop' };

  if (notesMode) {
    if (state.cells[cell] !== 0) return { state, outcome: 'noop' };
    const snapshot: MoveSnapshot = {
      cell,
      prevValue: 0,
      prevNotes: state.notes[cell],
      clearedPeerNotes: [],
    };
    const notes = [...state.notes];
    notes[cell] ^= maskOfDigit(digit);
    return {
      state: { ...state, notes, undoStack: pushSnapshot(state.undoStack, snapshot) },
      outcome: 'note',
    };
  }

  if (state.cells[cell] === digit) return { state, outcome: 'noop' };

  const snapshotBase = { cell, prevValue: state.cells[cell], prevNotes: state.notes[cell] };
  const cells = [...state.cells];
  const notes = [...state.notes];
  cells[cell] = digit;
  notes[cell] = 0; // une valeur posée remplace les notes de la case

  if (solution[cell] !== digit) {
    const mistakes = state.mistakes + 1;
    return {
      state: {
        cells,
        notes,
        mistakes,
        undoStack: pushSnapshot(state.undoStack, { ...snapshotBase, clearedPeerNotes: [] }),
      },
      outcome: mistakes >= MAX_MISTAKES ? 'lost' : 'mistake',
    };
  }

  // placement correct : nettoie ce chiffre des notes des pairs (undo-able)
  const clearedPeerNotes: { cell: CellRef; mask: number }[] = [];
  const digitMask = maskOfDigit(digit);
  for (const peer of PEERS[cell]) {
    if ((notes[peer] & digitMask) !== 0) {
      clearedPeerNotes.push({ cell: peer, mask: digitMask });
      notes[peer] &= ~digitMask;
    }
  }
  const nextState: PlayState = {
    cells,
    notes,
    mistakes: state.mistakes,
    undoStack: pushSnapshot(state.undoStack, { ...snapshotBase, clearedPeerNotes }),
  };
  return { state: nextState, outcome: isWon(cells, solution) ? 'won' : 'placed' };
}

export type EraseResult = { readonly state: PlayState; readonly outcome: 'noop' | 'erased' };

export function applyErase(state: PlayState, cell: CellRef, givens: Grid): EraseResult {
  if (!isEditable(givens, cell)) return { state, outcome: 'noop' };
  if (state.cells[cell] === 0 && state.notes[cell] === 0) return { state, outcome: 'noop' };

  const snapshot: MoveSnapshot = {
    cell,
    prevValue: state.cells[cell],
    prevNotes: state.notes[cell],
    clearedPeerNotes: [],
  };
  const cells = [...state.cells];
  const notes = [...state.notes];
  cells[cell] = 0;
  notes[cell] = 0;
  return {
    state: { ...state, cells, notes, undoStack: pushSnapshot(state.undoStack, snapshot) },
    outcome: 'erased',
  };
}

/** Annule le dernier coup. Les erreurs comptées ne sont pas remboursées. */
export function applyUndo(state: PlayState): PlayState {
  const snapshot = state.undoStack.at(-1);
  if (snapshot === undefined) return state;

  const cells = [...state.cells];
  const notes = [...state.notes];
  cells[snapshot.cell] = snapshot.prevValue;
  notes[snapshot.cell] = snapshot.prevNotes;
  for (const { cell, mask } of snapshot.clearedPeerNotes) {
    notes[cell] |= mask;
  }
  return { ...state, cells, notes, undoStack: state.undoStack.slice(0, -1) };
}
