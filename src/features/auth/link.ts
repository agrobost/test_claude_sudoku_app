import * as WebBrowser from 'expo-web-browser';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export type LinkProvider = 'apple' | 'google';

export type AuthActionResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

const REDIRECT_TO = 'sudokuapp://auth-callback';

function extractAuthCode(url: string): string | null {
  const match = /[?&]code=([^&#]+)/.exec(url);
  return match?.[1] ?? null;
}

/**
 * Lie une identité Apple/Google à la session anonyme courante (même uid,
 * aucune migration de données) via le flow OAuth PKCE dans un navigateur système.
 */
export async function linkIdentity(provider: LinkProvider): Promise<AuthActionResult> {
  if (supabase === null) return { ok: false, reason: 'not-configured' };

  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: { redirectTo: REDIRECT_TO, skipBrowserRedirect: true },
  });
  if (error !== null || typeof data.url !== 'string') {
    return { ok: false, reason: error?.message ?? 'no-auth-url' };
  }

  const session = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_TO);
  if (session.type !== 'success') {
    return { ok: false, reason: session.type }; // cancel / dismiss : pas une erreur
  }

  const code = extractAuthCode(session.url);
  if (code === null) return { ok: false, reason: 'no-code' };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError !== null) return { ok: false, reason: exchangeError.message };
  return { ok: true };
}

/**
 * Déconnexion puis nouvelle session anonyme. La purge des données locales
 * appartient à l'appelant (l'écran Réglages orchestre les features).
 */
export async function signOutToFreshAnonymous(): Promise<AuthActionResult> {
  if (supabase === null) return { ok: false, reason: 'not-configured' };
  try {
    await supabase.auth.signOut();
  } catch (error) {
    logger.warn('signOut a échoué, on repart quand même sur une session neuve', error);
  }
  const { error } = await supabase.auth.signInAnonymously();
  if (error !== null) return { ok: false, reason: error.message };
  return { ok: true };
}

/** Suppression RGPD côté serveur (cascade) puis nouvelle session anonyme. */
export async function deleteAccount(): Promise<AuthActionResult> {
  if (supabase === null) return { ok: false, reason: 'not-configured' };
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error !== null) return { ok: false, reason: error.message };
  const { error: anonError } = await supabase.auth.signInAnonymously();
  if (anonError !== null) return { ok: false, reason: anonError.message };
  return { ok: true };
}
