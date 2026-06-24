/**
 * Wasserdicht-Loop T4 — Runde 1: NEUE, bisher nicht abgedeckte gemeine Fälle.
 *
 * Angriffsflächen dieser Runde (über die Pflicht-Seeds hinaus):
 *  - panne (verkleidet): autarc liefert 200, aber falsche Form (Objekt statt Array)
 *    bei rooms/customers/listProjects → DARF NICHT als „unvollständig"/„kein_projekt"
 *    durchgehen, das wäre eine Panne als (Pseudo-)Erfolg/Fehlurteil. → muss `fehler`.
 *  - diff: Teil-fehlt (manche Felder fehlen, nicht alle), Whitespace-Zahlstring,
 *    Float exakt an der Toleranzgrenze, Heizkreis fehlt komplett, returnTemp-Abweichung,
 *    null↔Wert, Extra-Heizkreis im readback (egal), 0 vs false (kein Typencrash).
 *  - status: negative Heizlast, Heizlast als String, Heizlast erscheint erst spät
 *    (außerhalb des Poll-Fensters → bleibt eingereicht), rooms genau 1.
 *  - match: leerer/whitespace-Kundenname, mehrere Kunden (erster gewinnt),
 *    savedProjectId vorhanden aber Projekt faktisch leer (→ kein_projekt).
 *  - meldung: jede Nicht-Erfolg-Meldung nennt Feld/Ort konkret.
 *
 * Format identisch zu `aufmass-watertight-t4-cases.ts` (T4Case). Wird im Harness
 * an T4_CASES angehängt.
 */

import type { T4Case, AutarcProjectMock, AutarcRoomMock } from './aufmass-watertight-t4-cases';

/** Vollständig korrektes Mock-Projekt (Kopie des Seed-`fullProject`, lokal). */
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

export const T4_CASES_R1: T4Case[] = [
  // === PANNE (verkleidet als 200 mit falscher Form) =========================
  {
    id: 't4.r1.panne.roomsWrongShape',
    flaeche: 'panne',
    label: 'GET /rooms liefert 200 mit Objekt statt Array',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), wrongShape: ['getRooms'] },
    expect: { status: 'fehler', blockt: true },
    why: 'falsch geformte 200-Antwort ist eine Panne — darf NICHT als „unvollständig/keine Räume" fehlinterpretiert werden',
  },
  {
    id: 't4.r1.panne.customersWrongShape',
    flaeche: 'panne',
    label: 'Fallback: GET /customers liefert 200 mit Objekt statt Array',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: { wrongShape: ['searchCustomers'] },
    expect: { status: 'fehler', blockt: true },
    why: 'malformte Kundensuche ist technisch kaputt → fehler, NICHT „kein Kunde gefunden"',
  },
  {
    id: 't4.r1.panne.listProjectsWrongShape',
    flaeche: 'panne',
    label: 'Fallback: GET /projects?customerId liefert 200 mit Objekt statt Array',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      wrongShape: ['listProjects'],
    },
    expect: { status: 'fehler', blockt: true },
    why: 'malformte Projektliste ist technisch kaputt → fehler, NICHT „Kunde hat kein Projekt"',
  },
  {
    id: 't4.r1.panne.patch401',
    flaeche: 'panne',
    label: 'PATCH liefert 401 (Auth) ',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { patch: 401 } },
    expect: { status: 'fehler', blockt: true },
    why: 'Auth-Fehler beim Schreiben darf nie als Erfolg gelten',
  },
  {
    id: 't4.r1.panne.getProjectNullBody',
    flaeche: 'panne',
    label: 'GET /projects liefert 200 mit body=null',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, nullBody: ['getProject'] },
    expect: { status: 'fehler', blockt: true },
    why: 'null-Projekt ist kein verwertbares readback → fehler, kein Crash, keine Falsch-Abweichung',
  },
  {
    id: 't4.r1.panne.roomsNetworkError',
    flaeche: 'panne',
    label: 'GET /rooms Netzwerk-Abbruch',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), networkError: ['getRooms'] },
    expect: { status: 'fehler', blockt: true },
    why: 'Räume nicht abrufbar → Vollständigkeit unprüfbar → fehler (nicht „keine Räume")',
  },

  // === DIFF ================================================================
  {
    id: 't4.r1.diff.returnTempMismatch',
    flaeche: 'diff',
    label: 'heatingCircuits returnTemperature abweichend (45 → 30)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 30, index: 0 }],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'returnTemperature' },
    why: 'Rücklauftemperatur muss ebenso strukturell pro Index geprüft werden',
  },
  {
    id: 't4.r1.diff.circuitMissingEntirely',
    flaeche: 'diff',
    label: 'heatingCircuits fehlt komplett im readback',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { heatingCircuits: null },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits' },
    why: 'gesendeter Heizkreis, aber autarc hat keinen → fehlt-Abweichung, blockt',
  },
  {
    id: 't4.r1.diff.whitespaceNumberEqual',
    flaeche: 'diff',
    label: 'readback " 140 " (Zahl mit Whitespace) vs gesendet 140',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: ' 140 ' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'getrimmter numerischer String darf KEIN Fehlalarm sein',
  },
  {
    id: 't4.r1.diff.floatAtToleranceEdge',
    flaeche: 'diff',
    label: 'Verbrauch genau an der Toleranzgrenze (18000 → 18000.01)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: 18000.01 },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Differenz == epsilon ist noch innerhalb der Toleranz (<=) → kein Fehlalarm',
  },
  {
    id: 't4.r1.diff.floatJustOverTolerance',
    flaeche: 'diff',
    label: 'Verbrauch knapp über Toleranz (18000 → 18000.02)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: 18000.02 },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'averageEnergyConsumptionLast3Years' },
    why: 'Differenz > epsilon → echte Abweichung, muss blocken',
  },
  {
    id: 't4.r1.diff.partialFieldMissing',
    flaeche: 'diff',
    label: 'nur EIN gesendetes Feld fehlt im readback (Rest da)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { numberOfFloors: null },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfFloors' },
    why: 'ein einzelnes fehlendes Feld ist KEIN leeres Projekt (kein kein_projekt) sondern eine Feld-Abweichung',
  },
  {
    id: 't4.r1.diff.extraCircuitInReadbackOk',
    flaeche: 'diff',
    label: 'readback hat den gesendeten Kreis (index 1) + einen ZUSÄTZLICHEN (index 2) — egal',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [
          { name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 1 },
          { name: 'Extra', flowTemperature: 35, returnTemperature: 28, index: 2 },
        ],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'nur der gesendete Kreis (index 1, autarc-Konvention) wird geprüft — ein zusätzlicher autarc-Heizkreis ist kein Fehler',
  },
  {
    id: 't4.r1.diff.boolFalseMatches',
    flaeche: 'diff',
    label: 'gesendet false == readback false (kein 0/false-Crash)',
    formValues: { hat_kamin: false },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ hasFireplace: false }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'false darf nicht als „fehlend" missgewertet werden (== null wäre der Fehler)',
  },
  {
    id: 't4.r1.diff.numberZeroNotMissing',
    flaeche: 'diff',
    label: 'gesendet 0 (Verbrauch) == readback 0 — 0 ist kein „fehlt"',
    formValues: { durchschnittsverbrauch_3_jahre: 0 },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ averageEnergyConsumptionLast3Years: 0 }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: '0 ist ein gültiger gesendeter Wert; 0==0 darf nicht als Abweichung/fehlt durchschlagen',
  },

  // === STATUS ==============================================================
  {
    id: 't4.r1.status.negativeHeatLoad',
    flaeche: 'status',
    label: 'Heizlast negativ (-3 kW)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: -3 }), rooms: oneRoom },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'negative Heizlast ist nicht „berechnet>0" → eingereicht, nie freigegeben',
  },
  {
    id: 't4.r1.status.heatLoadNeverWithinPoll',
    flaeche: 'status',
    label: 'Heizlast erscheint erst NACH dem Poll-Fenster (nach 9 reads)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, heatLoadAppearsAfterReads: 9 },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'wenn die Heizlast im Poll-Fenster nicht kommt, bleibt es eingereicht (kein Erfolg vorgaukeln)',
  },
  {
    id: 't4.r1.status.exactlyOneRoom',
    flaeche: 'status',
    label: 'genau 1 Raum reicht für Vollständigkeit (rooms>0)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Grenzwert rooms===1 muss als „>0" gelten → freigegeben',
  },

  // === MATCH ===============================================================
  {
    id: 't4.r1.match.whitespaceName',
    flaeche: 'match',
    label: 'keine ID, Kundenname nur Whitespace',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: '   ' },
    autarcMock: {},
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'verknüpf' },
    why: 'leerer/whitespace-Name ist keine suchbare Grundlage → kein_projekt, kein stiller Fehlschlag',
  },
  {
    id: 't4.r1.match.multipleCustomersFirstWins',
    flaeche: 'match',
    label: 'mehrere Kunden zum Namen ohne Adress-Hinweis — KEIN Blind-Pick → kein_projekt',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Müller' },
    autarcMock: {
      customers: [
        { id: 'c-1', firstName: 'Max', lastName: 'Müller' },
        { id: 'c-2', firstName: 'Moritz', lastName: 'Müller' },
      ],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: fullProject(),
      rooms: oneRoom,
    },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'Mehrere autarc-Kunden' },
    why: 'mehrdeutiger Name OHNE addressHint darf NICHT blind den ersten Kunden nehmen (Gefahr: falsches Projekt „freigegeben") — ehrlich kein_projekt + manuelle Verknüpfung. Eindeutige Auflösung nur per addressHint.',
  },
  {
    id: 't4.r1.match.savedIdButEmptyProject',
    flaeche: 'match',
    label: 'savedProjectId vorhanden, aber Projekt spiegelt KEINES der gesendeten Felder',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      // readback liefert ein faktisch leeres Projekt (nur id) → keines der gesendeten Felder.
      readbackEmpty: true,
    },
    expect: { status: 'kein_projekt', blockt: true },
    why: 'falsch verknüpftes/leeres Projekt ist kein Daten-Diff sondern „kein Projekt" — nicht als Abweichung melden',
  },

  // === MELDUNG (Konkretheit) ===============================================
  {
    id: 't4.r1.meldung.fehlerNenntUrsache',
    flaeche: 'meldung',
    label: 'fehler-Meldung nennt nicht bloß „Fehler", sondern Ursache + dass nichts erledigt ist',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { patch: 500 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'eine Panne-Meldung muss klarmachen, dass nichts als erledigt markiert wurde (kein stiller Erfolg)',
  },
  {
    id: 't4.r1.meldung.keinProjektNenntManuell',
    flaeche: 'meldung',
    label: 'kein_projekt-Meldung weist auf manuelle Verknüpfung hin',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Niemand' },
    autarcMock: { customers: [] },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'manuell' },
    why: 'der Techniker muss wissen, was zu tun ist (Projekt manuell verknüpfen)',
  },
];
