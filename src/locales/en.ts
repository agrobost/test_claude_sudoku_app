import type { fr } from './fr';

// La structure FR fait foi : toute clé ajoutée doit exister dans les deux langues.
export const en: typeof fr = {
  app: {
    name: 'Sudoku',
  },
  home: {
    placeholder: 'Coming soon: the daily challenge.',
  },
};
