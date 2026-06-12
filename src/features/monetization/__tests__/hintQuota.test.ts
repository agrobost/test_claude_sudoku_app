import {
  canUseHint,
  consumeHint,
  FREE_HINTS_PER_DAY,
  freshQuota,
  grantBonusHint,
  hintsRemaining,
  normalizeQuota,
} from '../hintQuota';

describe('quota d’indices', () => {
  it('offre 3 indices par jour', () => {
    const quota = freshQuota('2026-06-12');
    expect(hintsRemaining(quota)).toBe(FREE_HINTS_PER_DAY);
    expect(canUseHint(quota)).toBe(true);
  });

  it('se consomme puis se bloque', () => {
    let quota = freshQuota('2026-06-12');
    for (let i = 0; i < FREE_HINTS_PER_DAY; i++) quota = consumeHint(quota);
    expect(hintsRemaining(quota)).toBe(0);
    expect(canUseHint(quota)).toBe(false);
    // consommer à sec ne descend pas sous zéro
    expect(consumeHint(quota)).toEqual(quota);
  });

  it('les rewarded ajoutent des bonus, consommés après le gratuit', () => {
    let quota = grantBonusHint(freshQuota('2026-06-12'));
    expect(hintsRemaining(quota)).toBe(FREE_HINTS_PER_DAY + 1);
    for (let i = 0; i < FREE_HINTS_PER_DAY; i++) quota = consumeHint(quota);
    expect(quota.bonus).toBe(1); // le gratuit part en premier
    quota = consumeHint(quota);
    expect(quota.bonus).toBe(0);
    expect(canUseHint(quota)).toBe(false);
  });

  it('se remet à zéro au changement de jour local (bonus inclus)', () => {
    let quota = grantBonusHint(freshQuota('2026-06-12'));
    quota = consumeHint(quota);
    expect(normalizeQuota(quota, '2026-06-12')).toEqual(quota); // même jour : inchangé
    expect(normalizeQuota(quota, '2026-06-13')).toEqual(freshQuota('2026-06-13'));
    expect(normalizeQuota(null, '2026-06-13')).toEqual(freshQuota('2026-06-13'));
  });
});
