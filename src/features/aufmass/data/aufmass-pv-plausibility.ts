import { PvAufmassDraftData } from './pv-aufmass-schema';
import { PlausibilityIssue } from './aufmass-plausibility';

/**
 * PV-Plausibilität (deterministisch, offline) — gleiche Stufen wie die WP-Engine:
 *   - 'block' = physikalisch/baulich unmöglich → Submit gesperrt.
 *   - 'soft'  = unplausibel aber möglich → korrigieren oder begründen.
 *
 * Schwellen zentral & kalibrierbar. Gefüllt aus dem Wasserdicht-Loop
 * (Enumerations-Schwarm, Runde 1).
 */

export const PV_PLAUSIBILITY_THRESHOLDS = {
  /** Dachneigung (°). 0=Flachdach, übliche Schrägdächer bis ~60°. */
  dachneigung: { hardMin: 0, hardMax: 90, softMax: 70 },
  /** Ziegel-/Sparren-Neigung (°) + max. plausible Abweichung zur Dachneigung. */
  ziegelNeigung: { hardMin: 0, hardMax: 90, abweichungSoft: 25 },
  /** Entfernung Modul- zu Wechselrichter-Gebäude (m). Für Wohngebäude realistisch ≤100 m. */
  entfernung: { hardMin: 0, softMax: 100 },
  /** Aufdachdämmung (cm). */
  aufdachdaemmung: { hardMin: 0, softMax: 40 },
} as const;

function num(v: unknown): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

export function checkPvPlausibility(values: Partial<PvAufmassDraftData>): PlausibilityIssue[] {
  const v = values as Record<string, unknown>;
  const T = PV_PLAUSIBILITY_THRESHOLDS;
  const issues: PlausibilityIssue[] = [];
  const add = (ruleId: string, field: string, severity: PlausibilityIssue['severity'], message: string) =>
    issues.push({ ruleId, field, severity, message });

  const dachneigung = num(v.dachneigung);
  const ziegel = num(v.ziegel_neigung_grad);
  const entfernung = num(v.gebaeude_entfernung);
  const daemmung = num(v.aufdachdaemmung_dicke);

  // -- Dachneigung --
  if (dachneigung != null) {
    if (dachneigung < T.dachneigung.hardMin || dachneigung > T.dachneigung.hardMax)
      add('pv.dachneigung.hard', 'dachneigung', 'block', `Dachneigung ${dachneigung}° ist unmöglich (0–90°).`);
    else if (dachneigung > T.dachneigung.softMax)
      add('pv.dachneigung.steil', 'dachneigung', 'soft', `Dachneigung ${dachneigung}° ist für ein Wohndach sehr steil – bitte prüfen.`);
  }

  // -- Ziegel-/Sparrenneigung --
  if (ziegel != null) {
    if (ziegel < T.ziegelNeigung.hardMin || ziegel > T.ziegelNeigung.hardMax)
      add('pv.ziegelNeigung.hard', 'ziegel_neigung_grad', 'block', `Ziegel-Neigung ${ziegel}° ist unmöglich (0–90°).`);
    else if (dachneigung != null && Math.abs(ziegel - dachneigung) > T.ziegelNeigung.abweichungSoft)
      add('pv.ziegelNeigung.abweichung', 'ziegel_neigung_grad', 'soft', `Ziegel-Neigung (${ziegel}°) weicht stark von der Dachneigung (${dachneigung}°) ab.`);
  }
  // Querfeld: Neigungs-Richtung „negativ" mit 0° ist widersprüchlich – 0° hat keine Richtung.
  if (v.ziegel_neigung === 'negativ' && ziegel === 0)
    add('pv.ziegelNeigung.nullRichtung', 'ziegel_neigung_grad', 'soft', 'Neigungsrichtung „negativ" zusammen mit 0° ist widersprüchlich – eine Neigung von 0° hat keine Richtung.');

  // -- Entfernung Modul-/Wechselrichter-Gebäude (Querfeld mit module_gleiches_gebaeude) --
  if (entfernung != null) {
    if (entfernung < T.entfernung.hardMin) {
      add('pv.entfernung.negativ', 'gebaeude_entfernung', 'block', `Entfernung ${entfernung} m ist unmöglich.`);
    } else {
      if (v.module_gleiches_gebaeude === false && entfernung === 0)
        add('pv.entfernung.andersGebaeude0', 'gebaeude_entfernung', 'soft', 'Module auf anderem Gebäude, aber Entfernung 0 m – bitte Entfernung angeben.');
      if (v.module_gleiches_gebaeude === true && entfernung > 0)
        add('pv.entfernung.gleichTrotzDistanz', 'gebaeude_entfernung', 'soft', 'Gleiches Gebäude, aber eine Entfernung > 0 m angegeben – Widerspruch.');
      if (entfernung > T.entfernung.softMax)
        add('pv.entfernung.gross', 'gebaeude_entfernung', 'soft', `Entfernung ${entfernung} m ist ungewöhnlich groß.`);
    }
  }

  // -- Module auf anderem Gebäude, aber GAR KEINE Entfernung angegeben --
  // (die `=== 0`-Regel oben greift nur bei explizit 0; null/undefined rutschte durch).
  if (v.module_gleiches_gebaeude === false && entfernung == null)
    add('pv.entfernung.andersGebaeudeKeine', 'gebaeude_entfernung', 'soft', 'Module auf einem anderen Gebäude, aber keine Entfernung angegeben – bitte die Entfernung erfassen.');

  // -- DC-Leitung ≤10 m markiert, aber Entfernung > 10 m --
  if (v.dc_ueber_10m === false && entfernung != null && entfernung > 10)
    add('pv.dc.unter10TrotzEntfernung', 'dc_ueber_10m', 'soft', 'DC-Leitung als ≤10 m markiert, aber Gebäude-Entfernung > 10 m – Widerspruch.');

  // -- DC-Leitung weder über Fassade noch Dachhaut möglich --
  if (v.dc_fassade_moeglich === false && v.dc_dachhaut_moeglich === false)
    add('pv.dc.keinWeg', 'dc_fassade_moeglich', 'soft', 'Weder über die Fassade noch über die Dachhaut ist eine DC-Leitung möglich – wie wird die Leitung geführt?');

  // -- Aufdachdämmung „ja", aber keine Dämmstärke --
  if (v.aufdachdaemmung === true && num(v.aufdachdaemmung_dicke) == null)
    add('pv.daemmung.dickeFehlt', 'aufdachdaemmung_dicke', 'soft', 'Aufdachdämmung „ja", aber keine Dämmstärke angegeben.');

  // Querfeld: Aufdachdämmung ist ein Schrägdach-Konzept – bei Flachdach (Dachform
  // „flach" oder Neigung 0°) ist sie fachlich widersprüchlich.
  // Wort-Grenze \bflachdach\b statt Substring /flach/ — sonst gilt „Flachdachgaube
  // auf Satteldach" (ein Schrägdach!) fälschlich als Flachdach. dachneigung===0 ist
  // das verlässliche Signal; die Dachform-Prüfung ist nur Zusatz für den Fall ohne Neigung.
  const istFlachdach = (typeof v.dachform === 'string' && /\bflachdach\b/i.test(v.dachform)) || dachneigung === 0;
  if (istFlachdach && v.aufdachdaemmung === true)
    add('pv.aufdach.flachdach', 'aufdachdaemmung', 'soft', 'Aufdachdämmung bei einem Flachdach (0°) ist fachlich ungewöhnlich – Aufdachdämmung ist ein Schrägdach-Konzept. Bitte prüfen.');

  // -- Aufdachdämmung --
  if (daemmung != null) {
    if (daemmung < T.aufdachdaemmung.hardMin)
      add('pv.daemmung.negativ', 'aufdachdaemmung_dicke', 'block', `Aufdachdämmung ${daemmung} cm ist unmöglich.`);
    else if (daemmung > T.aufdachdaemmung.softMax)
      add('pv.daemmung.dick', 'aufdachdaemmung_dicke', 'soft', `Aufdachdämmung ${daemmung} cm ist ungewöhnlich dick.`);
  }

  return issues;
}
