/**
 * Décisions d'affichage publicitaire : fonctions PURES (cf. CLAUDE.md).
 * Règles produit (PRD §6) : interstitiel seulement après une fin de partie,
 * jamais avant la 3e partie de la vie du joueur, ≥ 3 min d'intervalle,
 * jamais pour les acheteurs « Sans pub ».
 */

export const MIN_GAMES_BEFORE_INTERSTITIAL = 3;
export const MIN_INTERSTITIAL_INTERVAL_MS = 3 * 60_000;

export type InterstitialContext = {
  readonly noAds: boolean;
  readonly adsReady: boolean;
  readonly totalGamesFinished: number;
  readonly lastInterstitialAt: number | null;
  readonly now: number;
};

export function canShowInterstitial(context: InterstitialContext): boolean {
  if (context.noAds || !context.adsReady) return false;
  if (context.totalGamesFinished < MIN_GAMES_BEFORE_INTERSTITIAL) return false;
  if (
    context.lastInterstitialAt !== null &&
    context.now - context.lastInterstitialAt < MIN_INTERSTITIAL_INTERVAL_MS
  ) {
    return false;
  }
  return true;
}

export type BannerContext = {
  readonly noAds: boolean;
  readonly adsReady: boolean;
};

export function canShowBanner(context: BannerContext): boolean {
  return !context.noAds && context.adsReady;
}

/** Les rewarded restent proposées même aux acheteurs « Sans pub » (volontaires). */
export function canOfferRewarded(adsReady: boolean): boolean {
  return adsReady;
}
