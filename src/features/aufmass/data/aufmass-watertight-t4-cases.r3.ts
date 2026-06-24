/**
 * Wasserdicht-Loop T4 — Runde 3: NEUE, bisher nicht abgedeckte gemeine Fälle.
 *
 * Über Seeds + R1 + R2 hinaus. Schwerpunkte dieser Runde:
 *  - mapping/diff auf ABGELEITETEN Feldern (bislang nur direkte Felder geprüft):
 *    `buildingAge` (aus bauantrag_datum), `currentHeatingSystemConstructionYear`
 *    (aus heizung_inbetriebnahme_datum), `drinkingWaterHeatingSystemType`
 *    (aus anschluss_zirkulation_vorhanden). Diese landen real im PATCH-payload und
 *    müssen bei Abweichung blocken bzw. bei Übereinstimmung durchlassen.
 *  - diff-Normalisierung in die ANDERE Richtung: numerischer String, der NICHT
 *    gleich ist ("150" ≠ 140) → echte Abweichung (Normalisierung darf reale
 *    Differenzen nicht verschlucken). Boolean exakt: true ≠ 1 (number) → Abweichung.
 *  - heatingCircuits: gesendeter Kreis (index 0), readback hat NUR einen anderen
 *    Index (5) → der gesendete fehlt; absent-key-Branch im Skalar-Diff (Feld als
 *    `undefined` → JSON dropt es → Schlüssel fehlt im readback) → „fehlt".
 *  - panne: HTTP 404 direkt auf dem readback-GET /projects/{id} (bisher nur
 *    network/brokenJson/nullBody/wrongShape dort; expliziter Non-2xx fehlte),
 *    HTTP 500 WÄHREND des Heizlast-Polls (bisher nur brokenJson im Poll).
 *  - status/diff kombiniert: heatingCircuits NICHT gesendet (nur vorlauftemperatur,
 *    kein rücklauf) → readback-Kreise müssen ignoriert werden → freigegeben.
 *
 * Format identisch zu `aufmass-watertight-t4-cases.ts` (T4Case). Wird im Harness
 * an T4_CASES angehängt.
 */

import type { T4Case, AutarcProjectMock, AutarcRoomMock } from './aufmass-watertight-t4-cases';

/** Vollständig korrektes Mock-Projekt (lokale Kopie, identisch zum Seed). */
function fullProject(over?: Partial<AutarcProjectMock>): AutarcProjectMock {
  return {
    id: 'p-1',
    humanId: 'AT-1001',
    buildingType: 'singleOrDoubleFamilyHouse',
    heatedLivingAreaM2: 140,
    numberOfResidents: 3,
    numberOfFloors: 2,
    isMonumentProtected: false,
    averageEnergyConsumptionLast3Years: 18000,
    isFacadeInsulated: true,
    isRoofInsulated: true,
    pipeSystemType: 'twoPipeHeating',
    windowGlazingType: 'doubleWithThermalInsulation',
    hasFireplace: false,
    hasSolarThermalSystem: false,
    currentHeatingSystemType: 'gas',
    roomHeatingType: 'radiator',
    buildingAge: 'from1995To2001',
    currentHeatingSystemConstructionYear: 'after1995',
    drinkingWaterHeatingSystemType: 'withoutCirculation',
    heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 0 }],
    buildingHeatLoadKw: 8.4,
    technicalFeasibilityAssesment: 'whatever',
    ...over,
  };
}

const oneRoom: AutarcRoomMock[] = [{ id: 'r1', name: 'Wohnzimmer', floor: 'ground', temperature: 21 }];

export const T4_CASES_R3: T4Case[] = [
  // === DIFF auf ABGELEITETEN Feldern =======================================
  {
    id: 't4.r3.diff.buildingAgeMismatch',
    flaeche: 'diff',
    label: 'abgeleitete Baualtersklasse weicht ab (Form 2010→from2002, autarc from1995To2001)',
    // bauantrag_datum 2010 → payload.buildingAge === 'from2002'
    formValues: { bauantrag_datum: '2010-01-01' },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'buildingAge' },
    why: 'auch abgeleitete Felder (Baualtersklasse) gehen ins PATCH-payload und müssen bei Abweichung blocken — nicht nur direkte Felder',
  },
  {
    id: 't4.r3.diff.buildingAgeDerivedOk',
    flaeche: 'diff',
    label: 'abgeleitete Baualtersklasse stimmt überein (Form 2010→from2002, autarc spiegelt from2002)',
    formValues: { bauantrag_datum: '2010-01-01' },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingAge: 'from2002' }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'korrekt abgeleiteter+zurückgespiegelter Wert darf KEIN Fehlalarm sein (Ableitung selbst muss konsistent gemappt werden)',
  },
  {
    id: 't4.r3.diff.heatingYearMismatch',
    flaeche: 'diff',
    label: 'abgeleitetes Heizungs-Baujahr weicht ab (Form 1970→before1980, autarc after1995)',
    // heizung_inbetriebnahme_datum 1970 → payload.currentHeatingSystemConstructionYear === 'before1980'
    formValues: { heizung_inbetriebnahme_datum: '1970-06-01' },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'currentHeatingSystemConstructionYear' },
    why: 'das abgeleitete Heizungs-Baujahr muss ebenso geprüft werden — Abweichung blockt mit Feldnamen',
  },
  {
    id: 't4.r3.diff.drinkingWaterDerivedMismatch',
    flaeche: 'diff',
    label: 'abgeleitete Warmwasser-Art weicht ab (Form Zirkulation=true→withCirculation, autarc withoutCirculation)',
    // anschluss_zirkulation_vorhanden=true → payload.drinkingWaterHeatingSystemType === 'withCirculation'
    formValues: { anschluss_zirkulation_vorhanden: true } as Partial<import('./aufmass-schema').AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'drinkingWaterHeatingSystemType' },
    why: 'wird die Zirkulation gesendet, muss autarc denselben Wert zurückgeben — sonst Abweichung (autarc hat es verworfen/anders gespeichert)',
  },

  // === DIFF-Normalisierung in die ANDERE Richtung ==========================
  {
    id: 't4.r3.diff.numericStringNotEqual',
    flaeche: 'diff',
    label: 'readback "150" (String) vs gesendet 140 — echte Abweichung trotz String',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '150' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'die String→Zahl-Normalisierung darf reale Differenzen NICHT verschlucken — "150" ≠ 140 bleibt Abweichung',
  },
  {
    id: 't4.r3.diff.boolVsNumberOneMismatch',
    flaeche: 'diff',
    label: 'gesendet true (Boolean) vs readback 1 (Zahl) — exakter Bool-Vergleich → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { isFacadeInsulated: 1 } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'isFacadeInsulated' },
    why: 'Booleans werden exakt verglichen (Spec §7) — eine Zahl 1 statt true zeigt, dass autarc den Wert NICHT als Boolean übernommen hat → Abweichung',
  },

  // === heatingCircuits: vorhanden, aber falscher Index / absent-key =========
  {
    id: 't4.r3.diff.circuitOnlyWrongIndex',
    flaeche: 'diff',
    label: 'readback hat NUR einen Kreis mit Index 5, aber gleiche Temps — autarc-Renummerierung, ok',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Fremd', flowTemperature: 55, returnTemperature: 45, index: 5 }],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Einzelkreis-Positions-Fallback: autarc darf den ersten Kreis frei nummerieren (real index 1, hier 5); bei genau EINEM Kreis je Seite zählen die Temperaturen, nicht der Index — gleiche VL/RL = derselbe Kreis → kein Phantom-„fehlt". (Datenfehler bei Einzelkreisen fängt circuitReturnJustOverTolerance.)',
  },
  {
    id: 't4.r3.diff.fieldKeyAbsentInReadback',
    flaeche: 'diff',
    label: 'gesendetes Feld fehlt als SCHLÜSSEL im readback (key komplett weg, nicht null)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    // undefined → JSON.stringify lässt den Schlüssel ganz weg → readback hat numberOfFloors NICHT.
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { numberOfFloors: undefined } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfFloors' },
    why: 'auch ein komplett fehlender Schlüssel (nicht nur null) muss als „fehlt"-Abweichung erkannt werden — nicht stillschweigend übersprungen',
  },

  // === heatingCircuits NICHT gesendet → readback-Kreise ignorieren ==========
  {
    id: 't4.r3.diff.noCircuitSentReadbackIgnored',
    flaeche: 'diff',
    label: 'nur Vorlauf gesetzt, kein Rücklauf → kein heatingCircuits im payload → readback-Kreise egal',
    // ruecklauftemperatur=null → mapping erzeugt KEIN heatingCircuits → wird nicht verglichen.
    formValues: { ruecklauftemperatur: null } as Partial<import('./aufmass-schema').AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      // readback hat einen völlig anderen Kreis — muss ignoriert werden, da nichts gesendet wurde.
      readbackOverride: {
        heatingCircuits: [{ name: 'Egal', flowTemperature: 99, returnTemperature: 11, index: 0 }],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'wird kein Heizkreis gesendet (Rücklauf fehlt), darf ein abweichender autarc-Kreis NICHT als Differenz schlagen — nur gesendete Felder zählen',
  },

  // === PANNE: expliziter Non-2xx / 500 an noch ungetesteter Stelle ==========
  {
    id: 't4.r3.panne.getProject404',
    flaeche: 'panne',
    label: 'readback GET /projects/{id} liefert HTTP 404',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 404 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'expliziter Non-2xx beim readback (404) darf nicht als Erfolg/Abweichung getarnt werden → fehler (Round-Trip nicht verifizierbar)',
  },
  {
    id: 't4.r3.panne.pollHttp500',
    flaeche: 'panne',
    label: 'Heizlast 0 → Poll-Re-read liefert HTTP 500',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject({ buildingHeatLoadKw: 0 }),
      rooms: oneRoom,
      httpStatus: { getProject: 500 },
      heatLoadAppearsAfterReads: 5,
    },
    expect: { status: 'fehler', blockt: true },
    why: 'ein HTTP-Fehler während des Heizlast-Polls darf nicht verschluckt werden → fehler (nicht „eingereicht" vortäuschen)',
  },

  // === STATUS: Heizlast als Boolean true (truthy, aber kein number) =========
  {
    id: 't4.r3.status.heatLoadBooleanTrue',
    flaeche: 'status',
    label: 'Heizlast = true (Boolean, truthy, aber kein number)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { buildingHeatLoadKw: true as unknown as number },
    },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'ein truthy-Nicht-Zahlen-Wert ist keine berechnete Heizlast>0 → darf nie als freigegeben durchgehen',
  },

  // === DIFF: mehrere ABGELEITETE + direkte Abweichungen, Meldung bleibt konkret
  {
    id: 't4.r3.meldung.derivedAndDirectMix',
    flaeche: 'meldung',
    label: 'gemischte Abweichung (abgeleitet buildingAge + direkt numberOfResidents) — beide benannt',
    formValues: { bauantrag_datum: '2010-01-01' }, // → buildingAge from2002
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { numberOfResidents: 7 } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfResidents' },
    why: 'Meldung muss auch bei gemischten (abgeleitet+direkt) Abweichungen das konkrete direkte Feld benennen, nicht generisch bleiben',
  },
];
