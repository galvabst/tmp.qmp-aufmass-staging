/**
 * Wasserdicht-Loop T4 — Runde 2: NEUE, bisher nicht abgedeckte gemeine Fälle.
 *
 * Über Seeds + R1 hinaus. Schwerpunkte dieser Runde:
 *  - match (Robustheit der Projekt-Auflösung): savedProjectId leer/whitespace
 *    (darf NICHT als gültige ID gelten), Fallback-Projekt ohne `id`
 *    (matched-ohne-ID darf NICHT als unvollständig/freigegeben durchschlagen),
 *    Fallback + leeres readback.
 *  - panne (verkleidet): GET /projects/{id} liefert 200, aber KEIN Projekt
 *    (Objekt ohne `id`) → muss `fehler` sein, NICHT als „leeres/falsches Projekt"
 *    (kein_projekt) durchgehen; nullBody/wrongShape auf getRooms & searchCustomers.
 *  - diff: heatingCircuits readback `[]` (leer), index als String, flow/return
 *    innerhalb Toleranz, leerer String statt Wert (fehlt-Signal), >3 Abweichungen
 *    (Meldung kürzt + „weitere"), null↔0-Unterscheidung in eine andere Richtung.
 *  - status: Heizlast als numerischer String (nicht number → kein Erfolg),
 *    Heizlast NaN, Poll-Fenster-Grenze (genau am letzten Versuch da / einen zu spät).
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

export const T4_CASES_R2: T4Case[] = [
  // === MATCH (Robustheit der Projekt-Auflösung) ============================
  {
    id: 't4.r2.match.whitespaceSavedId',
    flaeche: 'match',
    label: 'savedProjectId ist nur Whitespace ("  ") + kein Kundenname',
    formValues: {},
    matchInput: { savedProjectId: '  ', customerName: null },
    autarcMock: { customers: [] },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'verknüpf' },
    why: 'eine whitespace-only ID ist keine gültige autarc-ID — darf nicht blind als matched gelten (sonst PATCH an /projects/%20%20)',
  },
  {
    id: 't4.r2.match.emptyStringSavedId',
    flaeche: 'match',
    label: 'savedProjectId leerer String + Kundenname leer',
    formValues: {},
    matchInput: { savedProjectId: '', customerName: '' },
    autarcMock: {},
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'Kundenname' },
    why: 'leere ID + leerer Name → keine Auflösbarkeit → kein_projekt (kein stiller Fehlschlag)',
  },
  {
    id: 't4.r2.match.fallbackProjectNoId',
    flaeche: 'match',
    label: 'Fallback: Kunde gefunden, aber das Projekt hat keine id',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      // Projekt ohne id → die ID ist nicht auflösbar → KEIN matched-ohne-ID.
      projectsByCustomer: [{ id: '', humanId: 'AT-1001' } as unknown as { id: string }],
    },
    expect: { status: 'kein_projekt', blockt: true },
    why: 'ein Projekt ohne brauchbare id ist nicht verknüpfbar → kein_projekt, NICHT „matched" mit leerer ID (sonst fälschlich unvollständig/Erfolg)',
  },
  {
    id: 't4.r2.match.fallbackEmptyReadback',
    flaeche: 'match',
    label: 'Fallback resolved, aber readback-Projekt ist faktisch leer',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: fullProject(),
      rooms: oneRoom,
      readbackEmpty: true,
    },
    expect: { status: 'kein_projekt', blockt: true },
    why: 'auch über den Fallback gilt: leeres readback = falsch verknüpftes/leeres Projekt = kein_projekt, nicht Abweichung',
  },

  // === PANNE (verkleidet als 200, betrifft getProject/Rooms/Customers) ======
  {
    id: 't4.r2.panne.getProjectNoIdObject',
    flaeche: 'panne',
    label: 'GET /projects/{id} liefert 200 mit Objekt OHNE id (kein Projekt)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, wrongShape: ['getProject'] },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'ein 200-Body ohne id ist KEIN Projekt → technische Panne (fehler), nicht „leeres/falsches Projekt" (kein_projekt) und schon gar kein Erfolg',
  },
  {
    id: 't4.r2.panne.patchWrongShape',
    flaeche: 'panne',
    label: 'PATCH liefert 200 mit Objekt ohne id; readback ebenfalls kein Projekt',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, wrongShape: ['getProject', 'patch'] },
    expect: { status: 'fehler', blockt: true },
    why: 'wenn das readback strukturell kein Projekt ist, ist der Round-Trip nicht verifizierbar → fehler',
  },
  {
    id: 't4.r2.panne.roomsNullBody',
    flaeche: 'panne',
    label: 'GET /rooms liefert 200 mit body=null',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, nullBody: ['getRooms'] },
    expect: { status: 'fehler', blockt: true },
    why: 'null statt Array ist keine „0 Räume", sondern eine kaputte Antwort → fehler (kein Falsch-„unvollständig")',
  },
  {
    id: 't4.r2.panne.customersNullBody',
    flaeche: 'panne',
    label: 'Fallback: GET /customers liefert 200 mit body=null',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: { nullBody: ['searchCustomers'] },
    expect: { status: 'fehler', blockt: true },
    why: 'null-Kundenliste ist technisch kaputt → fehler, NICHT „kein Kunde gefunden"',
  },
  {
    id: 't4.r2.panne.listProjectsNullBody',
    flaeche: 'panne',
    label: 'Fallback: GET /projects?customerId liefert 200 mit body=null',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      nullBody: ['listProjects'],
    },
    expect: { status: 'fehler', blockt: true },
    why: 'null-Projektliste ist technisch kaputt → fehler, NICHT „Kunde hat kein Projekt"',
  },
  {
    id: 't4.r2.panne.getProjectBrokenJsonInPoll',
    flaeche: 'panne',
    label: 'Heizlast 0 → Poll re-read liefert kaputtes JSON',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject({ buildingHeatLoadKw: 0 }),
      rooms: oneRoom,
      brokenJson: ['getProject'],
      heatLoadAppearsAfterReads: 5,
    },
    expect: { status: 'fehler', blockt: true },
    why: 'auch ein Fehler WÄHREND des Heizlast-Polls darf nicht verschluckt werden → fehler',
  },

  // === DIFF =================================================================
  {
    id: 't4.r2.diff.circuitEmptyArray',
    flaeche: 'diff',
    label: 'heatingCircuits readback = [] (leeres Array, nicht null)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatingCircuits: [] } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits' },
    why: 'gesendeter Heizkreis, aber autarc hat ein leeres Array → der gesendete Kreis fehlt → Abweichung',
  },
  {
    id: 't4.r2.diff.circuitIndexAsString',
    flaeche: 'diff',
    label: 'heatingCircuits readback index "0" (String) statt 0',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [
          { name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: '0' as unknown as number },
        ],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'index "0" vs 0 muss strukturell als derselbe Kreis erkannt werden (normalisiert) — kein Fehlalarm',
  },
  {
    id: 't4.r2.diff.circuitFlowWithinTolerance',
    flaeche: 'diff',
    label: 'heatingCircuits flowTemperature 55 → 55.005 (innerhalb Toleranz)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55.005, returnTemperature: 45, index: 0 }],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Heizkreis-Temperaturen unterliegen derselben Float-Toleranz wie Skalare — winzige Differenz ist kein Fehler',
  },
  {
    id: 't4.r2.diff.emptyStringIsMismatch',
    flaeche: 'diff',
    label: 'readback buildingType = "" (leerer String) statt Enum',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { buildingType: '' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'buildingType' },
    why: 'leerer String ≠ gesendeter Enum-Wert → echte Abweichung (autarc hat den Wert verworfen)',
  },
  {
    id: 't4.r2.diff.manyMismatchesTruncated',
    flaeche: 'meldung',
    label: '>3 Abweichungen → Meldung kürzt und nennt „weitere"',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatedLivingAreaM2: 999,
        numberOfResidents: 99,
        numberOfFloors: 9,
        isFacadeInsulated: false,
        isRoofInsulated: false,
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'weitere' },
    why: 'bei vielen Differenzen muss die Meldung lesbar bleiben (erste 3 + „und N weitere") — bleibt konkret',
  },
  {
    id: 't4.r2.diff.residentsStringEqual',
    flaeche: 'diff',
    label: 'numberOfResidents readback "3" (String) vs gesendet 3',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { numberOfResidents: '3' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'numerischer String auch bei Ganzzahlfeldern egalisieren — kein Fehlalarm',
  },

  // === STATUS ===============================================================
  {
    id: 't4.r2.status.heatLoadAsString',
    flaeche: 'status',
    label: 'Heizlast als numerischer String "8.4" (kein number)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { buildingHeatLoadKw: '8.4' },
    },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'eine als String gelieferte Heizlast ist nicht zweifelsfrei „berechnet>0" → sicherheitshalber eingereicht, nie freigegeben',
  },
  {
    id: 't4.r2.status.heatLoadNaN',
    flaeche: 'status',
    label: 'Heizlast = NaN',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { buildingHeatLoadKw: Number.NaN },
    },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'NaN ist nicht >0 → darf nicht als Erfolg durchgehen',
  },
  {
    id: 't4.r2.status.heatLoadAtLastPoll',
    flaeche: 'status',
    label: 'Heizlast erscheint genau am letzten Poll-Versuch (afterReads=3, attempts=3)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, heatLoadAppearsAfterReads: 3 },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Heizlast, die im 4. read (= letzter Poll-Versuch) erscheint, muss noch als freigegeben gelten',
  },
  {
    id: 't4.r2.status.heatLoadOnePollTooLate',
    flaeche: 'status',
    label: 'Heizlast einen read zu spät (afterReads=4, attempts=3)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, heatLoadAppearsAfterReads: 4 },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'kommt die Heizlast erst nach dem Poll-Fenster, bleibt es ehrlich eingereicht (kein vorgegaukelter Erfolg)',
  },
];
