import { describe, it, expect } from 'vitest';
import {
  reconcileAufmassGegenAutarc,
  formatReconcileReport,
  RECONCILE_EPSILON,
  type ReconcileResult,
} from './autarc-reconcile';
import type { AufmassDraftData } from './aufmass-schema';

/**
 * Tests für den Feld-für-Feld-Abgleich Formular ↔ autarc-Projekt.
 * Geprüft: vier Zustände (match/abweichung/fehlt_in_autarc/fehlt_in_form),
 * Enum-Mapping (gebaeudetyp→buildingType), abgeleitete Felder (Baualtersklasse),
 * Float-Toleranz, heatingCircuits als Präsenz-Vergleich, computed-Felder ignoriert,
 * lesbarer Report.
 */

/** Vollständig befülltes Formular (Werte korrespondieren mit dem Mapping). */
function vollesFormular(): Partial<AufmassDraftData> {
  return {
    gebaeudetyp: 'einfamilienhaus',
    beheizte_wohnflaeche_m2: 140,
    anzahl_bewohner: 4,
    anzahl_etagen: 2,
    hat_denkmalschutz: false,
    durchschnittsverbrauch_3_jahre: 18000,
    fassade_gedaemmt: true,
    dach_gedaemmt: true,
    rohrsystem: 'zweirohr',
    verglasung: 'zweifach',
    hat_kamin: false,
    hat_solarthermie: false,
    heizungsart: 'gas',
    heizkoerper_typ: 'heizkoerper',
    bauantrag_datum: '1990-05-01',
    heizung_inbetriebnahme_datum: '2010-03-01',
    anschluss_zirkulation_vorhanden: true,
    vorlauftemperatur: 55,
    ruecklauftemperatur: 45,
  } as Partial<AufmassDraftData>;
}

/** autarc-Projektobjekt, das EXAKT zum vollen Formular passt. */
function passendesProjekt(): Record<string, unknown> {
  return {
    buildingType: 'singleOrDoubleFamilyHouse',
    heatedLivingAreaM2: 140,
    numberOfResidents: 4,
    numberOfFloors: 2,
    isMonumentProtected: false,
    averageEnergyConsumptionLast3Years: 18000,
    isFacadeInsulated: true,
    isRoofInsulated: true,
    pipeSystemType: 'twoPipeHeating',
    windowGlazingType: 'double',
    hasFireplace: false,
    hasSolarThermalSystem: false,
    currentHeatingSystemType: 'gas',
    roomHeatingType: 'radiator',
    buildingAge: 'from1984To1994', // 1990 → diese Klasse
    currentHeatingSystemConstructionYear: 'after1995', // 2010 → after1995
    drinkingWaterHeatingSystemType: 'withCirculation',
    heatingCircuits: [
      { name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 1 },
    ],
    // computed/technische Felder, die NIE verglichen werden dürfen:
    buildingHeatLoadKw: 8.4,
    id: 'p-123',
    humanId: 'AB-42',
    technicalFeasibilityAssesment: 'feasible',
  };
}

describe('reconcileAufmassGegenAutarc — match', () => {
  it('alle gemappten Felder stimmen überein → ok=true, nur match', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    expect(r.ok).toBe(true);
    expect(r.counts.abweichung).toBe(0);
    expect(r.counts.fehlt_in_autarc).toBe(0);
    expect(r.counts.fehlt_in_form).toBe(0);
    expect(r.counts.match).toBeGreaterThan(0);
  });

  it('vergleicht NIE computed-Felder (buildingHeatLoadKw, id, humanId, technicalFeasibilityAssesment)', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    const felder = r.entries.map((e) => e.autarcField);
    expect(felder).not.toContain('buildingHeatLoadKw');
    expect(felder).not.toContain('id');
    expect(felder).not.toContain('humanId');
    expect(felder).not.toContain('technicalFeasibilityAssesment');
  });

  it('mappt das Enum korrekt (gebaeudetyp=einfamilienhaus ↔ singleOrDoubleFamilyHouse)', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    const e = r.entries.find((x) => x.autarcField === 'buildingType');
    expect(e?.state).toBe('match');
    expect(e?.form).toBe('singleOrDoubleFamilyHouse');
  });

  it('gleicht abgeleitete Baualtersklasse ab (1990 → from1984To1994)', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    const e = r.entries.find((x) => x.autarcField === 'buildingAge');
    expect(e?.state).toBe('match');
  });
});

describe('reconcileAufmassGegenAutarc — abweichung', () => {
  it('erkennt unterschiedliche Enum-Werte als abweichung', () => {
    const projekt = passendesProjekt();
    projekt.pipeSystemType = 'singlePipeHeating'; // Form: twoPipeHeating
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'pipeSystemType');
    expect(e?.state).toBe('abweichung');
    expect(e?.form).toBe('twoPipeHeating');
    expect(e?.autarc).toBe('singlePipeHeating');
    expect(r.ok).toBe(false);
  });

  it('erkennt abweichende Zahl außerhalb der Toleranz', () => {
    const projekt = passendesProjekt();
    projekt.heatedLivingAreaM2 = 150; // Form: 140
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'heatedLivingAreaM2');
    expect(e?.state).toBe('abweichung');
  });

  it('erkennt abweichenden Boolean (true ↔ false)', () => {
    const projekt = passendesProjekt();
    projekt.isFacadeInsulated = false; // Form: true
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'isFacadeInsulated');
    expect(e?.state).toBe('abweichung');
  });
});

describe('reconcileAufmassGegenAutarc — Float-Toleranz', () => {
  it('Differenz innerhalb EPSILON gilt als match', () => {
    const projekt = passendesProjekt();
    projekt.beheizte_wohnflaeche_m2; // no-op
    projekt.heatedLivingAreaM2 = 140 + RECONCILE_EPSILON / 2;
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'heatedLivingAreaM2');
    expect(e?.state).toBe('match');
  });

  it('egalisiert numerischen String gegen Zahl ("140" ↔ 140)', () => {
    const projekt = passendesProjekt();
    projekt.heatedLivingAreaM2 = '140';
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'heatedLivingAreaM2');
    expect(e?.state).toBe('match');
  });
});

describe('reconcileAufmassGegenAutarc — fehlt_in_autarc', () => {
  it('Form hat Wert, autarc-Feld fehlt → fehlt_in_autarc', () => {
    const projekt = passendesProjekt();
    delete projekt.numberOfResidents;
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'numberOfResidents');
    expect(e?.state).toBe('fehlt_in_autarc');
    expect(r.ok).toBe(false);
  });

  it('Form hat Wert, autarc-Feld ist null → fehlt_in_autarc', () => {
    const projekt = passendesProjekt();
    projekt.windowGlazingType = null;
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'windowGlazingType');
    expect(e?.state).toBe('fehlt_in_autarc');
  });
});

describe('reconcileAufmassGegenAutarc — fehlt_in_form', () => {
  it('autarc hat Wert, Formularfeld leer → fehlt_in_form', () => {
    const form = vollesFormular();
    delete (form as Record<string, unknown>).gebaeudetyp; // → mapBuildingType null
    const r = reconcileAufmassGegenAutarc(form, passendesProjekt());
    const e = r.entries.find((x) => x.autarcField === 'buildingType');
    expect(e?.state).toBe('fehlt_in_form');
    expect(r.ok).toBe(false);
  });

  it('beide Seiten leer → match (kein Konflikt)', () => {
    const form = vollesFormular();
    delete (form as Record<string, unknown>).hat_kamin;
    const projekt = passendesProjekt();
    delete projekt.hasFireplace;
    const r = reconcileAufmassGegenAutarc(form, projekt);
    const e = r.entries.find((x) => x.autarcField === 'hasFireplace');
    expect(e?.state).toBe('match');
  });
});

describe('reconcileAufmassGegenAutarc — heatingCircuits (Präsenz)', () => {
  it('beide haben Heizkreis → match', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    const e = r.entries.find((x) => x.autarcField === 'heatingCircuits');
    expect(e?.state).toBe('match');
  });

  it('Form hat VL/RL, autarc ohne Kreise → fehlt_in_autarc', () => {
    const projekt = passendesProjekt();
    projekt.heatingCircuits = [];
    const r = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const e = r.entries.find((x) => x.autarcField === 'heatingCircuits');
    expect(e?.state).toBe('fehlt_in_autarc');
  });

  it('autarc hat Kreis, Form ohne VL/RL → fehlt_in_form', () => {
    const form = vollesFormular();
    delete (form as Record<string, unknown>).vorlauftemperatur;
    delete (form as Record<string, unknown>).ruecklauftemperatur;
    const r = reconcileAufmassGegenAutarc(form, passendesProjekt());
    const e = r.entries.find((x) => x.autarcField === 'heatingCircuits');
    expect(e?.state).toBe('fehlt_in_form');
  });
});

describe('reconcileAufmassGegenAutarc — Robustheit', () => {
  it('null-Projekt: alle befüllten Form-Felder sind fehlt_in_autarc', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), null);
    expect(r.counts.fehlt_in_autarc).toBeGreaterThan(0);
    expect(r.counts.fehlt_in_form).toBe(0);
    expect(r.ok).toBe(false);
  });

  it('leeres Formular + leeres Projekt → ok=true (nichts zu vergleichen außer Leer-Matches)', () => {
    const r = reconcileAufmassGegenAutarc({}, {});
    expect(r.counts.abweichung).toBe(0);
    expect(r.counts.fehlt_in_autarc).toBe(0);
    expect(r.counts.fehlt_in_form).toBe(0);
    expect(r.ok).toBe(true);
  });

  it('counts summieren sich auf entries.length', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    const summe =
      r.counts.match + r.counts.abweichung + r.counts.fehlt_in_autarc + r.counts.fehlt_in_form;
    expect(summe).toBe(r.entries.length);
  });
});

describe('formatReconcileReport', () => {
  it('meldet bei vollständigem match „alles stimmt überein"', () => {
    const r = reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt());
    const report = formatReconcileReport(r);
    expect(report).toContain('alles stimmt überein');
    expect(report).toContain('match=');
  });

  it('listet Abweichungen mit Formular- und autarc-Wert auf', () => {
    const projekt = passendesProjekt();
    projekt.pipeSystemType = 'singlePipeHeating';
    const r: ReconcileResult = reconcileAufmassGegenAutarc(vollesFormular(), projekt);
    const report = formatReconcileReport(r);
    expect(report).toContain('Abweichungen gefunden');
    expect(report).toContain('pipeSystemType');
    expect(report).toContain('Formular=twoPipeHeating');
    expect(report).toContain('autarc=singlePipeHeating');
  });

  it('ist deterministisch (gleiche Eingabe → gleicher Report)', () => {
    const a = formatReconcileReport(reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt()));
    const b = formatReconcileReport(reconcileAufmassGegenAutarc(vollesFormular(), passendesProjekt()));
    expect(a).toBe(b);
  });
});
