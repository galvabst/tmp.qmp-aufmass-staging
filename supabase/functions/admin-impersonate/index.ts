// Edge Function: admin-impersonate
// Erlaubt Superadmins, sich temporär als ein anderer User einzuloggen.
// Generiert ein Magic-Link-Token via Service-Role und gibt access/refresh-Token zurück.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Aufrufer identifizieren
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const adminUserId = claimsData.claims.sub as string;

    // Service-Role-Client für Privileg-Check + admin.* Methoden
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Superadmin-Check
    const { data: roles, error: rolesError } = await adminClient
      .schema('iam')
      .from('user_system_roles')
      .select('role')
      .eq('user_id', adminUserId);

    if (rolesError) {
      console.error('roles fetch error', rolesError);
      return json({ error: 'Role check failed' }, 500);
    }
    const isSuperadmin = (roles ?? []).some((r: { role: string }) => r.role === 'superadmin');
    if (!isSuperadmin) {
      return json({ error: 'Forbidden – superadmin only' }, 403);
    }

    // Body parsen
    const body = await req.json().catch(() => ({}));
    const targetUserId: string | undefined = body.targetUserId;
    const reason: string | undefined = body.reason;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return json({ error: 'targetUserId is required' }, 400);
    }
    if (targetUserId === adminUserId) {
      return json({ error: 'Cannot impersonate yourself' }, 400);
    }

    // Ziel-User holen
    const { data: targetData, error: targetErr } = await adminClient.auth.admin.getUserById(targetUserId);
    if (targetErr || !targetData?.user?.email) {
      console.error('target user fetch error', targetErr);
      return json({ error: 'Target user not found or has no email' }, 404);
    }
    const targetEmail = targetData.user.email;

    // Magic-Link generieren
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error('generateLink error', linkErr);
      return json({ error: 'Failed to generate link' }, 500);
    }

    // Token einlösen → access/refresh
    const { data: verifyData, error: verifyErr } = await adminClient.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });
    if (verifyErr || !verifyData.session) {
      console.error('verifyOtp error', verifyErr);
      return json({ error: 'Failed to create session' }, 500);
    }

    // Audit-Log schreiben
    const { data: logRow, error: logErr } = await adminClient
      .schema('iam')
      .from('impersonation_log')
      .insert({
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        reason: reason ?? null,
      })
      .select('id')
      .single();
    if (logErr) {
      console.error('audit log insert error', logErr);
      // nicht blockierend, aber sichtbar machen
    }

    return json({
      access_token: verifyData.session.access_token,
      refresh_token: verifyData.session.refresh_token,
      target_email: targetEmail,
      log_id: logRow?.id ?? null,
    });
  } catch (e) {
    console.error('admin-impersonate fatal', e);
    return json({ error: (e as Error).message }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
