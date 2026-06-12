import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { kv } from '@/lib/mmkv';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const authStorage = {
  getItem: (key: string) => kv.getString(key),
  setItem: (key: string, value: string) => {
    kv.setString(key, value);
  },
  removeItem: (key: string) => {
    kv.remove(key);
  },
};

/**
 * Client Supabase, ou null si l'environnement n'est pas configuré
 * (l'app reste pleinement jouable offline : tout appelant gère le null).
 * L'anon key est publique by design — la sécurité repose sur la RLS.
 */
export const supabase: SupabaseClient | null =
  url !== undefined && url.length > 0 && anonKey !== undefined && anonKey.length > 0
    ? createClient(url, anonKey, {
        auth: {
          storage: authStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
      })
    : null;
