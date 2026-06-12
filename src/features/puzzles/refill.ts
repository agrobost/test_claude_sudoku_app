import { type Difficulty } from '@/engine';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

import { isPackPuzzle, type PackPuzzle } from './pack';
import { REFILL_THRESHOLD, usePuzzlesStore } from './store';

const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/** Recharge le stock local de grilles inédites quand il passe sous le seuil. */
export async function refillPuzzles(): Promise<void> {
  if (supabase === null) return;
  const store = usePuzzlesStore.getState();

  for (const difficulty of DIFFICULTIES) {
    if (store.unseenCount(difficulty) >= REFILL_THRESHOLD) continue;
    const { data, error } = await supabase.rpc('fetch_unplayed_puzzles', {
      p_difficulty: difficulty,
      p_count: 30,
    });
    if (error !== null) {
      logger.warn(`refill ${difficulty} impossible`, error);
      return; // probablement offline : on retentera à la prochaine connexion
    }
    const rows: unknown[] = Array.isArray(data) ? data : [];
    const puzzles = rows.filter(isPackPuzzle).map(
      (p): PackPuzzle => ({
        id: p.id,
        givens: p.givens,
        solution: p.solution,
        difficulty: p.difficulty,
      }),
    );
    if (puzzles.length > 0) store.addDownloaded(puzzles);
  }
}
