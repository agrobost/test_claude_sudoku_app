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
  settings: {
    account: {
      title: 'Account',
      anonymousHint:
        'Your progress is tied to this device. Link an account to secure it and restore it after a reinstall.',
      linkApple: 'Continue with Apple',
      linkGoogle: 'Continue with Google',
      linkedAs: 'Signed in ({{email}})',
      linkedTitle: 'Account linked',
      linkedMessage: 'Your progress is now backed up.',
      linkErrorTitle: 'Linking failed',
      signOut: 'Sign out',
      signOutTitle: 'Sign out?',
      signOutMessage:
        'Local data on this device will be cleared. Your progress stays attached to your account.',
      signOutConfirm: 'Sign out',
    },
    language: {
      title: 'Language',
      system: 'System',
    },
    about: {
      title: 'About',
      privacy: 'Privacy',
      about: 'About the app',
      version: 'Version {{version}}',
    },
    danger: {
      title: 'Danger zone',
      delete: 'Delete my account',
      deleteTitle: 'Delete your account?',
      deleteMessage:
        'All your data (account, games, progress) will be permanently erased from our servers and this device. This cannot be undone.',
      deleteConfirm: 'Delete everything',
      deletedTitle: 'Account deleted',
      deletedMessage: 'All your data has been erased. The app starts fresh.',
      deleteErrorTitle: 'Deletion failed',
      deleteErrorMessage: 'Check your connection and try again.',
    },
  },
  legal: {
    privacy: {
      title: 'Privacy',
      body: 'Privacy policy\n\nWho we are. This sudoku app is independently published. For any question: see the app’s store listing.\n\nData we collect. An anonymous account identifier is created automatically to save your progress (finished games: puzzle played, difficulty, result, duration, mistakes, hints, date). If you link an Apple or Google account, your email address is associated with it. Your data is never sold.\n\nAdvertising and measurement. The app may show ads (AppLovin MAX) and use measurement and stability tools (Firebase Analytics, Crashlytics). These only activate after your consent, which you can change at any time in Settings. Without consent, non-personalized ads may be shown.\n\nPurchases. The “Remove ads” purchase is processed by the App Store or Google Play (via RevenueCat); we never see your payment details.\n\nRetention. Data is kept for as long as your account exists.\n\nYour rights (GDPR). You can access, rectify or erase your data: “Delete my account” in Settings immediately and permanently erases all your data from our servers.',
    },
    about: {
      title: 'About',
      body: 'Sudoku — version {{version}}.\n\nA clean sudoku: daily challenge, hints that teach the technique, fully playable offline.\n\nBuilt with Expo / React Native and Supabase.',
    },
  },
  stats: {
    played: 'Games',
    won: 'Wins',
    winRate: 'Win rate',
    difficulty: 'Difficulty',
    wonShort: 'Won',
    best: 'Best',
    average: 'Average',
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
