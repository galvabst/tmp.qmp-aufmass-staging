import { supabase } from '@/integrations/supabase/client';
import type { AufmassDraftData } from './aufmass-schema';
import type { GateResult } from './autarc-gate';

/**
 * Ruft das T4-autarc-Gate (Edge Function `autarc-patch-verify`): schickt die
 * Gebäudedaten an autarc, liest zurück, vergleicht, prüft Räume + Heizlast und
 * liefert das Urteil (Status + konkrete Meldung).
 *
 * OFFLINE-SICHER: wirft NIE. Bei nicht erreichbarer / nicht deployter Function,
 * Netzfehler oder unklarer Antwort → `ausstehend` (blockt), damit das bereits
 * lokal gespeicherte Aufmaß nie als „freigegeben" durchgeht und der Abgleich
 * später nachgeholt werden kann. „Kein Fehler je als Erfolg" gilt auch hier.
 */
export interface AutarcVerifyParams {
  votFormularId: string;
  values: Partial<AufmassDraftData>;
  savedProjectId?: string | null;
  customerName?: string | null;
  addressHint?: string | null;
}

const NICHT_ERREICHBAR: GateResult = {
  status: 'ausstehend',
  blockt: true,
  meldung:
    'autarc war nicht erreichbar — das Aufmaß ist gespeichert, der Abgleich mit autarc wird später automatisch nachgeholt.',
};

/**
 * DEV-Mock-Ergebnis (kein autarc-Call). Bewusst `freigegeben` (blockt:false), damit
 * der lokale Submit-Flow & die Integrationstests die Kette durchlaufen, OHNE die
 * IRREVERSIBLE echte autarc-Function `autarc-patch-verify` (Projekt-Patch) zu treffen.
 * Klartext kennzeichnet das Ergebnis als Mock — nichts wird in autarc verändert.
 */
const DEV_MOCK: GateResult = {
  status: 'freigegeben',
  blockt: false,
  meldung: 'DEV-Mock: autarc-Gate übersprungen (kein echter Abgleich). Für echten Abgleich: VITE_AUTARC_REAL=1 setzen.',
};

/**
 * Echter autarc-Abgleich aktiv? In DEV nur wenn `VITE_AUTARC_REAL=1` (analog zum
 * Foto-Check `echterCheckAktiv()`). In Prod immer — der Mock greift nie in einer
 * gebauten App. Verhindert, dass DEV/Staging die nicht deployte Edge Function
 * trifft (→ ewiges `ausstehend`) und blockiert lokale Tests/Flows.
 */
function echterAutarcAktiv(): boolean {
  if (!import.meta.env.DEV) return true;
  return import.meta.env.VITE_AUTARC_REAL === '1';
}

export async function runAutarcVerify(p: AutarcVerifyParams): Promise<GateResult> {
  // DEV-Mock-Mode: ohne VITE_AUTARC_REAL=1 NICHT die echte (Projekt-patchende)
  // Function aufrufen — sonst hängt das Gate in DEV/Staging dauerhaft auf 'ausstehend'.
  if (!echterAutarcAktiv()) {
    console.warn('[autarc-verify] DEV-Mock-Mode aktiv → kein echter autarc-Abgleich. Für echten Abgleich: VITE_AUTARC_REAL=1 setzen.');
    return DEV_MOCK;
  }
  try {
    const { data, error } = await supabase.functions.invoke('autarc-patch-verify', {
      body: {
        vot_formular_id: p.votFormularId,
        values: p.values,
        savedProjectId: p.savedProjectId ?? null,
        customerName: p.customerName ?? null,
        addressHint: p.addressHint ?? null,
      },
    });

    if (error || !data) return NICHT_ERREICHBAR;

    const r = data as Partial<GateResult> & { error?: string };
    // Die Function liefert bei internen Problemen evtl. { error: ... } statt eines Urteils.
    if (r.error || typeof r.status !== 'string' || typeof r.meldung !== 'string') {
      return NICHT_ERREICHBAR;
    }
    return r as GateResult;
  } catch {
    return NICHT_ERREICHBAR;
  }
}
