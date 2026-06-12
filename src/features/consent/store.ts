import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/mmkv';

type ConsentStore = {
  /** Mesure d'audience + crash reporting. Refusé par défaut (privacy by default). */
  readonly analyticsConsent: boolean;
  setAnalyticsConsent: (granted: boolean) => void;
};

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set) => ({
      analyticsConsent: false,
      setAnalyticsConsent: (analyticsConsent) => set({ analyticsConsent }),
    }),
    {
      name: 'consent-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
