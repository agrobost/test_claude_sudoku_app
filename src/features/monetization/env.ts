import { Platform } from 'react-native';

/**
 * Identifiants publicitaires lus depuis l'environnement (EXPO_PUBLIC_*, cf.
 * .env.example) — accès statiques obligatoires : Expo les inline au bundle.
 * Tous publics by design. Absents → la monétisation est désactivée proprement.
 */

function orNull(value: string | undefined): string | null {
  return value !== undefined && value.length > 0 ? value : null;
}

export const APPLOVIN_SDK_KEY = orNull(process.env.EXPO_PUBLIC_APPLOVIN_SDK_KEY);

export const PRIVACY_POLICY_URL = orNull(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);

export const BANNER_AD_UNIT_ID = Platform.select({
  ios: orNull(process.env.EXPO_PUBLIC_MAX_BANNER_IOS),
  android: orNull(process.env.EXPO_PUBLIC_MAX_BANNER_ANDROID),
  default: null,
});

export const INTERSTITIAL_AD_UNIT_ID = Platform.select({
  ios: orNull(process.env.EXPO_PUBLIC_MAX_INTERSTITIAL_IOS),
  android: orNull(process.env.EXPO_PUBLIC_MAX_INTERSTITIAL_ANDROID),
  default: null,
});

export const REWARDED_AD_UNIT_ID = Platform.select({
  ios: orNull(process.env.EXPO_PUBLIC_MAX_REWARDED_IOS),
  android: orNull(process.env.EXPO_PUBLIC_MAX_REWARDED_ANDROID),
  default: null,
});

/** La clé SDK suffit pour initialiser ; chaque format exige en plus son ad unit. */
export function adsConfigured(): boolean {
  return APPLOVIN_SDK_KEY !== null;
}
