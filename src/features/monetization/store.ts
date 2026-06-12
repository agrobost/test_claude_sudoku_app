import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type LocalDate } from '@/lib/dates';
import { zustandStorage } from '@/lib/mmkv';

import {
  consumeHint,
  grantBonusHint,
  hintsRemaining,
  normalizeQuota,
  type HintQuotaState,
} from './hintQuota';

type MonetizationStore = {
  /** Entitlement « Sans pub » (source de vérité : RevenueCat, E15). */
  readonly noAds: boolean;
  readonly totalGamesFinished: number;
  readonly lastInterstitialAt: number | null;
  /** Quota d'indices du jour (3 offerts + bonus rewarded, reset à minuit local). */
  readonly hintQuota: HintQuotaState | null;
  setNoAds: (noAds: boolean) => void;
  incrementGamesFinished: () => void;
  markInterstitialShown: (at: number) => void;
  hintsRemainingToday: (today: LocalDate) => number;
  consumeHintToday: (today: LocalDate) => void;
  grantBonusHintToday: (today: LocalDate) => void;
};

export const useMonetizationStore = create<MonetizationStore>()(
  persist(
    (set, get) => ({
      noAds: false,
      totalGamesFinished: 0,
      lastInterstitialAt: null,
      hintQuota: null,
      setNoAds: (noAds) => set({ noAds }),
      incrementGamesFinished: () =>
        set({ totalGamesFinished: get().totalGamesFinished + 1 }),
      markInterstitialShown: (at) => set({ lastInterstitialAt: at }),
      hintsRemainingToday: (today) => hintsRemaining(normalizeQuota(get().hintQuota, today)),
      consumeHintToday: (today) =>
        set({ hintQuota: consumeHint(normalizeQuota(get().hintQuota, today)) }),
      grantBonusHintToday: (today) =>
        set({ hintQuota: grantBonusHint(normalizeQuota(get().hintQuota, today)) }),
    }),
    {
      name: 'monetization-store',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
