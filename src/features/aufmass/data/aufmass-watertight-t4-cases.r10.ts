/**
 * Wasserdicht-Loop T4 — Runde 10 (Konvergenz): NEUE, bisher (Seeds + R1 + R2 + R3
 * + R6 + R7 + R8 + R9) nicht abgedeckte gemeine Fälle.
 *
 * Schwerpunkte dieser Runde — bewusst an Stellen, die KEINE Vorrunde traf:
 *
 *  - PRIORITÄTSKETTE bei MEHREREN gleichzeitigen Problemen (Reihenfolge des
 *    Status-Automaten, Contract §5): diff-Abweichung UND rooms=0 UND Heizlast=0
 *    zugleich → Schritt 4 (abweichung) gewinnt vor 5/6. Plus: leeres readback
 *    (kein_projekt) hätte AUCH rooms=0/Heizlast=0 → kein_projekt (via verify-core,
 *    vor dem Gate) gewinnt, nicht unvollstaendig.
 *  - 2xx-NON-200 ERFOLGSCODES: readback liefert HTTP 201/204-Body bzw. 206 — res.ok
 *    ist für 200–299 true, also Erfolgspfad (kein fälschliches „fehler" nur weil
 *    der Code nicht exakt 200 ist). Gegenstück zu R8/R9 (untere/obere NICHT-ok-Grenze).
 *  - HTTP-STATUS 0 (typisch bei CORS-/Netz-Abbruch in echten fetch-Implementierungen):
 *    res.ok=false → fehler (status 0 ist < 200).
 *  - FALSY-ID im readback-Projekt: id === 0 (Zahl) ist via `id == null` NICHT null →
 *    gilt als gültiges Projekt-Objekt, Erfolgspfad läuft weiter (kein Fehl-„fehler"
 *    wegen einer numerischen 0-id). Gegenstück: id === null im readback → Panne.
 *  - HEIZKREIS: readback-Kreis OHNE flowTemperature-Schlüssel (undefined) → normalisiert
 *    null ≠ gesendet 55 → Vorlauf-Abweichung (kein Crash bei fehlendem Key am Kreis).
 *    Plus: Float-Toleranz auf Heizkreis in die NEGATIVE Richtung (45 → 44.995) → ok.
 *  - DIFF Float NEGATIVE Richtung am Skalar: readback KLEINER als gesendet, aber
 *    innerhalb epsilon (18000 → 17999.995) → ok (bisher nur readback größer getestet).
 *  - DIFF numberOfResidents readback = true (Boolean statt Zahl) → ≠ 3 → Abweichung
 *    (Bool-an-Zahlfeld, Gegenstück zu r3s Bool-Feld-bekommt-Zahl).
 *  - MELDUNG: windowGlazingType-Abweichung (in Vorrunden nie als benanntes Einzelfeld
 *    geprüft) → Meldung nennt genau dieses Feld.
 *  - MATCH: customerName aus reinem Zero-Width-Space (U+200B). Anders als bei der
 *    savedProjectId nutzt der Match-Code für den NAMEN nur `.trim()` (entfernt KEIN
 *    ZWSP) → der Name gilt als nicht-leer → der Fallback-Such-Pfad LÄUFT (customers=[]
 *    → kein_projekt mit „Kein autarc-Kunde"-Meldung). Dokumentiert das reale Verhalten:
 *    es endet sauber in kein_projekt (kein Crash, kein Erfolg), nur über einen anderen
 *    Zweig als der reine ASCII-Whitespace-Name (R1).
 *  - STATUS: Heizlast = -0.0001 (winziger negativer Wert, nicht -0/Ganz-negativ) →
 *    nicht > 0 → eingereicht (Gegenstück zu r9s winzig-POSITIV=freigegeben).
 *  - PANNEN-PRÄZEDENZ: networkError auf PATCH, während getProject 500 läge — der
 *    PATCH-Abbruch schlägt zuerst zu → fehler (nichts geschrieben), der spätere
 *    Endpunkt wird nie erreicht. Bestätigt die Reihenfolge im Orchestrator.
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

/** Reiner Zero-Width-Space (U+200B) — von String.trim() NICHT entfernt. */
const ZWSP = '​';

export const T4_CASES_R10: T4Case[] = [
  // === PRIORITÄTSKETTE bei mehreren gleichzeitigen Problemen =================
  {
    id: 't4.r10.status.diffWinsOverRoomsAndHeatLoad',
    flaeche: 'status',
    label: 'Abweichung UND rooms=0 UND Heizlast=0 zugleich → abweichung gewinnt (Schritt 4 vor 5/6)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject({ buildingHeatLoadKw: 0 }),
      rooms: [],
      readbackOverride: { heatedLivingAreaM2: 999 },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'der Status-Automat ist eine feste Prioritätskette (Contract §5): eine Daten-Abweichung wird VOR Vollständigkeit/Heizlast gemeldet — sonst würde der Techniker zum Räume-Scannen geschickt, obwohl die Gebäudedaten selbst falsch ankamen',
  },
  {
    id: 't4.r10.status.roomsZeroWinsOverHeatLoadZero',
    flaeche: 'status',
    label: 'diff ok, aber rooms=0 UND Heizlast=0 → unvollstaendig (Schritt 5 vor 6)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: 0 }), rooms: [] },
    expect: { status: 'unvollstaendig', blockt: true, meldungEnthaelt: 'Räume' },
    why: 'fehlen Räume UND Heizlast, ist der erste sinnvolle Schritt das Räume-Scannen (Schritt 5) — die Meldung führt dorthin, nicht zur Heizlast (Schritt 6)',
  },
  {
    id: 't4.r10.match.emptyReadbackWinsOverRoomsZero',
    flaeche: 'match',
    label: 'leeres readback (kein_projekt) hätte auch rooms=0 — kein_projekt gewinnt vor unvollstaendig',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: [], readbackEmpty: true },
    expect: { status: 'kein_projekt', blockt: true },
    why: 'ein faktisch leeres/falsch verknüpftes Projekt wird VOR dem Vollständigkeits-Check abgefangen (verify-core, vor dem Gate) — sonst würde ein Geister-Projekt als „nur Räume fehlen" verharmlost',
  },

  // === 2xx-NON-200 ERFOLGSCODES (res.ok für 200–299) =========================
  {
    id: 't4.r10.diff.getProject201Ok',
    flaeche: 'diff',
    label: 'readback GET liefert HTTP 201 (2xx, res.ok=true) → Erfolgspfad',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 201 } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'res.ok ist für jeden 2xx true — ein 201 statt 200 beim readback ist KEINE Panne; der Code darf nicht auf exakt 200 bestehen und einen gültigen Erfolgscode als Fehler werten',
  },
  {
    id: 't4.r10.panne.getProject206NotOkOnly200Range',
    flaeche: 'diff',
    label: 'readback GET liefert HTTP 206 (Partial Content, noch 2xx) → Erfolgspfad',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 206 } },
    expect: { status: 'freigegeben', blockt: false },
    why: '206 liegt noch im ok-Bereich (200–299) — der Body ist ein vollständiges Projekt; die Round-Trip-Prüfung muss durchlaufen, kein fälschliches fehler an der oberen ok-Innengrenze',
  },
  {
    id: 't4.r10.panne.getProjectStatusZero',
    flaeche: 'panne',
    label: 'readback GET mit Status 0 (CORS-/Netz-Abbruch) → fetch-Schicht wirft → fehler',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 0 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    // Hinweis: Ein echter Status 0 (CORS-/abgebrochener Call) ist in der WHATWG-fetch-
    // Spec kein konstruierbarer Response-Status — `new Response(..., {status:0})` wirft.
    // Genau dieser Wurf in der fetch-Schicht ist das realistische Verhalten eines
    // status-0-Calls; der Core fängt ihn als transportError ab → fehler. Entscheidend
    // ist die Invariante: ein Status-0-Call darf NIE als Erfolg durchgehen.
    why: 'ein Status-0-Readback (typisch bei CORS-/abgebrochenem fetch) ist kein verwertbares Ergebnis — die fetch-Schicht wirft, der Core endet in fehler; ein Null-Status darf nicht durch eine Lücke als Erfolg rutschen',
  },

  // === FALSY-ID im readback-Projekt =========================================
  {
    id: 't4.r10.diff.readbackIdZeroIsValid',
    flaeche: 'diff',
    label: 'readback-Projekt hat id=0 (Zahl) — id == null ist false → gültiges Projekt',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { id: 0 as unknown as string },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'die Projekt-Form-Prüfung nutzt `id == null` — eine numerische 0-id ist NICHT null und damit ein gültiges Projekt-Objekt; ein falsy-aber-vorhandenes id darf den Erfolgspfad nicht fälschlich als „kein Projekt-Objekt" (fehler) abwürgen',
  },

  // === HEIZKREIS: fehlender flow-Schlüssel + negative Float-Toleranz ==========
  {
    id: 't4.r10.diff.circuitMissingFlowKey',
    flaeche: 'diff',
    label: 'readback-Kreis ohne flowTemperature-Schlüssel (undefined) → Vorlauf-Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      // flowTemperature fehlt komplett → normalizeValue(undefined)=null ≠ 55.
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', returnTemperature: 45, index: 1 } as unknown as {
          flowTemperature: number;
          returnTemperature: number;
          index: number;
        }],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits[1].flowTemperature' },
    why: 'fehlt der Vorlauf-Schlüssel am zurückgelesenen Kreis, ist er faktisch null und ≠ der gesendeten 55 → Vorlauf-Abweichung (kein Crash, kein stilles Überspringen eines fehlenden Kreis-Feldes)',
  },
  {
    id: 't4.r10.diff.circuitReturnWithinToleranceNegative',
    flaeche: 'diff',
    label: 'heatingCircuits returnTemperature 45 → 44.995 (innerhalb Toleranz, negative Richtung) → ok',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 44.995, index: 0 }],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'die Float-Toleranz auf Heizkreis-Temperaturen gilt symmetrisch — ein leicht KLEINERer Rücklauf (Differenz 0.005 < epsilon) ist kein Fehler (Gegenstück zu r9s just-over in die positive Richtung)',
  },

  // === DIFF Float NEGATIVE Richtung am Skalar ================================
  {
    id: 't4.r10.diff.scalarFloatWithinToleranceNegative',
    flaeche: 'diff',
    label: 'readback Verbrauch KLEINER, aber innerhalb Toleranz (18000 → 17999.995) → ok',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: 17999.995 },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Math.abs in scalarsEqual macht die Toleranz richtungsunabhängig — ein readback knapp UNTER dem gesendeten Wert (innerhalb epsilon) ist kein Fehlalarm (bisher nur readback größer getestet)',
  },

  // === DIFF Bool-an-Zahlfeld (umgekehrte Typverwechslung) ===================
  {
    id: 't4.r10.diff.residentsBooleanMismatch',
    flaeche: 'diff',
    label: 'numberOfResidents readback = true (Boolean statt Zahl) vs gesendet 3 → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { numberOfResidents: true as unknown as number },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfResidents' },
    why: 'ein Boolean an einem Zahlenfeld ist normalisiert true ≠ 3 → Abweichung (Gegenstück zu r3: dort kam eine Zahl an einem Bool-Feld; hier ein Bool an einem Zahlfeld — beide müssen blocken)',
  },

  // === MELDUNG: windowGlazingType als benanntes Einzelfeld ===================
  {
    id: 't4.r10.meldung.glazingFieldNamed',
    flaeche: 'meldung',
    label: 'windowGlazingType-Abweichung → Meldung nennt genau dieses Feld',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { windowGlazingType: 'single' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'windowGlazingType' },
    why: 'auch die Verglasung muss bei Abweichung konkret benannt werden, damit der Techniker weiß, welcher Wert in autarc falsch steht (bisher nie als benanntes Einzelfeld geprüft)',
  },

  // === MATCH: customerName aus reinem Zero-Width-Space =======================
  {
    id: 't4.r10.match.zeroWidthSpaceCustomerName',
    flaeche: 'match',
    label: 'keine ID, customerName nur Zero-Width-Space (U+200B) → trim entfernt ZWSP NICHT → Fallback läuft',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: ZWSP + ZWSP },
    // .trim() lässt ZWSP stehen → Name gilt als nicht-leer → es wird gesucht; customers=[] → kein_projekt.
    autarcMock: { customers: [] },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'verknüpf' },
    why: 'für den NAMEN nutzt der Match-Code nur `.trim()` (entfernt kein ZWSP), also läuft die Kundensuche und liefert keinen Treffer → kein_projekt; entscheidend ist, dass es sauber blockt (kein Crash, kein Erfolg), nicht über welchen Zweig',
  },

  // === STATUS: winzige NEGATIVE Heizlast ====================================
  {
    id: 't4.r10.status.heatLoadTinyNegative',
    flaeche: 'status',
    label: 'Heizlast = -0.0001 (winzig negativ) → nicht > 0 → eingereicht',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: -0.0001 }), rooms: oneRoom },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'ein winziger NEGATIVer Wert ist trotz Nähe zu Null nicht > 0 — die Schwelle ist strikt > 0 und darf am negativen Mikro-Rand nicht fälschlich freigeben (Gegenstück zu r9s winzig-positiv=freigegeben)',
  },

  // === PANNEN-PRÄZEDENZ im Orchestrator =====================================
  {
    id: 't4.r10.panne.patchNetworkErrorBeforeGetProject500',
    flaeche: 'panne',
    label: 'networkError auf PATCH, getProject läge 500 — PATCH-Abbruch schlägt zuerst zu → fehler',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      networkError: ['patch'],
      httpStatus: { getProject: 500 },
    },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'der Orchestrator schreibt zuerst (PATCH) — reißt das netzseitig ab, ist nichts angekommen und der spätere readback (500) wird nie erreicht; beides endet in fehler, aber der PATCH-Fehler hat Präzedenz (nichts geschrieben/bestätigt)',
  },
];
