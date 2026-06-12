import { useQuery } from '@tanstack/react-query';

import { addDays, todayLocalDate, type LocalDate } from '@/lib/dates';
import { logger } from '@/lib/logger';
import { kv } from '@/lib/mmkv';
import { supabase } from '@/lib/supabase';

import { isPackPuzzle, type PackPuzzle } from '../puzzles';

const cacheKey = (date: LocalDate): string => `daily-puzzle:${date}`;

/**
 * Grille du défi pour une date locale : cache MMKV d'abord (offline-first),
 * sinon Supabase. Jette si la grille est inaccessible (offline sans cache).
 */
export async function fetchDailyPuzzle(date: LocalDate): Promise<PackPuzzle> {
  const cached = kv.getJSON(cacheKey(date), isPackPuzzle);
  if (cached !== null) return cached;

  if (supabase === null) throw new Error(`daily ${date}: hors ligne sans cache`);
  const { data, error } = await supabase
    .from('daily_puzzles')
    .select('daily_date, puzzles ( id, givens, solution, difficulty )')
    .eq('daily_date', date)
    .maybeSingle();
  if (error !== null) throw error;

  const puzzle: unknown = data === null ? null : data.puzzles;
  if (!isPackPuzzle(puzzle)) throw new Error(`daily ${date}: indisponible`);
  kv.setJSON(cacheKey(date), puzzle);
  return puzzle;
}

/** Pré-charge aujourd'hui et demain (jouables hors ligne ensuite). Silencieux. */
export async function prefetchUpcomingDailies(): Promise<void> {
  const today = todayLocalDate();
  for (const date of [today, addDays(today, 1)]) {
    try {
      await fetchDailyPuzzle(date);
    } catch (error) {
      logger.warn(`prefetch daily ${date} impossible`, error);
      return; // sans réseau, inutile d'insister pour demain
    }
  }
}

export function useDailyPercentile(date: LocalDate, enabled: boolean) {
  return useQuery({
    queryKey: ['percentile', date],
    enabled: enabled && supabase !== null,
    staleTime: Infinity,
    queryFn: async (): Promise<number | null> => {
      if (supabase === null) return null;
      const { data, error } = await supabase.rpc('get_daily_percentile', { p_date: date });
      if (error !== null) throw error;
      return typeof data === 'number' ? data : null;
    },
  });
}
