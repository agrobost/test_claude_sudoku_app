import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/mmkv';

type MonetizationStore = {
  /** Entitlement « Sans pub » (source de vérité : RevenueCat, E15). */
  readonly noAds: boolean;
  readonly totalGamesFinished: number;
  readonly lastInterstitialAt: number | null;
  setNoAds: (noAds: boolean) => void;
  incrementGamesFinished: () => void;
  markInterstitialShown: (at: number) => void;
};

export const useMonetizationStore = create<MonetizationStore>()(
  persist(
    (set, get) => ({
      noAds: false,
      totalGamesFinished: 0,
      lastInterstitialAt: null,
      setNoAds: (noAds) => set({ noAds }),
      incrementGamesFinished: () =>
        set({ totalGamesFinished: get().totalGamesFinished + 1 }),
      markInterstitialShown: (at) => set({ lastInterstitialAt: at }),
    }),
    {
      name: 'monetization-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
