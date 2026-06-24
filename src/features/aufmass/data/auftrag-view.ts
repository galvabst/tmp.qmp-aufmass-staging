/**
 * Schmaler View-Typ für den Auftragsdatensatz aus `v_thermocheck_auftraege`.
 *
 * Bewusst NUR die Felder, die die Aufmaß-UI tatsächlich liest (nicht das volle
 * View-Schema) — damit der lesende Code typsicher ist statt `Record<string, any>`
 * + `(auftrag as any)?.feld`. Die View hat weitere Spalten; sie sind hier irrelevant.
 * Alle Felder optional, weil maybeSingle() null liefern kann und die View je nach
 * Lead-Stand nicht jedes Feld füllt.
 */
export interface AuftragViewData {
  id: string;
  lead_id?: string | null;
  lead_name?: string | null;
  kunde_vorname?: string | null;
  kunde_nachname?: string | null;
  kunde_strasse?: string | null;
  kunde_plz?: string | null;
  kunde_ort?: string | null;
  zugewiesener_techniker_id?: string | null;
}
