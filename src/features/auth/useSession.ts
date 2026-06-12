import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type SessionInfo = {
  readonly userId: string | null;
  readonly isAnonymous: boolean;
  /** Email de l'identité liée, si disponible. */
  readonly email: string | null;
};

const EMPTY: SessionInfo = { userId: null, isAnonymous: true, email: null };

/** Infos de session réactives (liaison, déconnexion, suppression). */
export function useSession(): SessionInfo {
  const [info, setInfo] = useState<SessionInfo>(EMPTY);

  useEffect(() => {
    if (supabase === null) return;
    const client = supabase;

    const apply = (userId: string | null, isAnonymous: boolean, email: string | null): void => {
      setInfo({ userId, isAnonymous, email });
    };

    void client.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      apply(user?.id ?? null, user?.is_anonymous ?? true, user?.email ?? null);
    });

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      apply(user?.id ?? null, user?.is_anonymous ?? true, user?.email ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return info;
}
