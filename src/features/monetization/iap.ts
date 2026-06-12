import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { currentUserId } from '@/features/auth';
import { trackEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';

import { useMonetizationStore } from './store';

/** Identifiant d'entitlement côté RevenueCat. */
export const NO_ADS_ENTITLEMENT = 'no_ads';

const API_KEY = Platform.select({
  ios: orNull(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY),
  android: orNull(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY),
  default: null,
});

function orNull(value: string | undefined): string | null {
  return value !== undefined && value.length > 0 ? value : null;
}

export function iapConfigured(): boolean {
  return API_KEY !== null;
}

let configured = false;

function applyCustomerInfo(info: CustomerInfo): void {
  const noAds = info.entitlements.active[NO_ADS_ENTITLEMENT] !== undefined;
  useMonetizationStore.getState().setNoAds(noAds);
}

/** Boot : configure RevenueCat (no-op sans clé) et suit l'entitlement. */
export async function initIap(): Promise<void> {
  if (configured || API_KEY === null) return;
  try {
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    // rattache l'achat au même utilisateur que Supabase (restauration cross-device)
    const userId = await currentUserId();
    if (userId !== null) {
      const { customerInfo } = await Purchases.logIn(userId);
      applyCustomerInfo(customerInfo);
    }
  } catch (error) {
    logger.warn('initialisation RevenueCat impossible', error);
  }
}

export type IapActionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'cancelled' | 'unavailable' | 'failed' };

/** Premier package de l'offering courant = « Sans pub » (configuré côté RC). */
export async function getNoAdsPackage(): Promise<PurchasesPackage | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages.at(0) ?? null;
  } catch (error) {
    logger.warn('getOfferings impossible', error);
    return null;
  }
}

export async function purchaseNoAds(pkg: PurchasesPackage): Promise<IapActionResult> {
  if (!configured) return { ok: false, reason: 'unavailable' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    if (customerInfo.entitlements.active[NO_ADS_ENTITLEMENT] === undefined) {
      return { ok: false, reason: 'failed' };
    }
    trackEvent({ name: 'purchase_no_ads', params: { restored: false } });
    return { ok: true };
  } catch (error) {
    if (isUserCancelled(error)) return { ok: false, reason: 'cancelled' };
    logger.warn('achat « Sans pub » échoué', error);
    return { ok: false, reason: 'failed' };
  }
}

export async function restorePurchases(): Promise<IapActionResult> {
  if (!configured) return { ok: false, reason: 'unavailable' };
  try {
    const customerInfo = await Purchases.restorePurchases();
    applyCustomerInfo(customerInfo);
    const restored = customerInfo.entitlements.active[NO_ADS_ENTITLEMENT] !== undefined;
    if (restored) trackEvent({ name: 'purchase_no_ads', params: { restored: true } });
    return restored ? { ok: true } : { ok: false, reason: 'failed' };
  } catch (error) {
    logger.warn('restauration des achats échouée', error);
    return { ok: false, reason: 'failed' };
  }
}

function isUserCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'userCancelled' in error &&
    error.userCancelled === true
  );
}
