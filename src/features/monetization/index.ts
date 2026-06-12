import { onGameRecorded } from '../history';

import { initAds } from './ads';
import { useMonetizationStore } from './store';

export { adsReady, initAds, maybeShowInterstitialAfterGame, showRewardedAd } from './ads';
export { AdBanner } from './components/AdBanner';
export { HintButton } from './components/HintButton';
export { ReviveButton } from './components/ReviveButton';
export { adsConfigured } from './env';
export {
  canUseHint,
  consumeHint,
  FREE_HINTS_PER_DAY,
  freshQuota,
  grantBonusHint,
  hintsRemaining,
  normalizeQuota,
  type HintQuotaState,
} from './hintQuota';
export {
  canOfferRewarded,
  canShowBanner,
  canShowInterstitial,
  MIN_GAMES_BEFORE_INTERSTITIAL,
  MIN_INTERSTITIAL_INTERVAL_MS,
} from './gates';
export { useMonetizationStore } from './store';

/** Boot : initialise la pub (no-op sans clés) et compte les fins de partie. */
export function initMonetization(): void {
  void initAds();
  onGameRecorded(() => {
    useMonetizationStore.getState().incrementGamesFinished();
  });
}
