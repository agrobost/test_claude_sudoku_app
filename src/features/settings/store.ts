import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/mmkv';

export type LanguageOverride = 'fr' | 'en' | null;

/** Heures proposées pour le rappel quotidien (chips, pas de time picker natif en v1). */
export const REMINDER_HOURS: readonly number[] = [8, 12, 19, 21];

type SettingsStore = {
  /** null = suivre la langue du système. */
  readonly languageOverride: LanguageOverride;
  /** Notifications locales : opt-in explicite (PRD U14). */
  readonly notificationsEnabled: boolean;
  readonly reminderHour: number;
  setLanguageOverride: (language: LanguageOverride) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setReminderHour: (hour: number) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      languageOverride: null,
      notificationsEnabled: false,
      reminderHour: 9,
      setLanguageOverride: (languageOverride) => set({ languageOverride }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setReminderHour: (reminderHour) => set({ reminderHour }),
    }),
    {
      name: 'settings-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
