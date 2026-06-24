// Edge Function: autarc-patch-verify (T4 autarc-Validierungs-Gate)
//
// Dünner Deno-Wrapper um den reinen, getesteten Kern `autarcVerifyCore`:
//   1. liest AUTARC_API_KEY serverseitig (NIE im Client),
//   2. baut ein echtes fetch (injiziert in den Kern),
//   3. ruft den Kern (match → PATCH → readback → diff → rooms → heizlast → Gate),
//   4. schreibt das Ergebnis additiv in thermocheck.thermocheck_vot_formulare,
//   5. gibt das Gate-Ergebnis zurück.
//
// Die GESAMTE Entscheidungslogik bleibt im Kern. Hier steht nur Glue (Key, fetch,
// DB-Write, Response). Stil folgt admin-impersonate (CORS, OPTIONS, json-Helper).
//
// WICHTIG: Diese Funktion ist NICHT deployt. Kein echter autarc-Call wird hier
// ausgeführt — der Code ist nur vorbereitet. Deployment + Key-Setzen macht der
// Nutzer per CLI (Spec §12).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  autarcVerifyCore,
  type VerifyConfig,
  type VerifyInput,
} from '../../../src/features/aufmass/data/autarc-verify-core.ts';
import type { FetchLike } from '../../../src/features/aufmass/data/autarc-match.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AUTARC_BASE = 'https://api2.autarc.energy/api/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const apiKey = Deno.env.get('AUTARC_API_KEY');
    if (!apiKey) {
      return json({ error: 'AUTARC_API_KEY not configured' }, 500);
    }

    // Identitäts-Check (nicht nur Header-Präsenz): den Bearer-Token validieren.
    // Ein bloßes startsWith('Bearer ') ist KEINE Authentifizierung — sonst könnte
    // jeder beliebige String einen Service-Role-Write auf eine fremde vot_formular-
    // Zeile auslösen. Spiegelt aufmass-uwerte-analyze (getUser() + RLS-aware Owner-Check).
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
      db: { schema: 'thermocheck' },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: 'invalid_token' }, 401);
    }

    // Body: { vot_formular_id, values, savedProjectId?, customerName?, addressHint? }
    const body = await req.json().catch(() => ({}));
    const votFormularId: string | undefined = body.vot_formular_id;
    if (!votFormularId || typeof votFormularId !== 'string') {
      return json({ error: 'vot_formular_id is required' }, 400);
    }
    if (body.values == null || typeof body.values !== 'object') {
      return json({ error: 'values is required' }, 400);
    }

    // Eigentums-Check VOR dem Service-Role-Write: nur eine Zeile, die der Aufrufer
    // unter RLS überhaupt sehen darf, ist seine eigene. Nicht sichtbar → 404 (kein
    // fremder Patch). Erst danach eskaliert der Code auf die Service-Role.
    const { data: ownRow, error: ownErr } = await userClient
      .from('thermocheck_vot_formulare')
      .select('id')
      .eq('id', votFormularId)
      .maybeSingle();
    if (ownErr) {
      console.error('vot_formulare ownership check error', ownErr);
      return json({ error: 'ownership_check_failed' }, 500);
    }
    if (!ownRow) {
      return json({ error: 'vot_formular_not_found_or_not_yours' }, 404);
    }

    // Echtes fetch mit x-api-key, in den Kern injiziert.
    const fetchImpl: FetchLike = (url, init) => {
      const merged: RequestInit = {
        ...init,
        headers: { ...(init?.headers ?? {}), 'x-api-key': apiKey },
      };
      return fetch(url, merged);
    };

    const cfg: VerifyConfig = {
      baseUrl: AUTARC_BASE,
      apiKey,
      fetchImpl,
      heatLoadPollMs: 2000,
      heatLoadPollAttempts: 3,
    };

    const input: VerifyInput = {
      values: body.values,
      match: {
        savedProjectId: body.savedProjectId ?? null,
        customerName: body.customerName ?? null,
        addressHint: body.addressHint ?? null,
      },
    };

    const result = await autarcVerifyCore(input, cfg);

    // Ergebnis additiv in thermocheck.thermocheck_vot_formulare schreiben (Service-Role).
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceKey, {
      db: { schema: 'thermocheck' },
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });

    const { error: updateErr } = await db
      .from('thermocheck_vot_formulare')
      .update({
        autarc_project_id: result.projectId,
        autarc_sync_status: result.status,
        autarc_sync_diff: result.abweichungen ?? null,
        autarc_sync_error: result.status === 'fehler' ? result.meldung : null,
        autarc_synced_at: result.syncedAt,
      })
      .eq('id', votFormularId);

    if (updateErr) {
      console.error('vot_formulare update error', updateErr);
      // Das Gate-Urteil trotzdem zurückgeben — der Status ist schon ermittelt;
      // der Persistenz-Fehler darf das Urteil nicht zu Erfolg umdeuten.
      return json({ ...result, persistError: updateErr.message }, 200);
    }

    return json(result, 200);
  } catch (e) {
    console.error('autarc-patch-verify fatal', e);
    return json({ error: (e as Error).message }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
