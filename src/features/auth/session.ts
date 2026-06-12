import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

/**
 * Garantit une session (anonyme par défaut) dès que possible.
 * Échec silencieux toléré : l'app joue offline, on réessaiera au prochain démarrage.
 */
export async function ensureAnonymousSession(): Promise<void> {
  if (supabase === null) return;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session !== null) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error !== null) {
      logger.warn('signInAnonymously a échoué', error);
    }
  } catch (error) {
    logger.warn('ensureAnonymousSession a échoué', error);
  }
}

/** uid de la session courante, ou null hors connexion/configuration. */
export async function currentUserId(): Promise<string | null> {
  if (supabase === null) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}
