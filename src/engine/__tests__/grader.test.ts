import { gradePuzzle, gradePuzzleString, parseGrid } from '@/engine';

import { EASY_PUZZLE, EASY_SOLUTION, HARD_PUZZLE } from './fixtures';

describe('gradePuzzle', () => {
  it('note une grille résoluble aux singles comme easy', () => {
    expect(gradePuzzleString(EASY_PUZZLE)).toEqual({
      difficulty: 'easy',
      maxTechnique: 'nakedSingle',
    });
  });

  it('note expert une grille qui résiste aux techniques humaines du moteur', () => {
    expect(gradePuzzleString(HARD_PUZZLE)).toEqual({
      difficulty: 'expert',
      maxTechnique: 'backtracking',
    });
  });

  it('refuse une grille sans solution unique', () => {
    expect(gradePuzzleString('123456789'.padEnd(81, '0'))).toBeNull();
  });

  it('refuse une grille insoluble', () => {
    expect(gradePuzzleString('11'.padEnd(81, '0'))).toBeNull();
  });

  it('note une grille déjà complète sans technique', () => {
    expect(gradePuzzle(parseGrid(EASY_SOLUTION))).toEqual({
      difficulty: 'easy',
      maxTechnique: 'none',
    });
  });
});
