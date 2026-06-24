import { supabase } from '@/integrations/supabase/client';
import { AufmassDraftData } from './aufmass-schema';
import { ConfirmWarning } from '../ui/PlausibilityConfirmDialog';

/**
 * Whitelist der TECHNISCHEN Felder, die an den KI-Gesamtcheck gehen.
 * Bewusst OHNE Kundendaten (Name, Adresse, Kundenbestätigung) — Datenschutz.
 */
const TECH_FIELDS: (keyof AufmassDraftData)[] = [
  'gebaeudetyp', 'beheizte_wohnflaeche_m2', 'anzahl_bewohner', 'anzahl_etagen', 'hat_denkmalschutz',
  'durchschnittsverbrauch_3_jahre', 'fassade_gedaemmt', 'dach_gedaemmt', 'rohrsystem', 'verglasung',
  'hat_kamin', 'hat_solarthermie', 'vorlauftemperatur', 'ruecklauftemperatur', 'heizungsart',
  'heizkoerper_typ', 'anzahl_duschen', 'anzahl_badewannen', 'bauantrag_datum',
  'heizung_inbetriebnahme_datum', 'anschluss_zirkulation_vorhanden',
];

interface AiResponse {
  findings?: { field?: string; problem?: string; severity?: string }[];
}

/**
 * Ruft den beratenden KI-Gesamtcheck (Edge Function aufmass-plausibility-ai).
 * Liefert IMMER eine (ggf. leere) Liste — bei offline / Fehler / nicht-deployt
 * gibt es [], damit die deterministische Regel-Schicht das alleinige Tor bleibt.
 */
export async function runAiPlausibility(values: Partial<AufmassDraftData>): Promise<ConfirmWarning[]> {
  try {
    const v = values as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    for (const k of TECH_FIELDS) {
      if (v[k] != null) fields[k] = v[k];
    }
    if (Object.keys(fields).length === 0) return [];

    const { data, error } = await supabase.functions.invoke('aufmass-plausibility-ai', { body: { fields } });
    if (error || !data) return [];

    const findings = (data as AiResponse).findings ?? [];
    return findings
      .filter((f) => f && typeof f.problem === 'string' && f.problem.length > 0)
      .map((f) => ({ message: String(f.problem), source: 'KI' as const }));
  } catch {
    return [];
  }
}
