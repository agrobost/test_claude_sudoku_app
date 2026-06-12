import { type LocalDate } from '@/lib/dates';

/** Règle produit (PRD §6) : 3 indices offerts par jour, +1 par rewarded. */
export const FREE_HINTS_PER_DAY = 3;

export type HintQuotaState = {
  readonly date: LocalDate;
  /** Indices gratuits consommés ce jour. */
  readonly used: number;
  /** Indices gagnés par rewarded, valables le jour même (expirent à minuit). */
  readonly bonus: number;
};

export function freshQuota(date: LocalDate): HintQuotaState {
  return { date, used: 0, bonus: 0 };
}

/** Remet le quota à zéro si le jour local a changé. */
export function normalizeQuota(state: HintQuotaState | null, today: LocalDate): HintQuotaState {
  if (state === null || state.date !== today) return freshQuota(today);
  return state;
}

export function freeHintsRemaining(state: HintQuotaState): number {
  return Math.max(0, FREE_HINTS_PER_DAY - state.used);
}

export function hintsRemaining(state: HintQuotaState): number {
  return freeHintsRemaining(state) + state.bonus;
}

export function canUseHint(state: HintQuotaState): boolean {
  return hintsRemaining(state) > 0;
}

/** Consomme d'abord le quota gratuit, puis les bonus rewarded. */
export function consumeHint(state: HintQuotaState): HintQuotaState {
  if (freeHintsRemaining(state) > 0) return { ...state, used: state.used + 1 };
  if (state.bonus > 0) return { ...state, bonus: state.bonus - 1 };
  return state;
}

export function grantBonusHint(state: HintQuotaState): HintQuotaState {
  return { ...state, bonus: state.bonus + 1 };
}
