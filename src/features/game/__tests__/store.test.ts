import { parseGrid } from '@/engine';
import { nowMs } from '@/lib/dates';

import { elapsedMsOf, useGameStore, type PuzzleSpec } from '../store';

jest.mock('@/lib/dates', () => ({
  ...jest.requireActual<typeof import('@/lib/dates')>('@/lib/dates'),
  nowMs: jest.fn(() => 0),
}));

const mockedNow = jest.mocked(nowMs);

const PUZZLE: PuzzleSpec = {
  id: 'puzzle-1',
  givens: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
  solution: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
  difficulty: 'easy',
};

const solution = parseGrid(PUZZLE.solution);

function freshStart(): void {
  useGameStore.getState().clearGame();
  mockedNow.mockReturnValue(1_000);
  useGameStore.getState().startGame(PUZZLE, 'classic', null);
}

describe('useGameStore', () => {
  beforeEach(freshStart);

  it('démarre une partie jouable et sélectionne une case', () => {
    const { game, selectCell } = useGameStore.getState();
    expect(game?.status).toBe('playing');
    expect(game?.play.cells[2]).toBe(3); // given
    selectCell(0);
    expect(useGameStore.getState().game?.selectedCell).toBe(0);
  });

  it('compte les erreurs et termine en défaite à la 3e', () => {
    const store = useGameStore.getState();
    for (const cell of [0, 1, 3]) {
      store.selectCell(cell);
      store.inputDigit(1); // faux pour ces trois cases vides
    }
    const { game } = useGameStore.getState();
    expect(game?.status).toBe('lost');
    expect(game?.play.mistakes).toBe(3);
  });

  it('gèle le chrono à la pause et l’additionne à la reprise', () => {
    mockedNow.mockReturnValue(11_000); // 10 s de jeu
    useGameStore.getState().pauseTimer();
    let game = useGameStore.getState().game;
    if (game === null) throw new Error('partie absente');
    expect(elapsedMsOf(game, 999_999)).toBe(10_000); // gelé pendant la pause

    mockedNow.mockReturnValue(50_000);
    useGameStore.getState().resumeTimer();
    game = useGameStore.getState().game;
    if (game === null) throw new Error('partie absente');
    expect(elapsedMsOf(game, 53_000)).toBe(13_000); // 10 s + 3 s du nouveau run
  });

  it('gagne en jouant toute la solution et fige la durée', () => {
    const store = useGameStore.getState();
    parseGrid(PUZZLE.givens).forEach((value, cell) => {
      if (value !== 0) return;
      const digit = solution[cell];
      if (digit === 0) throw new Error('solution incomplète');
      store.selectCell(cell);
      store.inputDigit(digit);
    });
    mockedNow.mockReturnValue(61_000);
    const { game } = useGameStore.getState();
    expect(game?.status).toBe('won');
    if (game === null) throw new Error('partie absente');
    // finalisée au moment du dernier coup (now = 1 000 au start, mock constant ensuite)
    expect(game.runStartedAt).toBeNull();
  });

  it('revive après défaite : une seule fois, compteur à 2/3', () => {
    const store = useGameStore.getState();
    for (const cell of [0, 1, 3]) {
      store.selectCell(cell);
      store.inputDigit(1);
    }
    useGameStore.getState().reviveAfterDefeat();
    let game = useGameStore.getState().game;
    expect(game?.status).toBe('playing');
    expect(game?.play.mistakes).toBe(2);
    expect(game?.continueUsed).toBe(true);

    // une nouvelle défaite n'est plus rattrapable
    const after = useGameStore.getState();
    after.selectCell(10);
    after.inputDigit(solution[10] === 5 ? 6 : 5);
    useGameStore.getState().reviveAfterDefeat();
    game = useGameStore.getState().game;
    expect(game?.status).toBe('lost');
  });

  it('abandonne en défaite avec durée figée', () => {
    mockedNow.mockReturnValue(31_000);
    useGameStore.getState().abandonGame();
    const { game } = useGameStore.getState();
    expect(game?.status).toBe('lost');
    expect(game?.elapsedMs).toBe(30_000);
  });
});
