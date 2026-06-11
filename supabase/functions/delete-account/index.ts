// Suppression de compte (RGPD) : auth.users → cascade profiles → games.
// Le client ne peut pas supprimer son propre auth.users : on passe par le
// service role, en identifiant l'appelant via son JWT (vérifié par la
// plateforme, cf. verify_jwt dans config.toml).
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response(null, { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'missing server configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (jwt.length === 0) {
    return new Response(null, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error: userError } = await admin.auth.getUser(jwt);
  if (userError !== null || data.user === null) {
    return new Response(null, { status: 401 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError !== null) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, { status: 204 });
});
