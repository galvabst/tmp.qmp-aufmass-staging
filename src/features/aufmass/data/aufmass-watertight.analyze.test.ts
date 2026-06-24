import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { checkPlausibility } from './aufmass-plausibility';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { aufmassSubmitSchema, AufmassDraftData } from './aufmass-schema';
import { GENERATED_CASES } from './aufmass-watertight-cases.generated';
import { GENERATED_CASES_R2 } from './aufmass-watertight-cases.r2';
import { GENERATED_CASES_R3 } from './aufmass-watertight-cases.r3';
import { GENERATED_CASES_R4 } from './aufmass-watertight-cases.r4';
import { VALID_BASELINE, caughtBy, mergedFor } from './aufmass-watertight';

/**
 * Analyse-Lauf (kein Regressionstest): schreibt die aktuellen „Löcher" in eine
 * Datei und loggt die Verdichtung, damit der Loop-Treiber triagieren kann.
 */
describe('Wasserdicht-Analyse', () => {
  it('Baseline ist sauber (Schema grün + 0 Plausi-Befunde)', () => {
    const parsed = aufmassSubmitSchema.safeParse(VALID_BASELINE);
    expect(parsed.success, parsed.success ? '' : JSON.stringify(parsed.error.issues)).toBe(true);
    expect(checkPlausibility(VALID_BASELINE as Partial<AufmassDraftData>)).toEqual([]);
  });

  it('Löcher berechnen + Resttriage (reclassify vs skip)', () => {
    const KNOWN = new Set(
      ('techniker_name techniker_telefon thermocheck_datum heizung_inbetriebnahme_datum heizung_funktionstuechtig bauantrag_datum fossile_brennstoffe_nach_austausch gebaeudetyp beheizte_wohnflaeche_m2 anzahl_bewohner anzahl_etagen hat_denkmalschutz durchschnittsverbrauch_3_jahre fassade_gedaemmt dach_gedaemmt rohrsystem verglasung hat_kamin hat_solarthermie vorlauftemperatur ruecklauftemperatur mehr_bilder_heizungsraum heizungsraum_verlegen anschluss_vorlauf_vorhanden anschluss_vorlauf_distanz anschluss_ruecklauf_vorhanden anschluss_ruecklauf_distanz anschluss_warmwasser_vorhanden anschluss_warmwasser_distanz anschluss_kaltwasser_vorhanden anschluss_kaltwasser_distanz anschluss_zirkulation_vorhanden anschluss_zirkulation_distanz heizungsart heizungsart_sonstige oeltank_liter_gesamt oeltank_anzahl oeltank_liter_aktuell oeltank_transport_beschreibung heizkoerper_typ hat_erdung alternative_1_vorhanden alternative_2_vorhanden kunde_aufstellort_bestaetigt kunde_bestaetigung_vorname kunde_bestaetigung_nachname anzahl_duschen hat_regendusche anzahl_badewannen check_raeume_gescannt check_anzahl_raeume check_aufstellort_besprochen check_alle_bilder check_heizkoerper_aufgenommen bemerkungen anzahl_unbegehbare_raeume hat_pv_anlage agb_akzeptiert distanz_ausseneinheit_kernloch distanz_kernloch_innengeraet anzahl_durchbrueche_kernloch aufstellort_aenderung distanz_alter_neuer_aufstellort ' +
        'solarthermie_vorhanden denkmalschutz lagermoeglichkeit lagermoeglichkeit_beschreibung dachform dachausrichtung dachneigung sparrenabstand trapezdach trapezdach_art attika_vorhanden attika_masse aufdachdaemmung aufdachdaemmung_dicke thermodach ziegel_lose dacheindeckung_art ziegel_neigung ziegel_neigung_grad hindernisse_vorhanden fassade_daemmung_dicke oeffentliche_flaeche dc_fassade_moeglich dc_dachhaut_moeglich dc_ueber_10m module_gleiches_gebaeude gebaeude_entfernung verschattungen_vorhanden verschattungen_beschreibung belueftungsrohre blitzschutz_vorhanden hauszufuehrung blitzschutz_geprueft blitzschutz_abbaubar pv_kommentar pv_bestaetigung pv_unterschrift').split(/\s+/),
    );
    const dateRe = /datum|kalender|format|schaltjahr|jahr|uhrzeit|februar|29\.02|tag 3|tag 00|monat 00|0000|stellig|zeitzone/i;

    const active = [...GENERATED_CASES, ...GENERATED_CASES_R2, ...GENERATED_CASES_R3, ...GENERATED_CASES_R4];
    const holes = active.filter((c) => !caughtBy(c));
    const reclassify: { id: string; label: string }[] = [];
    const skip: Record<string, string> = {};
    for (const h of holes) {
      const merged = mergedFor(h);
      const anyIssue = (h.domain === 'pv' ? checkPvPlausibility(merged as never) : checkPlausibility(merged as never)).length > 0;
      const fieldKnown = KNOWN.has(h.field) && Object.keys(h.values).every((k) => KNOWN.has(k));
      if (h.expect === 'block' && anyIssue) {
        reclassify.push({ id: h.id, label: h.label });
      } else if (!fieldKnown) {
        skip[h.id] = 'Feld existiert nicht im Formular (Agenten-Halluzination)';
      } else if (dateRe.test(h.label)) {
        skip[h.id] = 'Datepicker verhindert Format-/Kalenderfehler – via UI nicht eingebbar';
      } else {
        skip[h.id] = 'via UI nicht eingebbar oder Fehlalarm-Risiko (Übereifer)';
      }
    }
    // Analyse-Artefakte nur lokal rausschreiben (Dev-Hilfe für weitere Loop-Runden).
    // In CI/anderer Umgebung schlägt der absolute Pfad fehl → still überspringen,
    // der Regressionstest (aufmass-watertight.test.ts) braucht diese Dateien NICHT.
    try {
      const dir = 'C:/Users/aberg/Downloads/dev/_scripts/watertight';
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(`${dir}/holes.json`, JSON.stringify(holes.map((h) => ({ id: h.id, page: h.page, field: h.field, expect: h.expect, label: h.label })), null, 2));
      fs.writeFileSync(`${dir}/overrides.json`, JSON.stringify({ reclassify, skip }, null, 2));
    } catch {
      /* nicht-lokale Umgebung: Schreiben überspringen */
    }
    // eslint-disable-next-line no-console
    console.log(`HOLES ${holes.length} | reclassify→soft ${reclassify.length} | skip ${Object.keys(skip).length}`);
  });
});
