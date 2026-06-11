import { gradePuzzle, parseGrid, serializeGrid, solve, type Difficulty } from '../../../src/engine';

import pack from '../../../assets/puzzles/pack.json';

function isDifficulty(value: string): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard' || value === 'expert';
}

const puzzles = pack.puzzles.map((p) => {
  if (!isDifficulty(p.difficulty)) {
    throw new Error(`Difficulté inconnue dans le pack : ${p.difficulty}`);
  }
  return { ...p, difficulty: p.difficulty };
});

/**
 * Propriétés du pack embarqué : ce test re-vérifie chaque grille livrée dans
 * le binaire (solution unique, solution stockée exacte, difficulté du grader).
 * Il protège contre toute régression du moteur ET toute corruption du pack.
 */
describe('assets/puzzles/pack.json', () => {
  it('contient 60 grilles par difficulté, aux ids uniques', () => {
    const counts = new Map<string, number>();
    for (const p of puzzles) counts.set(p.difficulty, (counts.get(p.difficulty) ?? 0) + 1);
    expect(Object.fromEntries(counts)).toEqual({ easy: 60, medium: 60, hard: 60, expert: 60 });
    expect(new Set(puzzles.map((p) => p.id)).size).toBe(puzzles.length);
  });

  it('chaque grille a une solution unique, égale à la solution stockée', () => {
    for (const p of puzzles) {
      const result = solve(parseGrid(p.givens));
      expect(result?.unique).toBe(true);
      expect(serializeGrid(result?.solution ?? [])).toBe(p.solution);
    }
  });

  it('chaque grille est bien de la difficulté annoncée par le grader', () => {
    for (const p of puzzles) {
      expect(gradePuzzle(parseGrid(p.givens))?.difficulty).toBe(p.difficulty);
    }
  });
});
