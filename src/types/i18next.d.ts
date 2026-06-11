import type { fr } from '@/locales/fr';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: typeof fr;
    };
  }
}
