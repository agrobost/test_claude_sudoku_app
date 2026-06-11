export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 0 = case vide — aligné sur le format de stockage 81 caractères. */
export type CellValue = Digit | 0;

/** Grille en lecture seule de longueur 81, index = row * 9 + col. */
export type Grid = readonly CellValue[];

/** Index de case, 0..80. */
export type CellRef = number;

/** Aligné sur l'enum Postgres `difficulty`. */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const GRID_SIZE = 81;

export const DIGITS: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
