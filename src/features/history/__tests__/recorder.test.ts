import { parseGrid } from '@/engine';

import { useGameStore, type PuzzleSpec } from '../../game';
import { initGameRecorder } from '../recorder';
import { useHistoryStore } from '../store';

jest.mock('@/lib/dates', () => ({
  ...jest.requireActual<typeof import('@/lib/dates')>('@/lib/dates'),
  nowMs: jest.fn(() => 1_000),
}));

const PUZZLE: PuzzleSpec = {
  id: 'puzzle-1',
  givens: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
  solution: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
  difficulty: 'easy',
};

function loseGame(): void {
  const store = useGameStore.getState();
  for (const cell of [0, 1, 3]) {
    store.selectCell(cell);
    store.inputDigit(1);
  }
}

describe('initGameRecorder', () => {
  let unsubscribe: () => void;

  beforeEach(() => {
    useHistoryStore.getState().clearAll();
    useGameStore.getState().clearGame();
    unsubscribe = initGameRecorder();
  });

  afterEach(() => {
    unsubscribe();
  });

  it('enregistre une défaite quand la partie quitte le store', () => {
    useGameStore.getState().startGame(PUZZLE, 'classic', null);
    loseGame();
    expect(useHistoryStore.getState().records).toHaveLength(0); // pas encore sortie

    useGameStore.getState().clearGame();
    const records = useHistoryStore.getState().records;
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ result: 'lost', difficulty: 'easy', mode: 'classic' });
  });

  it('n’écrit qu’UN résultat (gagné) pour une partie perdue puis revivée', () => {
    useGameStore.getState().startGame(PUZZLE, 'classic', null);
    loseGame();
    useGameStore.getState().reviveAfterDefeat();
    expect(useHistoryStore.getState().records).toHaveLength(0);

    // correction des trois cases fausses puis fin de grille
    const givens = parseGrid(PUZZLE.givens);
    const solution = parseGrid(PUZZLE.solution);
    const store = useGameStore.getState();
    solution.forEach((digit, cell) => {
      if (givens[cell] !== 0 || digit === 0) return;
      store.selectCell(cell);
      store.inputDigit(digit);
    });
    expect(useGameStore.getState().game?.status).toBe('won');

    useGameStore.getState().clearGame();
    const records = useHistoryStore.getState().records;
    expect(records).toHaveLength(1);
    expect(records[0]?.result).toBe('won');
  });

  it('enregistre la partie remplacée par une nouvelle (abandon confirmé)', () => {
    useGameStore.getState().startGame(PUZZLE, 'classic', null);
    useGameStore.getState().abandonGame();
    useGameStore.getState().startGame(PUZZLE, 'classic', null);

    const records = useHistoryStore.getState().records;
    expect(records).toHaveLength(1);
    expect(records[0]?.result).toBe('lost');
    expect(useGameStore.getState().game?.status).toBe('playing');
  });

  it('ignore une partie remplacée sans statut terminal', () => {
    useGameStore.getState().startGame(PUZZLE, 'classic', null);
    useGameStore.getState().startGame(PUZZLE, 'classic', null); // remplacement direct
    expect(useHistoryStore.getState().records).toHaveLength(0);
  });
});
