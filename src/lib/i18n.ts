import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/locales/en';
import { fr } from '@/locales/fr';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

/** Applique un override de langue (Réglages) ou retombe sur la langue du device. */
export function applyLanguage(override: 'fr' | 'en' | null): void {
  void i18n.changeLanguage(override ?? deviceLanguage);
}

const i18n = createInstance();

// initReactI18next enregistre l'instance comme défaut de useTranslation()
void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: {
    // React échappe déjà les valeurs interpolées
    escapeValue: false,
  },
});

export { i18n };
