import { onGameRecorded } from '../history';

import { initAds } from './ads';
import { initIap } from './iap';
import { useMonetizationStore } from './store';

export {
  adsReady,
  debugShowInterstitial,
  initAds,
  maybeShowInterstitialAfterGame,
  showRewardedAd,
  type DebugInterstitialOutcome,
} from './ads';
export { AdBanner } from './components/AdBanner';
export { HintButton } from './components/HintButton';
export { ReviveButton } from './components/ReviveButton';
export { adsConfigured } from './env';
export {
  canUseHint,
  consumeHint,
  FREE_HINTS_PER_DAY,
  freeHintsRemaining,
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
export {
  getNoAdsPackage,
  iapConfigured,
  initIap,
  NO_ADS_ENTITLEMENT,
  purchaseNoAds,
  restorePurchases,
  type IapActionResult,
} from './iap';
export { useMonetizationStore } from './store';

/** Boot : initialise pub + IAP (no-op sans clés) et compte les fins de partie. */
export function initMonetization(): void {
  void initAds();
  void initIap();
  onGameRecorded(() => {
    useMonetizationStore.getState().incrementGamesFinished();
  });
}
