/**
 * Wasserdicht-Loop T4 — Runde 6: NEUE, bisher nicht abgedeckte gemeine Fälle.
 *
 * Über Seeds + R1 + R2 + R3 hinaus. Schwerpunkte dieser Runde (Lücken, die in
 * keiner Vorrunde getroffen wurden):
 *
 *  - DIFF / Normalisierung von STRING-Enums (bisher nur numerische Strings):
 *    - führende/abschließende Leerzeichen in einem Enum-readback (' gas ') →
 *      muss getrimmt gleich 'gas' sein (kein Fehlalarm).
 *    - Groß-/Kleinschreibung: 'GAS' ≠ 'gas' (normalizeValue lowercased NICHT) →
 *      echte Abweichung (autarc hat den Enum anders gespeichert).
 *  - DIFF Float-Toleranz auf einem DIREKTEN Feld (bisher nur Verbrauch):
 *    beheizte_wohnflaeche_m2 als float gesendet, readback minimal gerundet → ok.
 *  - DIFF: autarc liefert EXTRA-Skalarfelder, die nie gesendet wurden →
 *    müssen ignoriert werden (nur gesendete Felder zählen). Bisher nur Extra-
 *    Heizkreis getestet, nicht ein Extra-Skalar.
 *  - DIFF: heatingCircuits mit DOPPELTEM Index im readback (zwei Einträge index 0,
 *    der zweite falsch) → byIndex last-wins → muss als Abweichung erkannt werden.
 *  - MATCH: savedProjectId mit umgebenden Leerzeichen, das nach Trim GÜLTIG ist
 *    (' p-1 ' → 'p-1' → matched). Bisher nur whitespace-only → kein_projekt.
 *  - MATCH-Priorität: savedProjectId UND customerName gesetzt → saved gewinnt,
 *    der customers-Endpunkt wird NIE aufgerufen (selbst wenn er 500 läge).
 *  - PANNEN an noch ungetesteten Endpunkt+Mechanismus-Kombinationen:
 *    - networkError auf PATCH (bisher nur 401/500 als HTTP dort).
 *    - networkError auf searchCustomers (Fallback-Auflösung bricht netzseitig ab).
 *    - networkError auf listProjects (Projekt-Liste bricht netzseitig ab).
 *  - STATUS: buildingHeatLoadKw === -0 (negatives Null, > 0 ist false) →
 *    eingereicht, NIE freigegeben.
 *  - DIFF positiver Pfad für abgeleitete Warmwasser-Art (Zirkulation=false →
 *    withoutCirculation, autarc spiegelt) → freigegeben (Gegenstück zu r3-Mismatch).
 *
 * Format identisch zu `aufmass-watertight-t4-cases.ts` (T4Case). Wird im Harness
 * an T4_CASES angehängt.
 */

import type { T4Case, AutarcProjectMock, AutarcRoomMock } from './aufmass-watertight-t4-cases';
import type { AufmassDraftData } from './aufmass-schema';

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

export const T4_CASES_R6: T4Case[] = [
  // === DIFF: String-Enum-Normalisierung ====================================
  {
    id: 't4.r6.diff.enumWhitespaceEqual',
    flaeche: 'diff',
    label: "readback ' gas ' (mit Leerzeichen) vs gesendet 'gas' — getrimmt gleich",
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { currentHeatingSystemType: ' gas ' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'String-Enums werden getrimmt verglichen — umgebende Leerzeichen aus autarc dürfen KEIN Fehlalarm sein',
  },
  {
    id: 't4.r6.diff.enumCaseMismatch',
    flaeche: 'diff',
    label: "readback 'GAS' (Großschreibung) vs gesendet 'gas' — echte Abweichung",
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { currentHeatingSystemType: 'GAS' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'currentHeatingSystemType' },
    why: 'normalizeValue lowercased Enums NICHT — eine andere Schreibweise zeigt, dass autarc den Enum nicht 1:1 übernommen hat → Abweichung (Spec §7: Enums exakt)',
  },

  // === DIFF: Float-Toleranz auf direktem Feld (Wohnfläche) ===================
  {
    id: 't4.r6.diff.areaFloatWithinTolerance',
    flaeche: 'diff',
    label: 'Wohnfläche 140.004 gesendet, readback 140 — innerhalb Float-Toleranz',
    // beheizte_wohnflaeche_m2 ist im Schema number → minimaler Nachkommawert
    formValues: { beheizte_wohnflaeche_m2: 140.004 } as Partial<AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ heatedLivingAreaM2: 140 }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'auch auf direkten Zahlenfeldern gilt die Float-Toleranz — eine Rundung von 140.004 auf 140 ist KEIN echter Unterschied',
  },

  // === DIFF: autarc liefert EXTRA-Skalarfeld (nicht gesendet) → ignorieren ===
  {
    id: 't4.r6.diff.extraScalarFieldIgnored',
    flaeche: 'diff',
    label: 'autarc gibt ein zusätzliches, nie gesendetes Skalarfeld zurück → ignoriert',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      // Feld, das nie im payload steht (autarc-eigenes Extra) → darf keine Differenz sein.
      readbackOverride: { someAutarcOnlyField: 'irgendwas', anotherExtra: 12345 },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'der Diff iteriert NUR die gesendeten Felder — zusätzliche autarc-Felder im readback sind kein Signal und dürfen nicht blocken',
  },

  // === DIFF: heatingCircuits mit doppeltem Index (last-wins) =================
  {
    id: 't4.r6.diff.circuitDuplicateIndexLastWrong',
    flaeche: 'diff',
    label: 'readback hat zwei Kreise mit index 1; der zweite (gültige) ist falsch → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [
          { name: 'A', flowTemperature: 55, returnTemperature: 45, index: 1 }, // korrekt
          { name: 'B', flowTemperature: 99, returnTemperature: 45, index: 1 }, // falsch, gewinnt (last)
        ],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits[1].flowTemperature' },
    why: 'bei doppeltem Index zählt der zuletzt gelieferte Eintrag — ist der falsch, muss der Vorlauf-Mismatch geblockt werden (autarc hat den Kreis widersprüchlich gespeichert)',
  },

  // === MATCH: savedProjectId mit trim-baren Leerzeichen, gültig nach Trim ====
  {
    id: 't4.r6.match.savedIdTrimmedValid',
    flaeche: 'match',
    label: "savedProjectId ' p-1 ' (Leerzeichen) → nach Trim gültig → matched",
    formValues: {},
    matchInput: { savedProjectId: ' p-1 ' },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'eine ID mit umgebenden Leerzeichen ist nach Trim eine echte ID — sie muss als matched gelten und sauber bis freigegeben durchlaufen (kein false kein_projekt)',
  },

  // === MATCH-Priorität: saved gewinnt, customers wird NIE aufgerufen =========
  {
    id: 't4.r6.match.savedWinsCustomersNeverCalled',
    flaeche: 'match',
    label: 'savedProjectId + customerName gesetzt; customers läge 500 — wird aber nie aufgerufen',
    formValues: {},
    matchInput: { savedProjectId: 'p-1', customerName: 'Mustermann' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      // Wenn der Fallback fälschlich liefe, würde dieser 500 zu „fehler" führen.
      httpStatus: { searchCustomers: 500, listProjects: 500 },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'die gespeicherte ID hat Vorrang vor der Fallback-Suche — der customers-Endpunkt darf gar nicht erst angefasst werden, sonst würde ein irrelevanter 500 den Erfolg killen',
  },

  // === PANNEN: networkError an neuen Endpunkten ==============================
  {
    id: 't4.r6.panne.patchNetworkError',
    flaeche: 'panne',
    label: 'PATCH bricht netzseitig ab (fetch wirft)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, networkError: ['patch'] },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'reißt schon das Schreiben (PATCH) netzseitig ab, ist nichts angekommen → fehler, niemals als erledigt markieren',
  },
  {
    id: 't4.r6.panne.searchCustomersNetworkError',
    flaeche: 'panne',
    label: 'Fallback: GET /customers bricht netzseitig ab',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: { networkError: ['searchCustomers'] },
    expect: { status: 'fehler', blockt: true },
    why: 'ein Netzabbruch bei der Kundensuche ist eine technische Panne (kein „kein Kunde gefunden") → fehler, nicht kein_projekt',
  },
  {
    id: 't4.r6.panne.listProjectsNetworkError',
    flaeche: 'panne',
    label: 'Fallback: GET /projects?customerId bricht netzseitig ab',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      networkError: ['listProjects'],
    },
    expect: { status: 'fehler', blockt: true },
    why: 'bricht die Projekt-Liste netzseitig ab, ist die Auflösung technisch gescheitert → fehler (kein stilles kein_projekt)',
  },

  // === STATUS: negatives Null bei der Heizlast ==============================
  {
    id: 't4.r6.status.heatLoadNegativeZero',
    flaeche: 'status',
    label: 'Heizlast = -0 (negatives Null) → nicht > 0',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: -0 }), rooms: oneRoom },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: '-0 ist nicht > 0 — eine „Null"-Heizlast in jeder Form darf nie als berechnete Heizlast freigegeben werden',
  },

  // === DIFF positiver Pfad: abgeleitete Warmwasser-Art stimmt ===============
  {
    id: 't4.r6.diff.drinkingWaterDerivedOk',
    flaeche: 'diff',
    label: 'Zirkulation=false → withoutCirculation, autarc spiegelt → ok',
    formValues: { anschluss_zirkulation_vorhanden: false } as Partial<AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ drinkingWaterHeatingSystemType: 'withoutCirculation' }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Gegenstück zum r3-Mismatch: eine korrekt abgeleitete+zurückgespiegelte Warmwasser-Art darf KEIN Fehlalarm sein',
  },
];
