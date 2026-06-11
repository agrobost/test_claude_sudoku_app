import { hasCandidate, type CandidateGrid } from '../candidates';
import { DIGITS, type CellRef, type Digit } from '../sudoku/types';
import { boxOf, colOf, rowOf, UNITS, unitAt, type Unit } from '../sudoku/units';
import { type Elimination, type TechniqueHint } from './types';

function candidatePositions(
  candidates: CandidateGrid,
  unit: Unit,
  digit: Digit,
): readonly CellRef[] {
  return unit.cells.filter((cell) => {
    const mask = candidates[cell];
    return mask !== 0 && hasCandidate(mask, digit);
  });
}

function eliminateFrom(
  candidates: CandidateGrid,
  unit: Unit,
  digit: Digit,
  except: readonly CellRef[],
): readonly Elimination[] {
  const eliminations: Elimination[] = [];
  for (const cell of unit.cells) {
    if (except.includes(cell)) continue;
    const mask = candidates[cell];
    if (mask !== 0 && hasCandidate(mask, digit)) {
      eliminations.push({ cell, digit });
    }
  }
  return eliminations;
}

/**
 * Pointing (box → ligne) : dans une boîte, un chiffre n'est possible que sur une
 * même ligne ou colonne ; il s'élimine du reste de cette ligne/colonne.
 */
export function findPointing(candidates: CandidateGrid): TechniqueHint | null {
  for (const unit of UNITS) {
    if (unit.kind !== 'box') continue;
    for (const digit of DIGITS) {
      const positions = candidatePositions(candidates, unit, digit);
      if (positions.length < 2) continue;

      const first = positions[0];
      const sameRow = positions.every((cell) => rowOf(cell) === rowOf(first));
      const sameCol = positions.every((cell) => colOf(cell) === colOf(first));
      if (!sameRow && !sameCol) continue;

      const line = sameRow ? unitAt('row', rowOf(first)) : unitAt('col', colOf(first));
      const eliminations = eliminateFrom(candidates, line, digit, positions);
      if (eliminations.length === 0) continue;
      return {
        technique: 'pointing',
        cells: positions,
        digits: [digit],
        unit,
        placement: null,
        eliminations,
      };
    }
  }
  return null;
}

/**
 * Claiming (ligne → box) : sur une ligne ou colonne, un chiffre n'est possible
 * que dans une même boîte ; il s'élimine du reste de cette boîte.
 */
export function findClaiming(candidates: CandidateGrid): TechniqueHint | null {
  for (const unit of UNITS) {
    if (unit.kind === 'box') continue;
    for (const digit of DIGITS) {
      const positions = candidatePositions(candidates, unit, digit);
      if (positions.length < 2) continue;

      const first = positions[0];
      const boxIndex = boxOf(first);
      if (!positions.every((cell) => boxOf(cell) === boxIndex)) continue;

      const eliminations = eliminateFrom(candidates, unitAt('box', boxIndex), digit, positions);
      if (eliminations.length === 0) continue;
      return {
        technique: 'claiming',
        cells: positions,
        digits: [digit],
        unit,
        placement: null,
        eliminations,
      };
    }
  }
  return null;
}
