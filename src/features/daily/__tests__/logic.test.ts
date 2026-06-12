import { buildMonthGrid, computeStreaks, nextMonth, previousMonth } from '../logic';

describe('computeStreaks', () => {
  it('vaut 0 sans aucune victoire', () => {
    expect(computeStreaks(new Set(), '2026-06-12')).toEqual({ current: 0, longest: 0 });
  });

  it('compte la série incluant aujourd’hui', () => {
    const won = new Set(['2026-06-10', '2026-06-11', '2026-06-12']);
    expect(computeStreaks(won, '2026-06-12')).toEqual({ current: 3, longest: 3 });
  });

  it('ne casse pas la série tant que le défi du jour n’est pas joué', () => {
    const won = new Set(['2026-06-10', '2026-06-11']);
    expect(computeStreaks(won, '2026-06-12').current).toBe(2);
  });

  it('casse la série après un jour manqué', () => {
    const won = new Set(['2026-06-09', '2026-06-10']);
    expect(computeStreaks(won, '2026-06-12').current).toBe(0);
  });

  it('trouve la plus longue série passée', () => {
    const won = new Set(['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-06-11']);
    const { current, longest } = computeStreaks(won, '2026-06-12');
    expect(current).toBe(1);
    expect(longest).toBe(4);
  });

  it('traverse les changements de mois et d’année', () => {
    const won = new Set(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
    expect(computeStreaks(won, '2026-01-02')).toEqual({ current: 4, longest: 4 });
  });
});

describe('buildMonthGrid', () => {
  it('aligne juin 2026 sur des semaines lundi→dimanche', () => {
    const weeks = buildMonthGrid('2026-06');
    // le 1er juin 2026 est un lundi
    expect(weeks[0]?.[0]).toEqual({ date: '2026-06-01', dayOfMonth: 1, inMonth: true });
    expect(weeks[0]?.[6]?.date).toBe('2026-06-07');
    const flat = weeks.flat();
    expect(flat.filter((d) => d.inMonth)).toHaveLength(30);
  });

  it('préfixe les jours du mois précédent quand le mois ne commence pas un lundi', () => {
    // le 1er mai 2026 est un vendredi → 4 jours d'avril en tête
    const weeks = buildMonthGrid('2026-05');
    expect(weeks[0]?.[0]?.date).toBe('2026-04-27');
    expect(weeks[0]?.[0]?.inMonth).toBe(false);
    expect(weeks[0]?.[4]?.date).toBe('2026-05-01');
  });

  it('refuse un mois entièrement futur', () => {
    expect(buildMonthGrid('2027-01', '2026-06-12')).toEqual([]);
  });
});

describe('navigation de mois', () => {
  it('précédent et suivant traversent les années', () => {
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(nextMonth('2025-12')).toBe('2026-01');
    expect(nextMonth('2026-01')).toBe('2026-02');
    expect(previousMonth('2026-03')).toBe('2026-02');
  });
});
