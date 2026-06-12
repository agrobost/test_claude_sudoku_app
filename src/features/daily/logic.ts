import { addDays, type LocalDate } from '@/lib/dates';

export type Streaks = { readonly current: number; readonly longest: number };

/**
 * Streak = jours calendaires consécutifs gagnés LE JOUR MÊME.
 * La streak courante part d'aujourd'hui (ou d'hier si le défi du jour
 * n'est pas encore gagné — elle n'est pas cassée tant que la journée court).
 */
export function computeStreaks(wonOnTime: ReadonlySet<LocalDate>, today: LocalDate): Streaks {
  let current = 0;
  let cursor = wonOnTime.has(today) ? today : addDays(today, -1);
  while (wonOnTime.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let longest = current;
  for (const date of wonOnTime) {
    // début de série uniquement (pas de veille gagnée)
    if (wonOnTime.has(addDays(date, -1))) continue;
    let length = 0;
    let day = date;
    while (wonOnTime.has(day)) {
      length++;
      day = addDays(day, 1);
    }
    if (length > longest) longest = length;
  }
  return { current, longest };
}

export type CalendarDay = {
  readonly date: LocalDate;
  readonly dayOfMonth: number;
  readonly inMonth: boolean;
};

/** "2026-06" → semaines (lundi→dimanche) couvrant le mois. */
export function buildMonthGrid(month: string, todayForValidation?: LocalDate): CalendarDay[][] {
  const firstOfMonth: LocalDate = `${month}-01`;
  if (todayForValidation !== undefined && firstOfMonth > todayForValidation) {
    // garde-fou : on ne construit pas de mois entièrement futur
    return [];
  }
  const firstDate = new Date(`${firstOfMonth}T12:00:00Z`);
  // getUTCDay : 0 = dimanche ; on veut lundi = 0
  const leadingDays = (firstDate.getUTCDay() + 6) % 7;

  const weeks: CalendarDay[][] = [];
  let cursor = addDays(firstOfMonth, -leadingDays);
  for (let week = 0; week < 6; week++) {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      days.push({
        date: cursor,
        dayOfMonth: Number(cursor.slice(8)),
        inMonth: cursor.slice(0, 7) === month,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(days);
    if (cursor.slice(0, 7) > month) break;
  }
  return weeks;
}

export function monthOf(date: LocalDate): string {
  return date.slice(0, 7);
}

export function previousMonth(month: string): string {
  return monthOf(addDays(`${month}-01`, -1));
}

export function nextMonth(month: string): string {
  return monthOf(addDays(`${month}-28`, 7));
}
