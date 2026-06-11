import {
  candidateCount,
  digitsOfMask,
  hasCandidate,
  maskOfDigit,
  type CandidateGrid,
} from '../candidates';
import { DIGITS, type CellRef, type Digit } from '../sudoku/types';
import { UNITS } from '../sudoku/units';
import { type Elimination, type TechniqueHint } from './types';

/**
 * Naked pair : deux cases d'une unité partagent exactement les deux mêmes candidats,
 * qui peuvent donc être éliminés du reste de l'unité.
 */
export function findNakedPair(candidates: CandidateGrid): TechniqueHint | null {
  for (const unit of UNITS) {
    const pairCells = unit.cells.filter((cell) => candidateCount(candidates[cell]) === 2);
    for (let i = 0; i < pairCells.length; i++) {
      for (let j = i + 1; j < pairCells.length; j++) {
        const a = pairCells[i];
        const b = pairCells[j];
        const mask = candidates[a];
        if (mask !== candidates[b]) continue;
        const eliminations: Elimination[] = [];
        for (const cell of unit.cells) {
          if (cell === a || cell === b) continue;
          const other = candidates[cell];
          if (other === 0) continue;
          for (const digit of digitsOfMask(mask)) {
            if (hasCandidate(other, digit)) eliminations.push({ cell, digit });
          }
        }
        if (eliminations.length === 0) continue;
        return {
          technique: 'nakedPair',
          cells: [a, b],
          digits: digitsOfMask(mask),
          unit,
          placement: null,
          eliminations,
        };
      }
    }
  }
  return null;
}

/**
 * Hidden pair : dans une unité, deux chiffres ne sont possibles que dans les deux
 * mêmes cases ; les autres candidats de ces deux cases peuvent être éliminés.
 */
export function findHiddenPair(candidates: CandidateGrid): TechniqueHint | null {
  for (const unit of UNITS) {
    const entries: { digit: Digit; cells: readonly CellRef[] }[] = [];
    for (const digit of DIGITS) {
      const cells = unit.cells.filter((cell) => {
        const mask = candidates[cell];
        return mask !== 0 && hasCandidate(mask, digit);
      });
      if (cells.length === 2) entries.push({ digit, cells });
    }
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const first = entries[i];
        const second = entries[j];
        if (first.cells[0] !== second.cells[0] || first.cells[1] !== second.cells[1]) continue;
        const pairMask = maskOfDigit(first.digit) | maskOfDigit(second.digit);
        const eliminations: Elimination[] = [];
        for (const cell of first.cells) {
          for (const digit of digitsOfMask(candidates[cell] & ~pairMask)) {
            eliminations.push({ cell, digit });
          }
        }
        if (eliminations.length === 0) continue;
        return {
          technique: 'hiddenPair',
          cells: [...first.cells],
          digits: [first.digit, second.digit],
          unit,
          placement: null,
          eliminations,
        };
      }
    }
  }
  return null;
}
