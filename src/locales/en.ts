import type { fr } from './fr';

// La structure FR fait foi : toute clé ajoutée doit exister dans les deux langues.
export const en: typeof fr = {
  app: {
    name: 'Sudoku',
  },
  common: {
    cancel: 'Cancel',
    ok: 'OK',
    back: 'Back',
    comingSoon: 'Coming soon',
  },
  tabs: {
    home: 'Home',
    daily: 'Daily challenge',
    stats: 'Stats',
    settings: 'Settings',
  },
  home: {
    continueGame: 'Continue game',
    continueSubtitle: '{{difficulty}} · {{time}}',
    newGame: 'New game',
    replace: {
      title: 'Game in progress',
      message: 'Starting a new puzzle will abandon your current game.',
      confirm: 'New puzzle',
    },
  },
  difficulty: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  },
  game: {
    daily: 'Daily {{date}}',
    pad: {
      digit: 'Enter {{digit}}',
      undo: 'Undo',
      erase: 'Erase',
      notes: 'Notes',
    },
    header: {
      mistakes: 'Mistakes {{count}}/{{max}}',
      pause: 'Pause',
    },
    pause: {
      title: 'Game paused',
      resume: 'Resume',
    },
    over: {
      wonTitle: 'Puzzle solved!',
      lostTitle: 'Game over',
      lostSubtitle: '{{count}} mistakes: the grid is locked.',
      time: 'Time',
      mistakes: 'Mistakes',
      hints: 'Hints',
      newGame: 'New game',
      retry: 'Retry this puzzle',
      backHome: 'Back to home',
    },
  },
};
