/**
 * U-Werte-Challenge (deterministisch, offline, DSGVO-frei) — das verbindliche Tor
 * für den geschichteten Hüllen-Aufbau. Spiegelt die block/soft-Semantik von
 * aufmass-plausibility.ts:
 *  - 'block' = physikalisch/logisch UNMÖGLICH (Submit gesperrt, kein Override)
 *  - 'soft'  = fachlich UNPLAUSIBEL, aber möglich (Submit gesperrt bis korrigiert
 *              ODER Pflicht-Begründung)
 *
 * Bewusst KEINE U-Wert-BERECHNUNG (separater Folge-Schritt) und KEINE KI — nur
 * Konsistenz-/Plausibilitäts-Regeln auf den erfassten Schichten. Die KI-Schicht
 * (EU-Provider, später) ergänzt nur beratend.
 *
 * Fachliche Feinjustierung (Materialspannen, GEG-Schwelle) ist mit Alexander
 * (Heizlast-Experte) noch zu mergen — Schwellen zentral in U_T.
 */

import { yearFromIsoDate, type AufmassDraftData, type UWerteData } from './aufmass-schema';
import type { PlausibilityIssue } from './aufmass-plausibility';

export const U_T = {
  /** Mauerwerk dünner ist physikalisch keine tragende Außenwand. */
  mauerwerkHardMinCm: 5,
  /** Ab diesem Baujahr ist eine ungedämmte Hülle GEG-untypisch (soft). */
  gegPflichtAbBaujahr: 2015,
  /** Dämmdicke außerhalb dieser Spanne ist untypisch (soft). */
  daemmungUntypischMinCm: 4,
  daemmungUntypischMaxCm: 40,
  /** Fenster ab diesem Tauschjahr + Einfachverglasung = Widerspruch (soft). */
  fensterEinfachUntypischAbJahr: 2010,
  /**
   * Fenster-U-Wert (Uw, W/m²K) vs. Verglasung — physikalische Plausibilitätsgrenzen.
   * Ug der Scheibe + Rahmen: einfach ≈ 4,5–5,8; zweifach ≈ 2,7–3,0;
   * zweifach_waermeschutz ≈ 1,1–1,5; dreifach ≈ 0,8–1,1; dreifach_waermeschutz ≈ 0,5–0,9.
   * Das u_wert-Feld ist auf 0,4–3,0 begrenzt (Schema). Geprüft wird daher nur die
   * physikalische Untergrenze je Verglasungsklasse: ein zu NIEDRIGER Uw passt nicht
   * zu schlechter Verglasung. (Obergrenze für 3-fach lässt das Schema bei 3,0 zu →
   * eigene Soft-Regel, damit „dreifach mit Uw 2,8" nicht stumm durchrutscht.)
   */
  // Einfachverglasung liegt real bei Uw ≈ 4,5–5,8. Das Schema deckelt u_wert aber
  // bei 3,0 (s. aufmass-schema.ts) → JEDER schema-erlaubte Wert ist für echte
  // Einfachverglasung physikalisch zu gut. Schwelle daher auf den Schema-Deckel 3,0
  // gesetzt (statt 2,6), sonst rutschte das Band 2,6–3,0 stumm durch beide Gates.
  fensterUWertSoftMinEinfach: 3.0,
  fensterUWertSoftMinZweifach: 2.0,
  fensterUWertSoftMaxZweifachWaermeschutz: 1.8,
  fensterUWertSoftMaxDreifach: 1.4,
} as const;

type Wand = NonNullable<UWerteData['aussenwand']>;

/** Baujahr aus bauantrag_datum (TZ-sicher; geteilte SSoT yearFromIsoDate). */
function baujahrAus(values: Partial<AufmassDraftData>): number | null {
  return yearFromIsoDate(values.bauantrag_datum);
}

/** Wand-/Anbauwand-Regeln (Außenwand + Anbauwand teilen die Struktur). */
function wandRegeln(feld: string, wand: Wand | undefined, baujahr: number | null, push: (i: PlausibilityIssue) => void): void {
  if (!wand) return;
  // BLOCK: Dämmdicke > 0 aber Typ „keine" → Widerspruch.
  if (wand.daemmstoff_cm != null && wand.daemmstoff_cm > 0 && wand.daemmstoff_typ === 'keine') {
    push({ ruleId: `${feld}.daemmWiderspruch`, field: feld, severity: 'block', message: 'Dämmdicke angegeben, aber Dämmstoff „keine" gewählt — bitte korrigieren.' });
  }
  // SOFT: Dämmdicke > 0, aber KEIN Dämmstoff ausgewählt (Typ undefined, nicht „keine").
  // daemmLambda(undefined)=null → die Schicht fällt in berechneWandUWert still raus,
  // der gezeigte U-Wert bleibt der ungedämmte. Ohne diesen Hinweis sieht der Techniker
  // keinen Grund, warum seine Dämmangabe nicht wirkt.
  if (wand.daemmstoff_cm != null && wand.daemmstoff_cm > 0 && !wand.daemmstoff_typ) {
    push({ ruleId: `${feld}.daemmCmOhneTyp`, field: feld, severity: 'soft', message: 'Dämmdicke angegeben, aber kein Dämmstoff ausgewählt — die Schicht wird in der U-Wert-Schätzung ignoriert. Bitte Dämmstoff wählen oder begründen.' });
  }
  // BLOCK: Dämmjahr vor Baujahr → Zeitlogik unmöglich.
  if (baujahr != null && wand.daemmstoff_jahr != null && wand.daemmstoff_jahr < baujahr) {
    push({ ruleId: `${feld}.daemmjahr`, field: feld, severity: 'block', message: `Dämmjahr (${wand.daemmstoff_jahr}) liegt vor dem Baujahr (${baujahr}) — das ist nicht möglich.` });
  }
  // BLOCK: Mauerwerk physikalisch zu dünn.
  if (wand.mauerwerk_cm != null && wand.mauerwerk_cm > 0 && wand.mauerwerk_cm < U_T.mauerwerkHardMinCm) {
    push({ ruleId: `${feld}.mauerwerkDuenn`, field: feld, severity: 'block', message: `Mauerwerk ${wand.mauerwerk_cm} cm ist unrealistisch dünn (min. ${U_T.mauerwerkHardMinCm} cm) — bitte prüfen.` });
  }
  // SOFT: Neubau ohne Dämmung (GEG-untypisch). „keine" ODER (kein Typ UND 0 cm).
  const ungedaemmt = wand.daemmstoff_typ === 'keine' || (wand.daemmstoff_typ == null && (wand.daemmstoff_cm ?? 0) === 0);
  if (baujahr != null && baujahr >= U_T.gegPflichtAbBaujahr && ungedaemmt) {
    push({ ruleId: `${feld}.neubauUngedaemmt`, field: feld, severity: 'soft', message: `Baujahr ${baujahr}: Wand ohne Dämmung ist ungewöhnlich (GEG). Innendämmung oder monolithischer Ziegel? Bitte begründen.` });
  }
  // SOFT: Dämmdicke außerhalb typischer Spanne.
  if (wand.daemmstoff_cm != null && wand.daemmstoff_cm > 0 && (wand.daemmstoff_cm < U_T.daemmungUntypischMinCm || wand.daemmstoff_cm > U_T.daemmungUntypischMaxCm)) {
    push({ ruleId: `${feld}.daemmDickeUntypisch`, field: feld, severity: 'soft', message: `Dämmdicke ${wand.daemmstoff_cm} cm ist untypisch — bitte prüfen/begründen.` });
  }
}

/**
 * Deterministische Plausibilität des U-Werte-Blocks. Leeres u_werte → keine Issues
 * (Vollständigkeit prüft das Gate separat, s. pruefeUWerteVollstaendigkeit).
 */
export function checkUWertePlausibilitaet(values: Partial<AufmassDraftData>): PlausibilityIssue[] {
  const u = values.u_werte;
  if (!u) return [];
  const issues: PlausibilityIssue[] = [];
  const push = (i: PlausibilityIssue) => issues.push(i);
  const baujahr = baujahrAus(values);

  wandRegeln('u_werte_aussenwand', u.aussenwand, baujahr, push);
  if (u.anbau?.vorhanden) wandRegeln('u_werte_anbau', u.anbau.wand, u.anbau.baujahr ?? baujahr, push);

  // Dach
  const d = u.dach;
  if (d) {
    for (const [jahrKey, typKey, cmKey] of [
      ['zwischensparren_jahr', 'zwischensparren_daemmstoff_typ', 'zwischensparren_cm'],
      ['aufdach_jahr', 'aufdach_daemmstoff_typ', 'aufdach_cm'],
    ] as const) {
      const jahrV = d[jahrKey];
      const typV = d[typKey];
      const cmV = d[cmKey];
      if (baujahr != null && jahrV != null && jahrV < baujahr) {
        push({ ruleId: `u_werte_dach.${jahrKey}`, field: 'u_werte_dach', severity: 'block', message: `Dach-Dämmjahr (${jahrV}) liegt vor dem Baujahr (${baujahr}) — nicht möglich.` });
      }
      if (cmV != null && cmV > 0 && typV === 'keine') {
        push({ ruleId: `u_werte_dach.${cmKey}Widerspruch`, field: 'u_werte_dach', severity: 'block', message: 'Dach: Dämmdicke angegeben, aber Dämmstoff „keine" — bitte korrigieren.' });
      }
      // SOFT: Dach-Dämmdicke > 0, aber kein Dämmstoff gewählt (typ undefined) →
      // Schicht fällt in berechneDachUWert still raus (analog Wand-Regel oben).
      if (cmV != null && cmV > 0 && !typV) {
        push({ ruleId: `u_werte_dach.${cmKey}OhneTyp`, field: 'u_werte_dach', severity: 'soft', message: 'Dach: Dämmdicke angegeben, aber kein Dämmstoff ausgewählt — die Schicht wird in der U-Wert-Schätzung ignoriert. Bitte Dämmstoff wählen oder begründen.' });
      }
    }
    // „Ungedämmt" = es liegt KEINE wirksame Dämmschicht vor. Eine Schicht zählt nur,
    // wenn sie sowohl einen echten Dämmstoff (Typ != 'keine'/null) ALS AUCH cm>0 hat —
    // sonst fällt sie in berechneDachUWert ohnehin raus (cm=0 → keine Dämmwirkung).
    // Pro Schicht prüfen statt Typ und cm getrennt über alle Schichten zu kreuzen,
    // sonst umgeht „Typ gesetzt aber cm=0" still den Neubau-ungedämmt-Hinweis.
    const dachSchichtGedaemmt = (typ: string | null | undefined, cm: number | null | undefined): boolean =>
      typ != null && typ !== 'keine' && (cm ?? 0) > 0;
    const dachUngedaemmt =
      !dachSchichtGedaemmt(d.zwischensparren_daemmstoff_typ, d.zwischensparren_cm) &&
      !dachSchichtGedaemmt(d.aufdach_daemmstoff_typ, d.aufdach_cm) &&
      (d.untersparren_cm ?? 0) === 0;
    if (baujahr != null && baujahr >= U_T.gegPflichtAbBaujahr && dachUngedaemmt) {
      push({ ruleId: 'u_werte_dach.neubauUngedaemmt', field: 'u_werte_dach', severity: 'soft', message: `Baujahr ${baujahr}: Dach ohne Dämmung ist ungewöhnlich (GEG). Bitte prüfen/begründen.` });
    }
    // SOFT: Flachdach trägt Steildach-Dämmwerte (Sparren) → Restwerte aus zuvor
    // gewähltem Steildach? Bitte prüfen.
    if (d.dachtyp === 'flachdach' && ((d.zwischensparren_cm ?? 0) > 0 || (d.aufdach_cm ?? 0) > 0 || (d.untersparren_cm ?? 0) > 0)) {
      push({ ruleId: 'u_werte_dach.flachdachMitSteildachDaemmung', field: 'u_werte_dach', severity: 'soft', message: 'Flachdach mit Steildach-Dämmwerten (Zwischen-/Auf-/Untersparren) — bitte prüfen/korrigieren.' });
    }
  }

  // Bodenplatte / Kellerdecke
  const b = u.unten;
  if (b) {
    if (b.daemmung_cm != null && b.daemmung_cm > 0 && b.daemmung_typ === 'keine') {
      push({ ruleId: 'u_werte_unten.daemmWiderspruch', field: 'u_werte_unten', severity: 'block', message: 'Bodenplatte/Keller: Dämmdicke angegeben, aber Dämmstoff „keine" — bitte korrigieren.' });
    }
    if (baujahr != null && b.daemmung_jahr != null && b.daemmung_jahr < baujahr) {
      push({ ruleId: 'u_werte_unten.daemmjahr', field: 'u_werte_unten', severity: 'block', message: `Boden-Dämmjahr (${b.daemmung_jahr}) liegt vor dem Baujahr (${baujahr}) — nicht möglich.` });
    }
  }

  // Fenster (verglasung ist ein Top-Level-Feld)
  const f = u.fenster;
  if (f) {
    if (f.getauscht === true && f.tausch_jahr == null) {
      push({ ruleId: 'u_werte_fenster.tauschJahr', field: 'u_werte_fenster', severity: 'soft', message: 'Fenster als „getauscht" markiert, aber kein Tauschjahr angegeben — bitte ergänzen.' });
    }
    // BLOCK: Fenster-Tauschjahr vor Baujahr → Zeitlogik unmöglich (Konsistenz zu den anderen Jahr-Regeln).
    if (baujahr != null && f.tausch_jahr != null && f.tausch_jahr < baujahr) {
      push({ ruleId: 'u_werte_fenster.tauschVorBaujahr', field: 'u_werte_fenster', severity: 'block', message: `Fenster-Tauschjahr (${f.tausch_jahr}) liegt vor dem Baujahr (${baujahr}) — das ist nicht möglich.` });
    }
    if (f.tausch_jahr != null && f.tausch_jahr >= U_T.fensterEinfachUntypischAbJahr && values.verglasung === 'einfach') {
      push({ ruleId: 'u_werte_fenster.einfachUntypisch', field: 'u_werte_fenster', severity: 'soft', message: `Fenstertausch ${f.tausch_jahr} + Einfachverglasung passt nicht zusammen — bitte prüfen.` });
    }
    // SOFT: Fenster-U-Wert passt physikalisch nicht zur gewählten Verglasung.
    // Schlechte Verglasung kann keinen guten (niedrigen) Uw haben — und gute keinen
    // schlechten (hohen). Sonst rutscht ein widersprüchliches Wertepaar in die
    // Heizlast/U-Wert-Rechnung. Nur prüfen, wenn beide Felder gesetzt sind.
    if (f.u_wert != null) {
      const verglasung = values.verglasung;
      // Einfachverglasung: <= (nicht <) — das Schema deckelt u_wert bei 3,0 (= der
      // Schwelle), echte Einfachverglasung liegt aber real bei Uw ≈ 4,5–5,8. JEDER
      // schema-erlaubte Wert ist also zu gut, auch der Grenzwert 3,0 selbst. Mit `<`
      // rutschte genau u_wert=3,0 stumm durch (Off-by-one); `<=` fängt das ganze Band.
      if (verglasung === 'einfach' && f.u_wert <= U_T.fensterUWertSoftMinEinfach) {
        push({ ruleId: 'u_werte_fenster.uWertZuGutFuerEinfach', field: 'u_werte_fenster', severity: 'soft', message: `Fenster-U-Wert ${f.u_wert} W/m²K ist zu niedrig für Einfachverglasung (real ≈ 4,5–5,8) — Verglasung oder U-Wert prüfen.` });
      } else if (verglasung === 'zweifach' && f.u_wert < U_T.fensterUWertSoftMinZweifach) {
        push({ ruleId: 'u_werte_fenster.uWertZuGutFuerZweifach', field: 'u_werte_fenster', severity: 'soft', message: `Fenster-U-Wert ${f.u_wert} W/m²K ist zu niedrig für einfache Zweifachverglasung (ohne Wärmeschutz ≈ 2,7–3,0) — bitte prüfen.` });
      } else if (verglasung === 'zweifach_waermeschutz' && f.u_wert > U_T.fensterUWertSoftMaxZweifachWaermeschutz) {
        push({ ruleId: 'u_werte_fenster.uWertZuSchlechtFuerZweifachWs', field: 'u_werte_fenster', severity: 'soft', message: `Fenster-U-Wert ${f.u_wert} W/m²K ist zu hoch für Zweifach-Wärmeschutzverglasung (real ≈ 1,1–1,5) — bitte prüfen.` });
      } else if ((verglasung === 'dreifach' || verglasung === 'dreifach_waermeschutz') && f.u_wert > U_T.fensterUWertSoftMaxDreifach) {
        push({ ruleId: 'u_werte_fenster.uWertZuSchlechtFuerDreifach', field: 'u_werte_fenster', severity: 'soft', message: `Fenster-U-Wert ${f.u_wert} W/m²K ist zu hoch für Dreifachverglasung (real ≈ 0,5–1,1) — bitte prüfen.` });
      }
    }
  }

  return issues;
}

export interface UWerteFehlend {
  /** Feld für den Sprung (über FIELD_META auf den U-Werte-Schritt auflösbar). */
  feld: string;
  label: string;
}

/**
 * Pflicht-Kern des U-Werte-Blocks (vom Submit-Gate erzwungen, nicht von zod —
 * damit die bestehende Wasserdicht-Suite unangetastet bleibt). Leeres Array =
 * Kern vollständig.
 */
export function pruefeUWerteVollstaendigkeit(values: Partial<AufmassDraftData>): UWerteFehlend[] {
  const u = values.u_werte ?? {};
  const fehlend: UWerteFehlend[] = [];

  if (!u.aussenwand?.mauerwerk_material) fehlend.push({ feld: 'u_werte_aussenwand', label: 'Außenwand: Mauerwerk-Material' });
  // Dicke 0 ist genauso unbrauchbar wie fehlend: cmToM(0)=0 → berechneWandUWert liefert
  // null → Submit blockt ohnehin. Hier explizit als „fehlend" melden, damit der Techniker
  // den echten Grund sieht statt eines grünen Hakens am U-Werte-Feld.
  if (u.aussenwand?.mauerwerk_cm == null || u.aussenwand.mauerwerk_cm === 0) fehlend.push({ feld: 'u_werte_aussenwand', label: 'Außenwand: Mauerwerk-Dicke (cm)' });
  if (!u.dach?.dachtyp) fehlend.push({ feld: 'u_werte_dach', label: 'Dach: Dachtyp' });
  if (!u.unten?.art) fehlend.push({ feld: 'u_werte_unten', label: 'Bodenplatte/Keller: Art' });
  if (u.fenster?.getauscht === true && u.fenster.tausch_jahr == null) fehlend.push({ feld: 'u_werte_fenster', label: 'Fenster: Tauschjahr' });
  if (u.anbau?.vorhanden === true) {
    if (u.anbau.baujahr == null) fehlend.push({ feld: 'u_werte_anbau', label: 'Anbau: Baujahr' });
    if (!u.anbau.wand?.mauerwerk_material) fehlend.push({ feld: 'u_werte_anbau', label: 'Anbau: Mauerwerk-Material' });
    // Symmetrie zur Hauptaußenwand (Z.214): ohne Dicke liefert berechneWandUWert null →
    // das Gate würde sonst „vollständig" melden, obwohl der Anbau-U-Wert nicht berechenbar ist.
    if (u.anbau.wand?.mauerwerk_cm == null || u.anbau.wand.mauerwerk_cm === 0) fehlend.push({ feld: 'u_werte_anbau', label: 'Anbau: Mauerwerk-Dicke (cm)' });
  }
  return fehlend;
}
