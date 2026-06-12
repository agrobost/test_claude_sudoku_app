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
    dailyTitle: 'Daily challenge',
    dailyPlay: 'Play',
  },
  daily: {
    weekdaysShort: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    streakCurrent: 'Current streak',
    streakLongest: 'Best',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    todayCta: 'Play today’s challenge',
    todayDone: 'Daily challenge solved ✓',
    unavailableTitle: 'Challenge unavailable',
    unavailableMessage: 'Connect to the internet to fetch this puzzle.',
    streakLine_one: '🔥 Streak: {{count}} day',
    streakLine_other: '🔥 Streak: {{count}} days',
    percentileLine: 'Faster than {{percent}}% of players',
    share: 'Share my result',
    shareMessage:
      '{{date}} Sudoku solved in {{time}} 🔥{{streak}} — faster than {{percent}}% of players!',
    shareMessageNoPercentile: '{{date}} Sudoku solved in {{time}} 🔥{{streak}}!',
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
