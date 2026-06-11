/**
 * Smoke tests RLS contre une stack Supabase LOCALE (supabase start + db reset).
 *
 * Usage :
 *   SUPABASE_ANON_KEY=<anon key affichée par `supabase status`> npm run test:rls
 *   (SUPABASE_URL optionnel, défaut http://127.0.0.1:54321)
 *
 * Vérifie avec deux utilisateurs anonymes réels : isolation des games/profiles,
 * non-lecture des dailies futurs, RPC, immuabilité du journal.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';

let failures = 0;

function check(label: string, ok: boolean, detail?: unknown): void {
  if (ok) {
    console.log(`  ✓ ${label}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}`, detail ?? '');
  }
}

function utcDatePlusDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

async function anonymousUser(): Promise<{ client: SupabaseClient; userId: string }> {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signInAnonymously();
  if (error !== null || data.user === null) {
    throw new Error(`signInAnonymously a échoué : ${error?.message ?? 'pas de user'}`);
  }
  return { client, userId: data.user.id };
}

async function main(): Promise<void> {
  if (anonKey === '') {
    console.error('SUPABASE_ANON_KEY manquant (visible via `supabase status`).');
    process.exit(1);
  }
  const today = utcDatePlusDays(0);

  console.log(`Cible : ${url}`);
  const a = await anonymousUser();
  const b = await anonymousUser();
  check('deux sessions anonymes distinctes', a.userId !== b.userId);

  // profiles : créés par trigger, visibles uniquement par leur propriétaire
  const ownProfile = await a.client.from('profiles').select('id');
  check(
    'A ne voit que son profil',
    ownProfile.data?.length === 1 && ownProfile.data[0]?.id === a.userId,
    ownProfile,
  );

  // daily_puzzles : passé/présent lisibles, futur (J+2) invisible
  const dailies = await a.client.from('daily_puzzles').select('daily_date').lte('daily_date', today);
  check('les dailies jusqu’à aujourd’hui sont lisibles (seed requis)', (dailies.data?.length ?? 0) >= 1, dailies);
  const future = await a.client
    .from('daily_puzzles')
    .select('daily_date')
    .eq('daily_date', utcDatePlusDays(2));
  check('le daily de J+2 est invisible', future.data?.length === 0, future);

  // RPC fetch_unplayed_puzzles
  const unplayed = await a.client.rpc('fetch_unplayed_puzzles', { p_difficulty: 'easy', p_count: 5 });
  check('fetch_unplayed_puzzles renvoie 5 grilles easy', unplayed.data?.length === 5, unplayed.error);
  const puzzleId: string = unplayed.data?.[0]?.id ?? '';

  // games : insertion pour soi, idempotence, interdiction d'écrire pour autrui
  const gameId = randomUUID();
  const inserted = await a.client.from('games').insert({
    id: gameId,
    user_id: a.userId,
    puzzle_id: puzzleId,
    mode: 'classic',
    difficulty: 'easy',
    result: 'won',
    duration_ms: 245_000,
    mistakes: 1,
    hints_used: 0,
  });
  check('A insère sa partie', inserted.error === null, inserted.error);

  const duplicate = await a.client.from('games').insert({
    id: gameId,
    user_id: a.userId,
    puzzle_id: puzzleId,
    mode: 'classic',
    difficulty: 'easy',
    result: 'won',
    duration_ms: 245_000,
  });
  check('le doublon d’id est rejeté (23505)', duplicate.error?.code === '23505', duplicate.error);

  const upsert = await a.client
    .from('games')
    .upsert(
      {
        id: gameId,
        user_id: a.userId,
        puzzle_id: puzzleId,
        mode: 'classic',
        difficulty: 'easy',
        result: 'won',
        duration_ms: 245_000,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );
  check('le re-sync idempotent (upsert ignoreDuplicates) passe', upsert.error === null, upsert.error);

  const forgery = await a.client.from('games').insert({
    id: randomUUID(),
    user_id: b.userId, // ← écrire pour quelqu'un d'autre
    puzzle_id: puzzleId,
    mode: 'classic',
    difficulty: 'easy',
    result: 'won',
    duration_ms: 100_000,
  });
  check('A ne peut pas écrire une partie au nom de B (42501)', forgery.error?.code === '42501', forgery.error);

  const bReads = await b.client.from('games').select('id');
  check('B ne voit aucune partie de A', bReads.data?.length === 0, bReads);

  const aReads = await a.client.from('games').select('id');
  check('A voit sa partie', aReads.data?.length === 1, aReads);

  // journal immuable : update/delete sans politique → 0 ligne affectée
  const update = await a.client.from('games').update({ duration_ms: 1 }).eq('id', gameId).select();
  check('update refusé silencieusement (0 ligne)', update.data?.length === 0, update);
  const remove = await a.client.from('games').delete().eq('id', gameId).select();
  check('delete refusé silencieusement (0 ligne)', remove.data?.length === 0, remove);

  // percentile : null sans victoire daily, numérique ensuite
  const noWin = await a.client.rpc('get_daily_percentile', { p_date: today });
  check('percentile null sans victoire', noWin.data === null, noWin);
  const dailyWin = await a.client.from('games').insert({
    id: randomUUID(),
    user_id: a.userId,
    puzzle_id: puzzleId,
    mode: 'daily',
    daily_date: today,
    difficulty: 'medium',
    result: 'won',
    duration_ms: 312_000,
  });
  check('A insère sa victoire daily', dailyWin.error === null, dailyWin.error);
  const pct = await a.client.rpc('get_daily_percentile', { p_date: today });
  check('percentile numérique après victoire', typeof pct.data === 'number', pct);

  // tables en lecture seule pour les clients
  const writePuzzle = await a.client
    .from('puzzles')
    .insert({ givens: '0'.repeat(81), solution: '1'.repeat(81), difficulty: 'easy', max_technique: 'x' });
  check('insertion dans puzzles refusée (42501)', writePuzzle.error?.code === '42501', writePuzzle.error);

  const peek = await a.client.from('profiles').select('id').eq('id', b.userId);
  check('A ne voit pas le profil de B', peek.data?.length === 0, peek);

  console.log(failures === 0 ? '\nRLS : tout est vert.' : `\nRLS : ${failures} échec(s).`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  console.error('Échec inattendu :', error);
  process.exit(1);
});
