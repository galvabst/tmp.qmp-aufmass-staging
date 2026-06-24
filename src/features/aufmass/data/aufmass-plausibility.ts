import { yearFromIsoDate, type AufmassDraftData } from './aufmass-schema';

/**
 * Plausibilitäts-Schicht (deterministisch, offline, gratis) — das verbindliche Tor.
 *
 * Prüft, ob eingegebene Werte SINN ergeben (nicht nur „vorhanden", das macht das
 * Pflichtfeld-Gate in aufmass-validation.ts).
 *
 *  - severity 'block' = physikalisch/logisch UNMÖGLICH → Submit gesperrt, kein Override.
 *  - severity 'soft'  = fachlich UNPLAUSIBEL, aber möglich → Submit gesperrt, bis
 *                       korrigiert ODER eine Pflicht-Begründung eingegeben wurde.
 *
 * Fachwerte (DE-Wohngebäude/WP) sind primärquellen-gestützt — siehe
 * _specs/2026-06-20-aufmass-plausibilitaet-bauphysik.md (DIN EN ISO 6946, GEG 2023,
 * IWU/TABULA, BDEW-HKV, destatis, Vaillant). Alle Schwellen zentral in
 * PLAUSIBILITY_THRESHOLDS (wartbar/kalibrierbar).
 *
 * Die KI-Schicht (Edge Function) ergänzt das nur beratend und blockt NIE.
 */

export interface PlausibilityIssue {
  /** Stabile Regel-ID (für Dialog-Keys + Begründungs-Zuordnung). */
  ruleId: string;
  /** Feld für den Sprung (über FIELD_META auf den Schritt auflösbar). */
  field: string;
  severity: 'block' | 'soft';
  message: string;
}

export const PLAUSIBILITY_THRESHOLDS = {
  wohnflaeche: { hardMin: 10, hardMax: 3000, softMin: 30, softMax: 1000, softMaxEfh: 500, proEtageSoftMin: 25, proEtageSoftMax: 400 },
  bewohner: { hardMin: 1, hardMax: 30, softMaxEfh: 12 },
  etagen: { hardMin: 1, hardMax: 25, softMaxEfh: 3, softMaxMfh: 12 },
  /** m² beheizte Wohnfläche pro Person (Querfeld). destatis 2024: Ø 49,2. */
  flaecheProPerson: { hardMin: 10, hardMax: 250, softMin: 20, softMax: 80 },
  /** Jahres-Heizenergie pro m² (kWh/m²·a; Öl ×10 von Liter). */
  verbrauchProM2: { hardMin: 10, hardMax: 500 },
  verbrauchAbsolut: { gasMaxKwh: 200000, oelMaxLiter: 20000 },
  /** Vorlauf/Rücklauf (°C). BDEW: Alt-Kessel 80/60, WP-Ziel 50/40. */
  vorlauf: { hardMin: 20, hardMax: 90, softMaxWp: 55, softMaxFbh: 45, hardMaxFbh: 55, softMinHeizkoerper: 40, softMaxEinrohr: 45 },
  ruecklauf: { hardMin: 10, hardMax: 85, maxSpreizung: 25, minSpreizung: 3, minSpreizungFbh: 2, fbhMaxRuecklauf: 32 },
  oeltank: { literHardMin: 200, literHardMax: 50000, literSoftMin: 1000, literSoftMax: 20000, anzahlHardMin: 1, anzahlHardMax: 20, proTankSoftMax: 5000 },
  /** Distanzen (m). Vaillant Split-Kältemittel max ~25 m. `durchbruecheProMeterLeitung`: 1 Durchbruch je ~3 m Leitung gilt als plausibel; deutlich mehr ist verdächtig. */
  distanz: { kernlochHardMax: 40, aussenSoftMax: 15, innenSoftMax: 20, durchbruecheHardMax: 10, durchbruecheSoftMax: 3, durchbruecheProMeterLeitung: 3, aufstellortHardMax: 100, aufstellortSoftMax: 30, anschlussHardMax: 100, anschlussSoftMax: 30 },
  sanitaer: { hardMax: 20 },
  mfh: { minWohnflaeche: 120 },
  datum: { bestandsheizungMinAlterMonate: 24, gebaeudeMinAlterMonate: 24, thermocheckMaxVergangenheitMonate: 3, bauGesamtMinMonate: 6, verbrauch3JahreMinMonate: 36 },
} as const;

/** kWh/Liter Heizöl (Brennwert-Näherung). */
const KWH_PRO_LITER_OEL = 10;

const EFH_TYPEN = ['einfamilienhaus', 'doppelhaushaelfte', 'reihenhaus', 'reihenendhaus'];
const VERGLASUNG_DREIFACH = ['dreifach', 'dreifach_waermeschutz'];

/** Erwartetes spez. Verbrauchsband (kWh/m²·a) je abgeleiteter energetischer Klasse. */
type EnergieKlasse = 'voll_gedaemmt' | 'teilsaniert' | 'unsaniert';
const ENERGIE_BAND: Record<EnergieKlasse, { softMin: number; softMax: number }> = {
  voll_gedaemmt: { softMin: 25, softMax: 130 },
  teilsaniert: { softMin: 50, softMax: 200 },
  unsaniert: { softMin: 90, softMax: 350 },
};

function num(v: unknown): number | null {
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

/** Heutiges Datum in LOKALER Zeit als YYYY-MM-DD (kein UTC → kein Mitternachts-Bug). */
function heuteLokal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const isDate = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);

/** Monate zwischen ISO-Datum und heute (grob, für Alters-/Abstands-Checks). */
function monateHer(d: string, heute: string): number {
  return (Date.parse(heute) - Date.parse(d)) / (1000 * 60 * 60 * 24 * 30.44);
}

/**
 * Liefert alle Plausibilitäts-Befunde für die aktuellen Werte. Reine Funktion.
 */
export function checkPlausibility(values: Partial<AufmassDraftData>): PlausibilityIssue[] {
  const v = values as Record<string, unknown>;
  const T = PLAUSIBILITY_THRESHOLDS;
  const issues: PlausibilityIssue[] = [];
  const add = (ruleId: string, field: string, severity: PlausibilityIssue['severity'], message: string) =>
    issues.push({ ruleId, field, severity, message });

  const flaeche = num(v.beheizte_wohnflaeche_m2);
  const bewohner = num(v.anzahl_bewohner);
  const etagen = num(v.anzahl_etagen);
  const verbrauch = num(v.durchschnittsverbrauch_3_jahre);
  const vorlauf = num(v.vorlauftemperatur);
  const ruecklauf = num(v.ruecklauftemperatur);
  const duschen = num(v.anzahl_duschen);
  const badewannen = num(v.anzahl_badewannen);
  const gebaeudetyp = typeof v.gebaeudetyp === 'string' ? v.gebaeudetyp : undefined;
  const istEfh = gebaeudetyp ? EFH_TYPEN.includes(gebaeudetyp) : undefined;
  const istMfh = gebaeudetyp === 'mehrfamilienhaus';
  const istGewerbe = gebaeudetyp === 'gewerbe';
  const heizkoerperTyp = typeof v.heizkoerper_typ === 'string' ? v.heizkoerper_typ : undefined;
  const hatFbh = heizkoerperTyp === 'fussbodenheizung' || heizkoerperTyp === 'beides';
  const hatHeizkoerper = heizkoerperTyp === 'heizkoerper' || heizkoerperTyp === 'beides';
  const istOel = v.heizungsart === 'oel';
  const verglasung = typeof v.verglasung === 'string' ? v.verglasung : undefined;
  const bauantragJahr = yearFromIsoDate(v.bauantrag_datum);
  const jungesGebaeude = bauantragJahr != null && bauantragJahr >= 2015;

  // -- Wohnfläche --
  if (flaeche != null) {
    if (flaeche < T.wohnflaeche.hardMin || flaeche > T.wohnflaeche.hardMax)
      add('wohnflaeche.hard', 'beheizte_wohnflaeche_m2', 'block', `Wohnfläche ${flaeche} m² ist unmöglich.`);
    else if (flaeche < T.wohnflaeche.softMin || flaeche > T.wohnflaeche.softMax)
      add('wohnflaeche.soft', 'beheizte_wohnflaeche_m2', 'soft', `Wohnfläche ${flaeche} m² ist ungewöhnlich.`);
    else if (istEfh === true && flaeche >= T.wohnflaeche.softMaxEfh)
      add('wohnflaeche.efh', 'beheizte_wohnflaeche_m2', 'soft', `${flaeche} m² ist sehr groß für ein Einfamilienhaus.`);
  }

  // -- Bewohner --
  if (bewohner != null) {
    if (bewohner < T.bewohner.hardMin || bewohner > T.bewohner.hardMax)
      add('bewohner.hard', 'anzahl_bewohner', 'block', `${bewohner} Bewohner ist unmöglich.`);
    else if (istEfh === true && bewohner >= T.bewohner.softMaxEfh)
      add('bewohner.efh', 'anzahl_bewohner', 'soft', `${bewohner} Bewohner für ein Einfamilienhaus – ungewöhnlich viele.`);
  }

  // -- Etagen --
  if (etagen != null) {
    if (etagen < T.etagen.hardMin || etagen > T.etagen.hardMax)
      add('etagen.hard', 'anzahl_etagen', 'block', `${etagen} Etagen ist unmöglich.`);
    else if (istEfh === true && etagen > T.etagen.softMaxEfh)
      add('etagen.efh', 'anzahl_etagen', 'soft', `${etagen} Etagen für ein Einfamilienhaus – ungewöhnlich.`);
    else if (istMfh && etagen === 1)
      add('etagen.mfh1', 'anzahl_etagen', 'soft', `Mehrfamilienhaus mit nur 1 Etage – ungewöhnlich.`);
    else if (!istEfh && istMfh && etagen > T.etagen.softMaxMfh)
      add('etagen.mfh', 'anzahl_etagen', 'soft', `${etagen} Etagen – ungewöhnlich viele.`);
  }

  // -- Querfeld: Personen ↔ Fläche --
  if (flaeche != null && bewohner != null && bewohner > 0 && flaeche > 0) {
    const proPerson = flaeche / bewohner;
    if (proPerson < T.flaecheProPerson.hardMin || proPerson > T.flaecheProPerson.hardMax)
      add('flaecheProPerson.hard', 'anzahl_bewohner', 'block', `${proPerson.toFixed(0)} m² pro Person (${bewohner} Pers. auf ${flaeche} m²) ist unmöglich.`);
    else if (proPerson <= T.flaecheProPerson.softMin)
      add('flaecheProPerson.eng', 'anzahl_bewohner', 'soft', `Nur ${proPerson.toFixed(0)} m² pro Person (${bewohner} Pers. auf ${flaeche} m²) – sehr eng.`);
    else if (proPerson > T.flaecheProPerson.softMax)
      add('flaecheProPerson.viel', 'anzahl_bewohner', 'soft', `${proPerson.toFixed(0)} m² pro Person – sehr viel.`);
  }

  // -- Querfeld: Wohnfläche ↔ Etagen --
  if (flaeche != null && etagen != null && etagen > 0 && flaeche > 0 && !istGewerbe) {
    const proEtage = flaeche / etagen;
    if (proEtage <= T.wohnflaeche.proEtageSoftMin)
      add('flaecheProEtage.duenn', 'beheizte_wohnflaeche_m2', 'soft', `Nur ${proEtage.toFixed(0)} m² je Etage (${flaeche} m² auf ${etagen} Etagen) – sehr dünn.`);
    else if (proEtage >= T.wohnflaeche.proEtageSoftMax)
      add('flaecheProEtage.gross', 'beheizte_wohnflaeche_m2', 'soft', `${proEtage.toFixed(0)} m² je Etage – ungewöhnlich groß.`);
  }

  // -- Querfeld: MFH ↔ Wohnfläche --
  if (istMfh && flaeche != null && flaeche > 0 && flaeche < T.mfh.minWohnflaeche)
    add('mfh.klein', 'beheizte_wohnflaeche_m2', 'soft', `Mehrfamilienhaus mit nur ${flaeche} m² – für ein MFH zu klein.`);

  // -- Verbrauch: absolut + spezifisch (kWh/m²·a) + Querfeld zur Dämmung --
  if (verbrauch != null) {
    if (verbrauch <= 0) {
      add('verbrauch.null', 'durchschnittsverbrauch_3_jahre', 'block', 'Verbrauch muss größer 0 sein.');
    } else if (istOel && verbrauch > T.verbrauchAbsolut.oelMaxLiter) {
      add('verbrauch.oelMax', 'durchschnittsverbrauch_3_jahre', 'block', `${verbrauch} Liter Öl/Jahr ist unmöglich.`);
    } else if (v.heizungsart === 'gas' && verbrauch > T.verbrauchAbsolut.gasMaxKwh) {
      add('verbrauch.gasMax', 'durchschnittsverbrauch_3_jahre', 'block', `${verbrauch} kWh/Jahr ist unmöglich.`);
    } else if (flaeche != null && flaeche > 0) {
      const kwh = istOel ? verbrauch * KWH_PRO_LITER_OEL : verbrauch;
      const proM2 = kwh / flaeche;
      if (proM2 < T.verbrauchProM2.hardMin || proM2 > T.verbrauchProM2.hardMax) {
        add('verbrauchProM2.hard', 'durchschnittsverbrauch_3_jahre', 'block', `Verbrauch ≈ ${proM2.toFixed(0)} kWh/m²·a ist physikalisch unmöglich.`);
      } else {
        // Erwartetes Band aus abgeleiteter energetischer Klasse.
        const gedaemmt = v.fassade_gedaemmt === true && v.dach_gedaemmt === true;
        const dreifachVerglast = verglasung ? VERGLASUNG_DREIFACH.includes(verglasung) : false;
        const unsaniert = v.fassade_gedaemmt === false && v.dach_gedaemmt === false && verglasung === 'einfach';
        const klasse: EnergieKlasse =
          gedaemmt && dreifachVerglast && jungesGebaeude ? 'voll_gedaemmt'
          : unsaniert ? 'unsaniert'
          : 'teilsaniert';
        const band = ENERGIE_BAND[klasse];
        const klasseLabel = klasse === 'voll_gedaemmt' ? 'gut gedämmtes' : klasse === 'unsaniert' ? 'unsaniertes' : 'teilsaniertes';
        if (proM2 < band.softMin)
          add('verbrauch.klasseNiedrig', 'durchschnittsverbrauch_3_jahre', 'soft', `Verbrauch ≈ ${proM2.toFixed(0)} kWh/m²·a ist sehr niedrig für ein ${klasseLabel} Gebäude.`);
        else if (proM2 > band.softMax)
          add('verbrauch.klasseHoch', 'durchschnittsverbrauch_3_jahre', 'soft', `Verbrauch ≈ ${proM2.toFixed(0)} kWh/m²·a ist sehr hoch für ein ${klasseLabel} Gebäude.`);
      }
    }
  }

  // -- Vorlauf / Rücklauf --
  if (vorlauf != null) {
    if (vorlauf < T.vorlauf.hardMin || vorlauf > T.vorlauf.hardMax)
      add('vorlauf.hard', 'vorlauftemperatur', 'block', `Vorlauf ${vorlauf} °C ist unmöglich.`);
    else {
      if (vorlauf > T.vorlauf.softMaxWp)
        add('vorlauf.wp', 'vorlauftemperatur', 'soft', `Vorlauf ${vorlauf} °C ist für eine Wärmepumpe zu hoch (ab ~55 °C: Heizflächen-Ertüchtigung oder Hochtemperatur-WP nötig).`);
      if (hatFbh && vorlauf > T.vorlauf.softMaxFbh)
        add('vorlauf.fbh', 'vorlauftemperatur', 'soft', `Vorlauf ${vorlauf} °C ist hoch für eine Fußbodenheizung.`);
      if (heizkoerperTyp === 'fussbodenheizung' && vorlauf > T.vorlauf.hardMaxFbh)
        add('vorlauf.fbhUnmoeglich', 'vorlauftemperatur', 'block', `Vorlauf ${vorlauf} °C bei reiner Fußbodenheizung ist nicht möglich – über ~${T.vorlauf.hardMaxFbh} °C drohen Estrichschäden (FBH-Auslegung ~35–45 °C).`);
      if (hatHeizkoerper && vorlauf < T.vorlauf.softMinHeizkoerper)
        add('vorlauf.hk', 'vorlauftemperatur', 'soft', `Vorlauf ${vorlauf} °C ist sehr niedrig für Heizkörper – heizen so kaum.`);
      if (v.rohrsystem === 'einrohr' && vorlauf < T.vorlauf.softMaxEinrohr)
        add('vorlauf.einrohr', 'vorlauftemperatur', 'soft', `Einrohrsystem mit nur ${vorlauf} °C Vorlauf – ungewöhnlich niedrig.`);
    }
  }
  if (ruecklauf != null && (ruecklauf < T.ruecklauf.hardMin || ruecklauf > T.ruecklauf.hardMax))
    add('ruecklauf.hard', 'ruecklauftemperatur', 'block', `Rücklauf ${ruecklauf} °C ist unmöglich.`);
  if (vorlauf != null && ruecklauf != null) {
    const spreizung = vorlauf - ruecklauf;
    if (ruecklauf >= vorlauf)
      add('ruecklauf.ueberVorlauf', 'ruecklauftemperatur', 'block', `Rücklauf (${ruecklauf} °C) muss kleiner als Vorlauf (${vorlauf} °C) sein.`);
    else if (spreizung > T.ruecklauf.maxSpreizung)
      add('spreizung.gross', 'ruecklauftemperatur', 'soft', `Spreizung ${spreizung.toFixed(0)} K ist ungewöhnlich groß.`);
    else if (spreizung < (hatFbh ? T.ruecklauf.minSpreizungFbh : T.ruecklauf.minSpreizung))
      // FBH (auch „beides") fährt systembedingt mit kleiner Spreizung — 2 K sind
      // normal (realer autarc-Bestand hat VL 32 °C), erst < 2 K (quasi kein Delta /
      // VL≈RL vertippt) ist verdächtig. Reine Heizkörper-/Einrohr-Systeme: < 3 K.
      // (Spreizung 0/negativ fängt ohnehin ruecklauf.ueberVorlauf als Hard-Block.)
      add('spreizung.klein', 'ruecklauftemperatur', 'soft', `Spreizung ${spreizung.toFixed(0)} K ist ungewöhnlich klein.`);
    // FBH-Rücklauf-Obergrenze: reine Fußbodenheizung gibt über die Fläche ab
    // (Oberfläche ~max 29 °C) → ein Rücklauf über ~32 °C ist physikalisch zu hoch
    // (überhitzte Fläche / VL-RL falsch erfasst). Eigene Regel, unabhängig von der
    // Spreizung (eine zu hohe FBH-RL bei korrekter Spreizung bliebe sonst unentdeckt).
    if (heizkoerperTyp === 'fussbodenheizung' && ruecklauf > T.ruecklauf.fbhMaxRuecklauf)
      add('fbh.ruecklaufHoch', 'ruecklauftemperatur', 'soft', `Rücklauf ${ruecklauf} °C ist für eine reine Fußbodenheizung zu hoch (Oberfläche max. ~29 °C; FBH-Rücklauf üblich ~28–30 °C). Bitte Vor-/Rücklauf prüfen.`);
    if (ruecklauf < vorlauf && heizkoerperTyp === 'fussbodenheizung' && spreizung > 12)
      add('spreizung.fbh', 'ruecklauftemperatur', 'soft', `Spreizung ${spreizung.toFixed(0)} K ist für eine reine Fußbodenheizung zu groß (Auslegung ~5–10 K).`);
  }

  // -- Öltank (nur Öl) --
  if (istOel) {
    const literGesamt = num(v.oeltank_liter_gesamt);
    const literAktuell = num(v.oeltank_liter_aktuell);
    const anzahl = num(v.oeltank_anzahl);
    if (literGesamt != null) {
      if (literGesamt < T.oeltank.literHardMin || literGesamt > T.oeltank.literHardMax)
        add('oeltank.gesamtHard', 'oeltank_liter_gesamt', 'block', `${literGesamt} Liter Tankvolumen ist unmöglich.`);
      else if (literGesamt < T.oeltank.literSoftMin || literGesamt > T.oeltank.literSoftMax)
        add('oeltank.gesamtSoft', 'oeltank_liter_gesamt', 'soft', `${literGesamt} Liter Tankvolumen ist ungewöhnlich.`);
    }
    if (anzahl != null && (anzahl < T.oeltank.anzahlHardMin || anzahl > T.oeltank.anzahlHardMax))
      add('oeltank.anzahlHard', 'oeltank_anzahl', 'block', `${anzahl} Öltanks ist unmöglich.`);
    if (literGesamt != null && anzahl != null && anzahl > 0 && literGesamt / anzahl > T.oeltank.proTankSoftMax)
      add('oeltank.proTank', 'oeltank_anzahl', 'soft', `${(literGesamt / anzahl).toFixed(0)} Liter je Tank – ungewöhnlich groß.`);
    if (literGesamt != null && anzahl != null && anzahl > 0 && literGesamt / anzahl < 150)
      add('oeltank.proTankKlein', 'oeltank_anzahl', 'soft', `${(literGesamt / anzahl).toFixed(0)} Liter je Tank – kleiner als der kleinste reale Heizöltank (~200 L), bitte Anzahl/Volumen prüfen.`);
    if (literGesamt != null && literAktuell != null && literAktuell > literGesamt)
      add('oeltank.aktuellUeberGesamt', 'oeltank_liter_aktuell', 'block', `Aktuell ${literAktuell} Liter, aber Tankvolumen nur ${literGesamt} Liter – unmöglich.`);
    // Querfeld: funktionstüchtige Ölheizung mit leerem Tank (0 L) – eine laufende
    // Heizung verbraucht Öl, ein dauerhaft leerer Tank passt nicht dazu. Bei
    // defekter Heizung (heizung_funktionstuechtig === false) ist 0 L plausibel → kein Befund.
    if (literAktuell === 0 && v.heizung_funktionstuechtig !== false)
      add('oeltank.aktuellLeer', 'oeltank_liter_aktuell', 'soft', 'Ölheizung läuft, aber der Tank ist mit 0 Litern angegeben – eine funktionierende Ölheizung hat normalerweise Restöl. Bitte Füllstand prüfen.');
  }

  // -- Distanzen (Aufstellort/Kernloch, m) --
  const distAussen = num(v.distanz_ausseneinheit_kernloch);
  const distInnen = num(v.distanz_kernloch_innengeraet);
  const durchbrueche = num(v.anzahl_durchbrueche_kernloch);
  if (distAussen != null) {
    if (distAussen < 0 || distAussen > T.distanz.kernlochHardMax)
      add('distAussen.hard', 'distanz_ausseneinheit_kernloch', 'block', `${distAussen} m Außeneinheit→Kernloch ist unmöglich (max. ~${T.distanz.kernlochHardMax} m).`);
    else if (distAussen > T.distanz.aussenSoftMax)
      add('distAussen.soft', 'distanz_ausseneinheit_kernloch', 'soft', `${distAussen} m ist ein langer Leitungsweg – bitte prüfen.`);
  }
  if (distInnen != null) {
    if (distInnen < 0 || distInnen > T.distanz.kernlochHardMax)
      add('distInnen.hard', 'distanz_kernloch_innengeraet', 'block', `${distInnen} m Kernloch→Innengerät ist unmöglich.`);
    else if (distInnen > T.distanz.innenSoftMax)
      add('distInnen.soft', 'distanz_kernloch_innengeraet', 'soft', `${distInnen} m ist ein langer Leitungsweg – bitte prüfen.`);
  }
  // Querfeld: gesamte Kältemittel-Leitung (außen + innen) über Split-Maximallänge.
  if (distAussen != null && distInnen != null && distAussen + distInnen > 30)
    add('kaeltemittel.gesamt', 'distanz_kernloch_innengeraet', 'soft', `Gesamte Kältemittel-Leitung ${distAussen + distInnen} m (außen + innen) überschreitet die übliche Split-Maximallänge (~25–30 m).`);
  if (durchbrueche != null) {
    if (durchbrueche < 0 || durchbrueche > T.distanz.durchbruecheHardMax)
      add('durchbrueche.hard', 'anzahl_durchbrueche_kernloch', 'block', `${durchbrueche} Durchbrüche ist unmöglich.`);
    else if (durchbrueche > T.distanz.durchbruecheSoftMax)
      add('durchbrueche.soft', 'anzahl_durchbrueche_kernloch', 'soft', `${durchbrueche} Durchbrüche – ungewöhnlich viele.`);
  }
  // 0 Durchbrüche trotz Außeneinheit + Leitungsweg
  if (durchbrueche === 0 && ((distAussen != null && distAussen > 0) || (distInnen != null && distInnen > 0)))
    add('durchbrueche.nullTrotzLeitung', 'anzahl_durchbrueche_kernloch', 'soft', `0 Durchbrüche, aber Außeneinheit + Leitungsweg angegeben – ein Kernloch ist mindestens 1 Durchbruch.`);
  // Querfeld: deutlich mehr Durchbrüche als der Leitungsweg hergibt – jeder Durchbruch
  // kostet Aufwand/Geld, viele Durchbrüche bei kurzer Leitung sind unplausibel (Tippfehler?).
  // Erst ab > 3 Durchbrüchen prüfen (kurze Wege haben sonst keinen sinnvollen Bezug),
  // und nur wenn beide Distanzen erfasst sind.
  if (durchbrueche != null && durchbrueche > 3 && distAussen != null && distInnen != null) {
    const leitungGesamt = distAussen + distInnen;
    const maxPlausibel = Math.ceil(leitungGesamt / T.distanz.durchbruecheProMeterLeitung) + 1;
    if (durchbrueche > maxPlausibel)
      add('durchbrueche.zuVieleFuerLeitung', 'anzahl_durchbrueche_kernloch', 'soft', `${durchbrueche} Durchbrüche bei nur ${leitungGesamt} m Leitungsweg – ungewöhnlich viele. Bitte prüfen.`);
  }

  // Aufstellort-Änderung
  if (v.aufstellort_aenderung === true) {
    const distNeu = num(v.distanz_alter_neuer_aufstellort);
    if (distNeu != null) {
      if (distNeu < 0 || distNeu > T.distanz.aufstellortHardMax)
        add('aufstellortDist.hard', 'distanz_alter_neuer_aufstellort', 'block', `${distNeu} m alter→neuer Aufstellort ist unmöglich.`);
      else if (distNeu === 0)
        add('aufstellortDist.null', 'distanz_alter_neuer_aufstellort', 'soft', `Aufstellort-Änderung angegeben, aber Distanz 0 m – passt das?`);
      else if (distNeu > T.distanz.aufstellortSoftMax)
        add('aufstellortDist.soft', 'distanz_alter_neuer_aufstellort', 'soft', `${distNeu} m zwischen altem und neuem Aufstellort – ungewöhnlich weit.`);
    }
  }
  // 2. Alternative ohne 1. Alternative
  if (v.alternative_2_vorhanden === true && v.alternative_1_vorhanden !== true)
    add('alternative.reihenfolge', 'alternative_1_vorhanden', 'soft', `2. Alternative vorhanden, aber keine 1. Alternative – Reihenfolge prüfen.`);

  // Anschluss-Distanzen (nur bei Heizungsraum-Verlegung relevant; defensiv geprüft)
  const leitungen: { key: string; label: string }[] = [
    { key: 'vorlauf', label: 'Vorlauf' }, { key: 'ruecklauf', label: 'Rücklauf' },
    { key: 'warmwasser', label: 'Warmwasser' }, { key: 'kaltwasser', label: 'Kaltwasser' },
    { key: 'zirkulation', label: 'Zirkulation' },
  ];
  for (const l of leitungen) {
    const dist = num(v[`anschluss_${l.key}_distanz`]);
    const vorhanden = v[`anschluss_${l.key}_vorhanden`];
    if (dist != null) {
      if (dist < 0 || dist > T.distanz.anschlussHardMax)
        add(`anschluss.${l.key}.hard`, `anschluss_${l.key}_distanz`, 'block', `${dist} m Leitung ${l.label} ist unmöglich.`);
      else if (dist > T.distanz.anschlussSoftMax)
        add(`anschluss.${l.key}.soft`, `anschluss_${l.key}_distanz`, 'soft', `${dist} m Leitung ${l.label} – ungewöhnlich lang.`);
      if (vorhanden === false && dist > 0)
        add(`anschluss.${l.key}.widerspruch`, `anschluss_${l.key}_distanz`, 'soft', `${l.label} als „nicht vorhanden" markiert, aber Distanz ${dist} m angegeben.`);
    }
  }

  // -- Sanitär --
  if (duschen != null && (duschen < 0 || duschen > T.sanitaer.hardMax))
    add('duschen.hard', 'anzahl_duschen', 'block', `${duschen} Duschen ist unmöglich.`);
  if (badewannen != null && (badewannen < 0 || badewannen > T.sanitaer.hardMax))
    add('badewannen.hard', 'anzahl_badewannen', 'block', `${badewannen} Badewannen ist unmöglich.`);
  if (v.hat_regendusche === true && duschen === 0)
    add('regendusche.ohneDusche', 'anzahl_duschen', 'soft', `Regendusche angegeben, aber 0 Duschen – eine Regendusche ist eine Dusche.`);
  if (duschen === 0 && badewannen === 0)
    add('sanitaer.keine', 'anzahl_duschen', 'soft', `0 Duschen und 0 Badewannen – keine Waschmöglichkeit angegeben.`);
  if (badewannen != null && bewohner != null && badewannen > bewohner)
    add('badewannen.ueberBewohner', 'anzahl_badewannen', 'soft', `Mehr Badewannen (${badewannen}) als Bewohner (${bewohner}).`);
  if (duschen != null && bewohner != null && duschen > bewohner + 1)
    add('duschen.ueberBewohner', 'anzahl_duschen', 'soft', `Mehr Duschen (${duschen}) als Bewohner + 1.`);

  // -- Datum (lokales Heute → kein UTC-Mitternachts-Bug) --
  const heute = heuteLokal();
  const tc = v.thermocheck_datum;
  const ib = v.heizung_inbetriebnahme_datum;
  const ba = v.bauantrag_datum;
  const heizungDefekt = v.heizung_funktionstuechtig === false;

  if (isDate(tc)) {
    if (tc > heute)
      add('tc.zukunft', 'thermocheck_datum', 'block', 'Das ThermoCheck-Datum liegt in der Zukunft – das ist nicht möglich.');
    else if (monateHer(tc, heute) > T.datum.thermocheckMaxVergangenheitMonate)
      add('tc.alt', 'thermocheck_datum', 'soft', `Das ThermoCheck-Datum liegt ${Math.round(monateHer(tc, heute))} Monate zurück – stimmt das?`);
  }
  if (isDate(ib)) {
    if (ib > heute)
      add('ib.zukunft', 'heizung_inbetriebnahme_datum', 'block', 'Die Inbetriebnahme der Heizung kann nicht in der Zukunft liegen.');
    else if (Number(ib.slice(0, 4)) < 1950)
      add('ib.fruehJahr', 'heizung_inbetriebnahme_datum', 'soft', `Inbetriebnahme ${ib.slice(0, 4)} ist ungewöhnlich früh – bitte prüfen.`);
    else if (!heizungDefekt && monateHer(ib, heute) < T.datum.bestandsheizungMinAlterMonate)
      add('ib.zuNeu', 'heizung_inbetriebnahme_datum', 'soft', `Die bestehende Heizung wurde erst ${ib.slice(0, 4)} in Betrieb genommen – ein Austausch nach so kurzer Zeit ist ungewöhnlich.`);
  }
  if (isDate(ba)) {
    if (ba > heute)
      add('ba.zukunft', 'bauantrag_datum', 'block', 'Das Bauantrag-Datum kann nicht in der Zukunft liegen.');
    else if (Number(ba.slice(0, 4)) < 1850)
      add('ba.fruehJahr', 'bauantrag_datum', 'soft', `Bauantrag ${ba.slice(0, 4)} ist ungewöhnlich früh – bitte prüfen.`);
    else if (monateHer(ba, heute) < T.datum.gebaeudeMinAlterMonate)
      add('ba.zuNeu', 'bauantrag_datum', 'soft', `Gebäude erst ${ba.slice(0, 4)} beantragt – ein Bestandsheizungs-Austausch an einem so neuen Gebäude ist ungewöhnlich.`);
  }
  // Querfeld: Heizung kann nicht VOR dem Bauantrag in Betrieb gegangen sein → unmöglich.
  if (isDate(ib) && isDate(ba) && ib < ba)
    add('ib.vorBa', 'heizung_inbetriebnahme_datum', 'block', 'Die Heizung kann nicht vor dem Bauantrag des Gebäudes in Betrieb gegangen sein – bitte Datumsangaben korrigieren.');
  // Querfeld: ThermoCheck-Termin kann nicht VOR dem Bauantrag liegen → Gebäude existierte noch nicht.
  if (isDate(tc) && isDate(ba) && tc < ba)
    add('tc.vorBa', 'thermocheck_datum', 'block', 'Das ThermoCheck-Datum liegt vor dem Bauantrag des Gebäudes – ein noch nicht beantragtes Gebäude kann nicht vor Ort aufgenommen werden.');
  // Querfeld: ThermoCheck-Termin vor Inbetriebnahme der vorgefundenen Heizung → war noch nicht in Betrieb.
  if (isDate(tc) && isDate(ib) && tc < ib)
    add('tc.vorIb', 'thermocheck_datum', 'soft', 'Das ThermoCheck-Datum liegt vor der Inbetriebnahme der vorgefundenen Heizung – die Anlage war beim Termin noch nicht in Betrieb. Bitte Datumsangaben prüfen.');
  // Querfeld: Gebäude von Genehmigung bis beheizt in < 6 Monaten → unrealistisch.
  if (isDate(ib) && isDate(ba) && ib >= ba) {
    const monateBauZuHeizung = (Date.parse(ib) - Date.parse(ba)) / (1000 * 60 * 60 * 24 * 30.44);
    if (monateBauZuHeizung < T.datum.bauGesamtMinMonate)
      add('bauZuSchnell', 'heizung_inbetriebnahme_datum', 'soft', `Zwischen Bauantrag und Heizungs-Inbetriebnahme liegen unter ${T.datum.bauGesamtMinMonate} Monate – Bau dauert i. d. R. länger.`);
  }
  // Querfeld: 3-Jahres-Verbrauch, aber Gebäude/Heizung < 3 Jahre → Schnitt kann nicht existieren.
  if (verbrauch != null && verbrauch > 0) {
    const ibNeu = isDate(ib) && monateHer(ib, heute) < T.datum.verbrauch3JahreMinMonate;
    const baNeu = isDate(ba) && monateHer(ba, heute) < T.datum.verbrauch3JahreMinMonate;
    if (ibNeu || baNeu)
      add('verbrauch.kein3Jahre', 'durchschnittsverbrauch_3_jahre', 'soft', `3-Jahres-Verbrauch angegeben, aber Heizung/Gebäude ist noch keine 3 Jahre alt – diesen Schnitt kann es noch nicht geben.`);
  }
  // Querfeld: Denkmalschutz
  if (v.hat_denkmalschutz === true && isDate(ba) && Number(ba.slice(0, 4)) > 1990)
    add('denkmal.neu', 'hat_denkmalschutz', 'soft', `Denkmalschutz bei Bauantrag ${ba.slice(0, 4)} – ein so modernes Gebäude unter Denkmalschutz ist ungewöhnlich.`);
  if (v.hat_denkmalschutz === true && v.fassade_gedaemmt === true)
    add('denkmal.fassade', 'fassade_gedaemmt', 'soft', `Denkmalschutz + gedämmte Fassade – Außendämmung an denkmalgeschützten Fassaden ist meist unzulässig.`);

  // Querfeld: junges Gebäude kann nach GEG nicht einfachverglast + ungedämmt sein.
  if (jungesGebaeude && v.fassade_gedaemmt === false && v.dach_gedaemmt === false && verglasung === 'einfach')
    add('energie.jungUnsaniert', 'verglasung', 'soft', `Junges Gebäude (Bauantrag ${bauantragJahr}) mit Einfachverglasung und ungedämmter Fassade/Dach – nach GEG praktisch unmöglich.`);

  // Querfeld: Neubau (ab 2015) mit Ölheizung — seit GEG/EE-Pflicht sehr ungewöhnlich;
  // ein moderner Neubau wird i. d. R. nicht mit einer fossilen Ölheizung errichtet.
  if (jungesGebaeude && istOel)
    add('heizung.neubauOel', 'heizungsart', 'soft', `Neubau (Bauantrag ${bauantragJahr}) mit Ölheizung – seit GEG ungewöhnlich, bitte prüfen.`);

  // -- Heizungsraum / Anschluss-Verlegung (Querfeld-Widersprüche) --
  const anyAnschlussData = leitungen.some(
    (l) => v[`anschluss_${l.key}_vorhanden`] != null || num(v[`anschluss_${l.key}_distanz`]) != null,
  );
  for (const l of leitungen) {
    if (v[`anschluss_${l.key}_vorhanden`] === true && num(v[`anschluss_${l.key}_distanz`]) === 0)
      add(`anschluss.${l.key}.dist0`, `anschluss_${l.key}_distanz`, 'soft', `${l.label} als vorhanden markiert, aber Distanz 0 m – passt das?`);
  }
  if (v.heizungsraum_verlegen === false && anyAnschlussData)
    add('heizungsraum.verlegenNeinTrotzDaten', 'heizungsraum_verlegen', 'soft', 'Heizungsraum nicht verlegen, aber Anschlussdaten ausgefüllt – Widerspruch.');
  if (v.heizungsraum_verlegen === true && leitungen.every((l) => v[`anschluss_${l.key}_vorhanden`] === false))
    add('heizungsraum.verlegenJaKeineLeitung', 'heizungsraum_verlegen', 'soft', 'Heizungsraum verlegen, aber alle Anschlüsse als nicht vorhanden – wozu dann verlegen?');
  const vlVorhanden = v.anschluss_vorlauf_vorhanden;
  const rlVorhanden = v.anschluss_ruecklauf_vorhanden;
  if (vlVorhanden != null && rlVorhanden != null && vlVorhanden !== rlVorhanden)
    add('anschluss.vlRlPaar', 'anschluss_vorlauf_vorhanden', 'soft', 'Vorlauf und Rücklauf gehören als Paar – nur eine der beiden Leitungen vorhanden ist widersprüchlich.');
  if (v.anschluss_zirkulation_vorhanden === true && v.anschluss_warmwasser_vorhanden === false)
    add('anschluss.zirkOhneWw', 'anschluss_zirkulation_vorhanden', 'soft', 'Zirkulation vorhanden, aber Warmwasser nicht – eine Zirkulation setzt eine Warmwasserleitung voraus.');
  if (v.anschluss_warmwasser_vorhanden === true && v.anschluss_kaltwasser_vorhanden === false)
    add('anschluss.wwOhneKw', 'anschluss_kaltwasser_vorhanden', 'soft', 'Warmwasser vorhanden, aber Kaltwasser nicht – Warmwasser braucht eine Kaltwasser-Zuleitung (Speicher-Nachspeisung).');

  // -- Heizungsart-Residuen (Felder gefüllt, die nicht zur Heizungsart passen) --
  const oeltankDaten =
    num(v.oeltank_liter_gesamt) != null || num(v.oeltank_anzahl) != null || num(v.oeltank_liter_aktuell) != null ||
    (typeof v.oeltank_transport_beschreibung === 'string' && v.oeltank_transport_beschreibung.trim() !== '');
  if (v.heizungsart != null && !istOel && oeltankDaten)
    add('heizungsart.oeltankOhneOel', 'oeltank_liter_gesamt', 'soft', 'Öltank-/Transportdaten ausgefüllt, obwohl die Heizungsart nicht Öl ist.');
  if (v.heizungsart != null && v.heizungsart !== 'sonstige' && typeof v.heizungsart_sonstige === 'string' && v.heizungsart_sonstige.trim() !== '')
    add('heizungsart.sonstigeOhneSonstige', 'heizungsart_sonstige', 'soft', '„Sonstige Heizungsart" ist ausgefüllt, obwohl eine andere Heizungsart gewählt wurde.');

  // -- Heizkörper × Rohrsystem --
  if (v.rohrsystem === 'einrohr' && hatFbh)
    add('heizkoerper.einrohrFbh', 'heizkoerper_typ', 'soft', 'Einrohrsystem mit Fußbodenheizung ist eine sehr ungewöhnliche Kombination – bitte prüfen.');

  // -- Aufstellort: Distanz alt/neu gesetzt, aber keine Änderung markiert --
  if (v.aufstellort_aenderung !== true && num(v.distanz_alter_neuer_aufstellort) != null)
    add('aufstellort.distOhneAenderung', 'distanz_alter_neuer_aufstellort', 'soft', 'Distanz alter↔neuer Aufstellort angegeben, aber keine Aufstellort-Änderung markiert – Widerspruch.');

  // -- Fossile Brennstoffe bleiben nach WP-Austausch (Auftragszweck/GEG-Widerspruch) --
  if (v.fossile_brennstoffe_nach_austausch === true)
    add('fossile.bleibt', 'fossile_brennstoffe_nach_austausch', 'soft', 'Fossile Brennstoffe sollen nach dem Wärmepumpen-Austausch bleiben – widerspricht dem Austauschziel (GEG/BEG 65 %-EE). Bitte prüfen.');

  // -- Energetische Konsistenz Hülle ↔ Verglasung --
  if (v.fassade_gedaemmt === true && v.dach_gedaemmt === true && verglasung === 'einfach')
    add('energie.gedaemmtEinfachglas', 'verglasung', 'soft', 'Fassade und Dach gedämmt, aber nur Einfachverglasung – ungewöhnlich, meist werden die Fenster mitertüchtigt.');
  if (jungesGebaeude && v.fassade_gedaemmt === false && v.dach_gedaemmt === false && verglasung === 'zweifach')
    add('energie.jungZweifach', 'verglasung', 'soft', `Junges Gebäude (Bauantrag ${bauantragJahr}) mit nur Zweifachverglasung (ohne Wärmeschutz) und ungedämmter Hülle – für den Baustandard untypisch.`);

  // -- Heizungsraum verlegt, aber keine Heizleitungen --
  if (v.heizungsraum_verlegen === true && v.anschluss_vorlauf_vorhanden === false && v.anschluss_ruecklauf_vorhanden === false)
    add('heizungsraum.verlegenOhneHeizleitung', 'anschluss_vorlauf_vorhanden', 'soft', 'Heizungsraum verlegt, aber weder Vorlauf noch Rücklauf vorhanden – die Heizleitungen müssten beim Verlegen mit.');

  // -- Erdung fehlt (für WP-Anschluss i. d. R. nötig) --
  if (v.hat_erdung === false)
    add('erdung.fehlt', 'hat_erdung', 'soft', 'Keine Erdung/Potentialausgleich angegeben – für den Wärmepumpen-Anschluss i. d. R. erforderlich, bitte prüfen.');

  // -- Unbegehbare Räume trotz „alle Räume gescannt" --
  const unbegehbar = num(v.anzahl_unbegehbare_raeume);
  if (unbegehbar != null && unbegehbar > 0 && v.check_raeume_gescannt === true)
    add('unbegehbar.trotzGescannt', 'anzahl_unbegehbare_raeume', 'soft', 'Unbegehbare Räume angegeben, aber „alle Räume gescannt" bestätigt – unbegehbare Räume lassen sich nicht scannen.');

  // -- Techniker bestätigt sein eigenes Aufmaß (Techniker == bestätigender Kunde) --
  const tName = typeof v.techniker_name === 'string' ? v.techniker_name.trim().toLowerCase().replace(/\s+/g, ' ') : '';
  const kVor = typeof v.kunde_bestaetigung_vorname === 'string' ? v.kunde_bestaetigung_vorname.trim().toLowerCase() : '';
  const kNach = typeof v.kunde_bestaetigung_nachname === 'string' ? v.kunde_bestaetigung_nachname.trim().toLowerCase() : '';
  if (tName && kVor && kNach && (tName === `${kVor} ${kNach}` || tName === `${kNach} ${kVor}`))
    add('bestaetigung.selbst', 'techniker_name', 'soft', 'Techniker und bestätigender Kunde sind dieselbe Person – die Kundenbestätigung ist dann keine unabhängige Freigabe.');

  return issues;
}

export const hasBlockingPlausibility = (issues: PlausibilityIssue[]) =>
  issues.some((i) => i.severity === 'block');

/**
 * Befunde nach Feld gruppiert — für Live-Hinweise direkt am Eingabepunkt.
 * Eine Wahrheit (dieselbe Engine wie der Submit-Gate), kein hartkodierter Drift.
 */
export function issuesByField(values: Partial<AufmassDraftData>): Record<string, PlausibilityIssue[]> {
  const out: Record<string, PlausibilityIssue[]> = {};
  for (const issue of checkPlausibility(values)) {
    (out[issue.field] ??= []).push(issue);
  }
  return out;
}
