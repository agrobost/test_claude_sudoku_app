import {
  canOfferRewarded,
  canShowBanner,
  canShowInterstitial,
  MIN_GAMES_BEFORE_INTERSTITIAL,
  MIN_INTERSTITIAL_INTERVAL_MS,
} from '../gates';

const base = {
  noAds: false,
  adsReady: true,
  totalGamesFinished: 10,
  lastInterstitialAt: null,
  now: 1_000_000,
};

describe('canShowInterstitial', () => {
  it('autorise après une fin de partie quand toutes les règles passent', () => {
    expect(canShowInterstitial(base)).toBe(true);
  });

  it('refuse pour un acheteur « Sans pub »', () => {
    expect(canShowInterstitial({ ...base, noAds: true })).toBe(false);
  });

  it('refuse tant que le SDK n’est pas prêt', () => {
    expect(canShowInterstitial({ ...base, adsReady: false })).toBe(false);
  });

  it('laisse une période de grâce aux nouveaux joueurs', () => {
    expect(
      canShowInterstitial({ ...base, totalGamesFinished: MIN_GAMES_BEFORE_INTERSTITIAL - 1 }),
    ).toBe(false);
    expect(
      canShowInterstitial({ ...base, totalGamesFinished: MIN_GAMES_BEFORE_INTERSTITIAL }),
    ).toBe(true);
  });

  it('impose l’intervalle minimal entre deux interstitiels', () => {
    const justShown = { ...base, lastInterstitialAt: base.now - 1_000 };
    expect(canShowInterstitial(justShown)).toBe(false);
    const longAgo = { ...base, lastInterstitialAt: base.now - MIN_INTERSTITIAL_INTERVAL_MS };
    expect(canShowInterstitial(longAgo)).toBe(true);
  });
});

describe('canShowBanner / canOfferRewarded', () => {
  it('cache la bannière aux premium mais garde la rewarded volontaire', () => {
    expect(canShowBanner({ noAds: true, adsReady: true })).toBe(false);
    expect(canShowBanner({ noAds: false, adsReady: true })).toBe(true);
    expect(canShowBanner({ noAds: false, adsReady: false })).toBe(false);
    expect(canOfferRewarded(true)).toBe(true);
    expect(canOfferRewarded(false)).toBe(false);
  });
});
