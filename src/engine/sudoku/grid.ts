import { DIGITS, GRID_SIZE, type CellRef, type CellValue, type Digit, type Grid } from './types';
import { UNITS } from './units';

/**
 * Parse une grille au format 81 caractères ([0-9] ou '.', '0' et '.' = vide).
 * Une chaîne malformée est une corruption de données : erreur inattendue, on lève.
 */
export function parseGrid(input: string): Grid {
  if (input.length !== GRID_SIZE) {
    throw new Error(`Invalid grid string: expected ${GRID_SIZE} chars, got ${input.length}`);
  }
  const cells: CellValue[] = new Array<CellValue>(GRID_SIZE);
  for (let i = 0; i < GRID_SIZE; i++) {
    const char = input[i];
    if (char === '.' || char === '0') {
      cells[i] = 0;
      continue;
    }
    const digit = DIGITS[char.charCodeAt(0) - 49];
    if (digit === undefined) {
      throw new Error(`Invalid grid string: unexpected char "${char}" at index ${i}`);
    }
    cells[i] = digit;
  }
  return cells;
}

/** Sérialise au format de stockage : 81 caractères, '0' pour une case vide. */
export function serializeGrid(grid: Grid): string {
  return grid.map((v) => String(v)).join('');
}

/** Copie immuable avec une case modifiée. */
export function withCell(grid: Grid, cell: CellRef, value: CellValue): Grid {
  const next = [...grid];
  next[cell] = value;
  return next;
}

/** Toutes les cases vides. */
export function emptyCells(grid: Grid): readonly CellRef[] {
  const out: CellRef[] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    if (grid[i] === 0) out.push(i);
  }
  return out;
}

/**
 * Cases participant à un doublon dans au moins une unité
 * (violation visible des contraintes ligne/colonne/boîte).
 */
export function findConflicts(grid: Grid): readonly CellRef[] {
  const conflicts = new Set<CellRef>();
  for (const unit of UNITS) {
    const byDigit = new Map<Digit, CellRef[]>();
    for (const cell of unit.cells) {
      const value = grid[cell];
      if (value === 0) continue;
      const existing = byDigit.get(value);
      if (existing) {
        existing.push(cell);
      } else {
        byDigit.set(value, [cell]);
      }
    }
    for (const cells of byDigit.values()) {
      if (cells.length > 1) {
        for (const cell of cells) conflicts.add(cell);
      }
    }
  }
  return [...conflicts].sort((a, b) => a - b);
}

/** Toutes les cases sont remplies (sans préjuger de la validité). */
export function isComplete(grid: Grid): boolean {
  return grid.every((v) => v !== 0);
}

/** Grille remplie ET sans aucun conflit. */
export function isSolved(grid: Grid): boolean {
  return isComplete(grid) && findConflicts(grid).length === 0;
}
