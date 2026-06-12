export const fr = {
  app: {
    name: 'Sudoku',
  },
  common: {
    cancel: 'Annuler',
    ok: 'OK',
    back: 'Retour',
    comingSoon: 'Bientôt disponible',
  },
  tabs: {
    home: 'Accueil',
    daily: 'Défi du jour',
    stats: 'Stats',
    settings: 'Réglages',
  },
  home: {
    continueGame: 'Continuer la partie',
    continueSubtitle: '{{difficulty}} · {{time}}',
    newGame: 'Nouvelle partie',
    replace: {
      title: 'Partie en cours',
      message: 'Commencer une nouvelle grille abandonnera la partie en cours.',
      confirm: 'Nouvelle grille',
    },
    dailyTitle: 'Défi du jour',
    dailyPlay: 'Jouer',
  },
  daily: {
    weekdaysShort: 'lun,mar,mer,jeu,ven,sam,dim',
    streakCurrent: 'Série en cours',
    streakLongest: 'Record',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    todayCta: 'Jouer le défi du jour',
    todayDone: 'Défi du jour réussi ✓',
    unavailableTitle: 'Défi indisponible',
    unavailableMessage: 'Connecte-toi à internet pour récupérer cette grille.',
    streakLine_one: '🔥 Série : {{count}} jour',
    streakLine_other: '🔥 Série : {{count}} jours',
    percentileLine: 'Plus rapide que {{percent}} % des joueurs',
    share: 'Partager mon résultat',
    shareMessage:
      'Sudoku du {{date}} résolu en {{time}} 🔥{{streak}} — plus rapide que {{percent}} % des joueurs !',
    shareMessageNoPercentile: 'Sudoku du {{date}} résolu en {{time}} 🔥{{streak}} !',
  },
  difficulty: {
    easy: 'Facile',
    medium: 'Moyen',
    hard: 'Difficile',
    expert: 'Expert',
  },
  settings: {
    account: {
      title: 'Compte',
      anonymousHint:
        'Ta progression est liée à cet appareil. Lie un compte pour la sécuriser et la retrouver après une réinstallation.',
      linkApple: 'Continuer avec Apple',
      linkGoogle: 'Continuer avec Google',
      linkedAs: 'Connecté ({{email}})',
      linkedTitle: 'Compte lié',
      linkedMessage: 'Ta progression est maintenant sauvegardée.',
      linkErrorTitle: 'Liaison impossible',
      signOut: 'Se déconnecter',
      signOutTitle: 'Se déconnecter ?',
      signOutMessage:
        'Les données locales de cet appareil seront effacées. Ta progression reste attachée à ton compte.',
      signOutConfirm: 'Se déconnecter',
    },
    language: {
      title: 'Langue',
      system: 'Système',
    },
    privacy: {
      title: 'Confidentialité',
      analytics: 'Statistiques d’usage et rapports de plantage',
      analyticsHint:
        'Nous aide à améliorer l’app (Firebase Analytics / Crashlytics). Désactivé par défaut.',
    },
    about: {
      title: 'À propos',
      privacy: 'Confidentialité',
      about: 'À propos de l’app',
      version: 'Version {{version}}',
    },
    danger: {
      title: 'Zone sensible',
      delete: 'Supprimer mon compte',
      deleteTitle: 'Supprimer ton compte ?',
      deleteMessage:
        'Toutes tes données (compte, parties, progression) seront définitivement effacées de nos serveurs et de cet appareil. Cette action est irréversible.',
      deleteConfirm: 'Tout supprimer',
      deletedTitle: 'Compte supprimé',
      deletedMessage: 'Toutes tes données ont été effacées. L’app repart de zéro.',
      deleteErrorTitle: 'Suppression impossible',
      deleteErrorMessage: 'Vérifie ta connexion et réessaie.',
    },
  },
  legal: {
    privacy: {
      title: 'Confidentialité',
      body: 'Politique de confidentialité\n\nQui sommes-nous ? Cette application de sudoku est éditée de manière indépendante. Pour toute question : voir la fiche de l’app sur le store.\n\nDonnées collectées. Un identifiant de compte anonyme est créé automatiquement pour sauvegarder ta progression (parties terminées : grille jouée, difficulté, résultat, durée, erreurs, indices, date). Si tu lies un compte Apple ou Google, ton adresse e-mail y est associée. Aucune donnée n’est revendue.\n\nPublicité et mesure. L’application peut afficher des publicités (AppLovin MAX) et utiliser des outils de mesure et de stabilité (Firebase Analytics, Crashlytics). Ces traitements ne s’activent qu’après recueil de ton consentement, que tu peux modifier à tout moment dans Réglages. Sans consentement, des publicités non personnalisées peuvent être affichées.\n\nAchats. L’achat « Sans pub » est traité par l’App Store ou Google Play (via RevenueCat) ; nous ne voyons jamais tes informations de paiement.\n\nDurée de conservation. Les données sont conservées tant que ton compte existe.\n\nTes droits (RGPD). Tu peux accéder à tes données, les rectifier ou les supprimer : « Supprimer mon compte » dans les Réglages efface immédiatement et définitivement toutes tes données de nos serveurs.',
    },
    about: {
      title: 'À propos',
      body: 'Sudoku — version {{version}}.\n\nUn sudoku épuré : défi quotidien, indices qui expliquent la technique, jouable hors connexion.\n\nDéveloppé avec Expo / React Native et Supabase.',
    },
  },
  stats: {
    played: 'Parties',
    won: 'Victoires',
    winRate: 'Réussite',
    difficulty: 'Difficulté',
    wonShort: 'Gagnées',
    best: 'Record',
    average: 'Moyenne',
  },
  game: {
    daily: 'Défi du {{date}}',
    pad: {
      digit: 'Saisir {{digit}}',
      undo: 'Annuler',
      erase: 'Effacer',
      notes: 'Notes',
    },
    header: {
      mistakes: 'Erreurs {{count}}/{{max}}',
      pause: 'Pause',
    },
    pause: {
      title: 'Partie en pause',
      resume: 'Reprendre',
    },
    over: {
      wonTitle: 'Grille résolue !',
      lostTitle: 'Partie terminée',
      lostSubtitle: '{{count}} erreurs : la grille est verrouillée.',
      time: 'Temps',
      mistakes: 'Erreurs',
      hints: 'Indices',
      newGame: 'Nouvelle partie',
      retry: 'Réessayer cette grille',
      backHome: 'Retour à l’accueil',
    },
  },
};
