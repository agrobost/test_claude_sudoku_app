import { type CandidateGrid } from '../candidates';
import { type CellRef, type Digit } from '../sudoku/types';
import { type Unit } from '../sudoku/units';

/** Aligné sur la colonne `puzzles.max_technique` (+ 'backtracking' / 'none' côté grader). */
export type TechniqueId =
  | 'nakedSingle'
  | 'hiddenSingle'
  | 'nakedPair'
  | 'hiddenPair'
  | 'pointing'
  | 'claiming';

export type Placement = { readonly cell: CellRef; readonly digit: Digit };

export type Elimination = { readonly cell: CellRef; readonly digit: Digit };

export type TechniqueHint = {
  readonly technique: TechniqueId;
  /** Cases à surligner pour expliquer la technique. */
  readonly cells: readonly CellRef[];
  /** Chiffres concernés par la technique. */
  readonly digits: readonly Digit[];
  /** Unité dans laquelle la technique s'observe. */
  readonly unit: Unit | null;
  /** Pour les singles : le chiffre à poser. */
  readonly placement: Placement | null;
  /** Pour les techniques d'élimination : les candidats à barrer. */
  readonly eliminations: readonly Elimination[];
};

/** Un détecteur ne lit que les candidats : case vide ⇔ masque ≠ 0. */
export type TechniqueFinder = (candidates: CandidateGrid) => TechniqueHint | null;
