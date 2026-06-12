import { AppLovinMAX, InterstitialAd, RewardedAd } from 'react-native-applovin-max';

import { trackEvent } from '@/lib/analytics';
import { nowMs } from '@/lib/dates';
import { logger } from '@/lib/logger';

import { requestAttIfNeeded } from '../consent';

import {
  adsConfigured,
  APPLOVIN_SDK_KEY,
  INTERSTITIAL_AD_UNIT_ID,
  PRIVACY_POLICY_URL,
  REWARDED_AD_UNIT_ID,
} from './env';
import { canShowInterstitial } from './gates';
import { useMonetizationStore } from './store';

let sdkReady = false;

export function adsReady(): boolean {
  return sdkReady;
}

/**
 * Initialise MAX : ATT (iOS) d'abord, puis le flow CMP TCF intégré de MAX
 * (Google UMP) déclenché par l'initialisation, enfin le préchargement.
 * Sans clé SDK dans l'env : no-op total.
 */
export async function initAds(): Promise<void> {
  if (sdkReady || !adsConfigured() || APPLOVIN_SDK_KEY === null) return;
  try {
    await requestAttIfNeeded();
    if (PRIVACY_POLICY_URL !== null) {
      // le flow Terms/Privacy de MAX (CMP TCF) exige l'URL de politique
      AppLovinMAX.setTermsAndPrivacyPolicyFlowEnabled(true);
      AppLovinMAX.setPrivacyPolicyUrl(PRIVACY_POLICY_URL);
    }
    await AppLovinMAX.initialize(APPLOVIN_SDK_KEY);
    sdkReady = true;
    setupFullscreenAds();
  } catch (error) {
    logger.warn('initialisation AppLovin MAX impossible', error);
  }
}

function setupFullscreenAds(): void {
  if (INTERSTITIAL_AD_UNIT_ID !== null) {
    const interstitialId = INTERSTITIAL_AD_UNIT_ID;
    // rechargement permanent : après affichage ou échec de chargement
    InterstitialAd.addAdHiddenEventListener(() => InterstitialAd.loadAd(interstitialId));
    InterstitialAd.addAdLoadFailedEventListener(() => {
      setTimeout(() => InterstitialAd.loadAd(interstitialId), 30_000);
    });
    InterstitialAd.loadAd(interstitialId);
  }
  if (REWARDED_AD_UNIT_ID !== null) {
    const rewardedId = REWARDED_AD_UNIT_ID;
    RewardedAd.addAdHiddenEventListener(() => RewardedAd.loadAd(rewardedId));
    RewardedAd.addAdLoadFailedEventListener(() => {
      setTimeout(() => RewardedAd.loadAd(rewardedId), 30_000);
    });
    RewardedAd.loadAd(rewardedId);
  }
}

/**
 * Interstitiel de fin de partie, si les règles produit l'autorisent
 * (gates.ts). Résout quand la pub est fermée — l'appelant enchaîne l'UX.
 */
export async function maybeShowInterstitialAfterGame(): Promise<void> {
  if (!sdkReady || INTERSTITIAL_AD_UNIT_ID === null) return;
  const store = useMonetizationStore.getState();
  const allowed = canShowInterstitial({
    noAds: store.noAds,
    adsReady: sdkReady,
    totalGamesFinished: store.totalGamesFinished,
    lastInterstitialAt: store.lastInterstitialAt,
    now: nowMs(),
  });
  if (!allowed) return;

  const interstitialId = INTERSTITIAL_AD_UNIT_ID;
  const ready = await InterstitialAd.isAdReady(interstitialId).catch(() => false);
  if (!ready) return;

  store.markInterstitialShown(nowMs());
  trackEvent({ name: 'ad_shown', params: { format: 'interstitial' } });

  await new Promise<void>((resolve) => {
    const finish = (): void => {
      InterstitialAd.removeAdHiddenEventListener();
      InterstitialAd.removeAdFailedToDisplayEventListener();
      // ré-arme le rechargement permanent retiré ci-dessus
      InterstitialAd.addAdHiddenEventListener(() => InterstitialAd.loadAd(interstitialId));
      resolve();
    };
    InterstitialAd.addAdHiddenEventListener(finish);
    InterstitialAd.addAdFailedToDisplayEventListener(finish);
    InterstitialAd.showAd(interstitialId);
  });
}

export type RewardedOutcome = 'earned' | 'dismissed' | 'unavailable';

/** Affiche une rewarded ; 'earned' seulement si la récompense est accordée. */
export async function showRewardedAd(): Promise<RewardedOutcome> {
  if (!sdkReady || REWARDED_AD_UNIT_ID === null) return 'unavailable';
  const rewardedId = REWARDED_AD_UNIT_ID;
  const ready = await RewardedAd.isAdReady(rewardedId).catch(() => false);
  if (!ready) {
    RewardedAd.loadAd(rewardedId);
    return 'unavailable';
  }

  trackEvent({ name: 'ad_shown', params: { format: 'rewarded' } });

  return new Promise<RewardedOutcome>((resolve) => {
    let earned = false;
    const finish = (): void => {
      RewardedAd.removeAdReceivedRewardEventListener();
      RewardedAd.removeAdHiddenEventListener();
      RewardedAd.removeAdFailedToDisplayEventListener();
      RewardedAd.addAdHiddenEventListener(() => RewardedAd.loadAd(rewardedId));
      resolve(earned ? 'earned' : 'dismissed');
    };
    RewardedAd.addAdReceivedRewardEventListener(() => {
      earned = true;
    });
    RewardedAd.addAdHiddenEventListener(finish);
    RewardedAd.addAdFailedToDisplayEventListener(finish);
    RewardedAd.showAd(rewardedId);
  });
}
