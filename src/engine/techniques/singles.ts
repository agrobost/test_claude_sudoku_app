import { candidateCount, hasCandidate, type CandidateGrid } from '../candidates';
import { DIGITS, GRID_SIZE, type CellRef } from '../sudoku/types';
import { UNITS } from '../sudoku/units';
import { type TechniqueHint } from './types';

/** Naked single : une case n'a plus qu'un seul candidat. */
export function findNakedSingle(candidates: CandidateGrid): TechniqueHint | null {
  for (let cell = 0; cell < GRID_SIZE; cell++) {
    const mask = candidates[cell];
    if (mask === 0 || candidateCount(mask) !== 1) continue;
    const digit = DIGITS[31 - Math.clz32(mask)];
    return {
      technique: 'nakedSingle',
      cells: [cell],
      digits: [digit],
      unit: null,
      placement: { cell, digit },
      eliminations: [],
    };
  }
  return null;
}

/** Hidden single : dans une unité, un chiffre n'a plus qu'une seule case possible. */
export function findHiddenSingle(candidates: CandidateGrid): TechniqueHint | null {
  for (const unit of UNITS) {
    for (const digit of DIGITS) {
      let onlyCell: CellRef | null = null;
      let count = 0;
      for (const cell of unit.cells) {
        const mask = candidates[cell];
        if (mask === 0 || !hasCandidate(mask, digit)) continue;
        count++;
        if (count > 1) break;
        onlyCell = cell;
      }
      if (count !== 1 || onlyCell === null) continue;
      // un seul candidat dans la case : c'est un naked single, déjà couvert
      if (candidateCount(candidates[onlyCell]) === 1) continue;
      return {
        technique: 'hiddenSingle',
        cells: [onlyCell],
        digits: [digit],
        unit,
        placement: { cell: onlyCell, digit },
        eliminations: [],
      };
    }
  }
  return null;
}
