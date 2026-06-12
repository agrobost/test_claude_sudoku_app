/**
 * Le « jour » métier = date calendaire LOCALE du device, au format YYYY-MM-DD
 * (daily, streak, quotas, notifications — cf. ARCHITECTURE §3).
 * Seul module autorisé à manipuler Date pour la logique métier.
 */

export type LocalDate = string; // YYYY-MM-DD

export function localDateOf(date: Date): LocalDate {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayLocalDate(): LocalDate {
  return localDateOf(new Date());
}

/** Arithmétique calendaire sûre (passe par midi UTC pour éviter les bords DST). */
export function addDays(date: LocalDate, days: number): LocalDate {
  const base = new Date(`${date}T12:00:00Z`);
  const shifted = new Date(base.getTime() + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

export function isLocalDate(value: unknown): value is LocalDate {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 754321 ms → "12:34" ; au-delà d'une heure → "1:02:03". */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** « 12 juin » / "June 12" — pour les partages et titres. */
export function formatHumanDate(date: LocalDate, locale: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/** Instant ISO de midi LOCAL d'une date donnée (seeds de test, debug). */
export function localNoonIso(date: LocalDate): string {
  return new Date(`${date}T12:00:00`).toISOString();
}

/** Horodatage courant (ms) — centralisé pour rester mockable en test. */
export function nowMs(): number {
  return Date.now();
}
