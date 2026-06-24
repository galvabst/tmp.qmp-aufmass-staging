import { describe, it, expect } from 'vitest';
import { checkPlausibility, PlausibilityIssue } from './aufmass-plausibility';

type V = Parameters<typeof checkPlausibility>[0];

const sev = (issues: PlausibilityIssue[], ruleId: string) => issues.find((i) => i.ruleId === ruleId)?.severity;
const has = (issues: PlausibilityIssue[], ruleId: string) => issues.some((i) => i.ruleId === ruleId);
const check = (v: V) => checkPlausibility(v);

function vorMonaten(monate: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monate);
  return d.toISOString().slice(0, 10);
}
function inMonaten(monate: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monate);
  return d.toISOString().slice(0, 10);
}

describe('checkPlausibility – Hard-Blocks (unmöglich)', () => {
  it('Wohnfläche außerhalb physikalischer Grenzen', () => {
    expect(sev(check({ beheizte_wohnflaeche_m2: 5 }), 'wohnflaeche.hard')).toBe('block');
    expect(sev(check({ beheizte_wohnflaeche_m2: 4000 }), 'wohnflaeche.hard')).toBe('block');
  });
  it('Rücklauf ≥ Vorlauf', () => {
    expect(sev(check({ vorlauftemperatur: 50, ruecklauftemperatur: 55 }), 'ruecklauf.ueberVorlauf')).toBe('block');
  });
  it('Vorlauf physikalisch unmöglich', () => {
    expect(sev(check({ vorlauftemperatur: 110 }), 'vorlauf.hard')).toBe('block');
  });
  it('Öl aktuell > Tankvolumen', () => {
    expect(sev(check({ heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_liter_aktuell: 4000 }), 'oeltank.aktuellUeberGesamt')).toBe('block');
  });
  it('Kältemittel-Leitung über Maximum', () => {
    expect(sev(check({ distanz_ausseneinheit_kernloch: 60 }), 'distAussen.hard')).toBe('block');
  });
  it('spezifischer Verbrauch physikalisch unmöglich', () => {
    expect(sev(check({ heizungsart: 'gas', beheizte_wohnflaeche_m2: 100, durchschnittsverbrauch_3_jahre: 60000 }), 'verbrauchProM2.hard')).toBe('block');
  });
  it('Datum in der Zukunft', () => {
    expect(sev(check({ thermocheck_datum: inMonaten(2) }), 'tc.zukunft')).toBe('block');
    expect(sev(check({ heizung_inbetriebnahme_datum: inMonaten(2) }), 'ib.zukunft')).toBe('block');
  });
  it('Heizung vor Bauantrag in Betrieb', () => {
    expect(sev(check({ heizung_inbetriebnahme_datum: '2010-01-01', bauantrag_datum: '2015-01-01' }), 'ib.vorBa')).toBe('block');
  });
});

describe('checkPlausibility – Soft (unplausibel)', () => {
  it('Vorlauf > 55 °C → WP-Signal', () => {
    expect(sev(check({ vorlauftemperatur: 65, ruecklauftemperatur: 55 }), 'vorlauf.wp')).toBe('soft');
  });
  it('heizkoerper_typ "beides" greift FBH- UND Heizkörper-Regel (Codex-Fix)', () => {
    expect(has(check({ heizkoerper_typ: 'beides', vorlauftemperatur: 60, ruecklauftemperatur: 50 }), 'vorlauf.fbh')).toBe(true);
    expect(has(check({ heizkoerper_typ: 'beides', vorlauftemperatur: 35, ruecklauftemperatur: 30 }), 'vorlauf.hk')).toBe(true);
  });
  it('m²/Person zu eng', () => {
    expect(sev(check({ beheizte_wohnflaeche_m2: 40, anzahl_bewohner: 4 }), 'flaecheProPerson.eng')).toBe('soft');
  });
  it('MFH mit nur 1 Etage / zu klein', () => {
    expect(has(check({ gebaeudetyp: 'mehrfamilienhaus', anzahl_etagen: 1 }), 'etagen.mfh1')).toBe(true);
    expect(has(check({ gebaeudetyp: 'mehrfamilienhaus', beheizte_wohnflaeche_m2: 90 }), 'mfh.klein')).toBe(true);
  });
  it('Regendusche ohne Dusche / keine Sanitäreinrichtung', () => {
    expect(sev(check({ hat_regendusche: true, anzahl_duschen: 0 }), 'regendusche.ohneDusche')).toBe('soft');
    expect(sev(check({ anzahl_duschen: 0, anzahl_badewannen: 0 }), 'sanitaer.keine')).toBe('soft');
  });
  it('0 Durchbrüche trotz Leitungsweg', () => {
    expect(sev(check({ anzahl_durchbrueche_kernloch: 0, distanz_ausseneinheit_kernloch: 5 }), 'durchbrueche.nullTrotzLeitung')).toBe('soft');
  });
  it('Bestandsheizung zu neu – aber unterdrückt, wenn defekt', () => {
    expect(sev(check({ heizung_inbetriebnahme_datum: vorMonaten(12) }), 'ib.zuNeu')).toBe('soft');
    expect(has(check({ heizung_inbetriebnahme_datum: vorMonaten(12), heizung_funktionstuechtig: false }), 'ib.zuNeu')).toBe(false);
  });
  it('3-Jahres-Verbrauch, aber Heizung jünger als 3 Jahre', () => {
    expect(sev(check({ durchschnittsverbrauch_3_jahre: 20000, heizung_inbetriebnahme_datum: vorMonaten(12) }), 'verbrauch.kein3Jahre')).toBe('soft');
  });
  it('Denkmalschutz + gedämmte Fassade', () => {
    expect(sev(check({ hat_denkmalschutz: true, fassade_gedaemmt: true }), 'denkmal.fassade')).toBe('soft');
  });
});

describe('checkPlausibility – Energie-Band (Codex-Fix: Klasse + jung)', () => {
  const flaeche = 100;
  it('unsaniert + einfachverglast: sehr niedriger Verbrauch unplausibel', () => {
    const v: V = { heizungsart: 'gas', beheizte_wohnflaeche_m2: flaeche, durchschnittsverbrauch_3_jahre: 5000, fassade_gedaemmt: false, dach_gedaemmt: false, verglasung: 'einfach' };
    expect(sev(check(v), 'verbrauch.klasseNiedrig')).toBe('soft'); // 50 < 90
  });
  it('voll gedämmt NUR mit 3-fach + jung; sonst teilsaniert (nicht zu streng)', () => {
    const base = { heizungsart: 'gas' as const, beheizte_wohnflaeche_m2: flaeche, durchschnittsverbrauch_3_jahre: 20000, fassade_gedaemmt: true, dach_gedaemmt: true, verglasung: 'dreifach' as const };
    // jung → voll_gedaemmt, 200 kWh/m² > 130 → soft
    expect(sev(check({ ...base, bauantrag_datum: vorMonaten(12) }), 'verbrauch.klasseHoch')).toBe('soft');
    // ohne Baualter → teilsaniert (Band bis 200) → KEIN klasseHoch bei genau 200
    expect(has(check(base), 'verbrauch.klasseHoch')).toBe(false);
  });
  it('junges Gebäude einfachverglast + ungedämmt → GEG-Widerspruch', () => {
    expect(sev(check({ bauantrag_datum: vorMonaten(12), fassade_gedaemmt: false, dach_gedaemmt: false, verglasung: 'einfach' }), 'energie.jungUnsaniert')).toBe('soft');
  });
});

describe('checkPlausibility – plausibel → keine Befunde', () => {
  it('typisches saniertes EFH', () => {
    const v: V = {
      gebaeudetyp: 'einfamilienhaus', beheizte_wohnflaeche_m2: 140, anzahl_bewohner: 3, anzahl_etagen: 2,
      heizungsart: 'gas', durchschnittsverbrauch_3_jahre: 16000, fassade_gedaemmt: true, dach_gedaemmt: true,
      verglasung: 'zweifach_waermeschutz', heizkoerper_typ: 'heizkoerper', vorlauftemperatur: 55, ruecklauftemperatur: 45,
      anzahl_duschen: 2, anzahl_badewannen: 1, heizung_inbetriebnahme_datum: '2005-06-01', bauantrag_datum: '1995-03-01',
    };
    expect(check(v)).toEqual([]);
  });
});
