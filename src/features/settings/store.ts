import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/mmkv';

export type LanguageOverride = 'fr' | 'en' | null;

type SettingsStore = {
  /** null = suivre la langue du système. */
  readonly languageOverride: LanguageOverride;
  setLanguageOverride: (language: LanguageOverride) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      languageOverride: null,
      setLanguageOverride: (languageOverride) => set({ languageOverride }),
    }),
    {
      name: 'settings-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
