/**
 * Wasserdicht-Loop T4 — Runde 9 (Konvergenz): NEUE, bisher (Seeds + R1 + R2 + R3
 * + R6 + R7 + R8) nicht abgedeckte gemeine Fälle.
 *
 * Schwerpunkte dieser Runde — bewusst an Stellen, die KEINE Vorrunde traf:
 *
 *  - NUMBER-EDGE (JS-Number-Parsing exotischer Zahl-Strings): Hex ("0x8C"),
 *    Binär ("0b10001100") und Oktal ("0o214") sind in JS allesamt numerisch 140 →
 *    die String→Zahl-Normalisierung egalisiert sie → KEIN Fehlalarm. Gegenstück:
 *    e-Notation, die NICHT passt ("1.9e4" = 19000 ≠ 18000) → echte Abweichung; und
 *    der String "Infinity" (Number("Infinity")=∞) als readback-Skalar ≠ 140 →
 *    Abweichung (kein stilles Egalisieren auf ∞). (Bisher nur "1.8e4"-Treffer + JS-
 *    Literal-Trenner; reale JS-Radix-Strings nie geprüft.)
 *  - HTTP-GRENZE am OBEREN ok-Rand: readback 299 (res.ok=true → Erfolgspfad) vs 300
 *    (res.ok=false → fehler) und ein 3xx-Redirect (302) auf dem readback. (R8 traf
 *    nur die untere Grenze 400; 299/300/302 nie.)
 *  - DIFF NON-SKALAR im readback: ein gesendetes Skalarfeld kommt als verschachteltes
 *    Objekt ({value:140}) zurück → normalizeValue lässt das Objekt durch →
 *    scalarsEqual(140, obj) ist false → Abweichung (kein Crash, kein Egalisieren).
 *    Plus: heatingCircuits als OBJEKT (nicht Array/null) im readback → jeder gesendete
 *    Kreis gilt als fehlt → Abweichung. (R1 traf null; ein Objekt ist ein anderer Branch.)
 *  - HEIZKREIS-Toleranzgrenze JUST-OVER (bisher nur within-tolerance auf Kreisen):
 *    returnTemperature 45 → 45.02 (> epsilon) → Abweichung; index als Whitespace-
 *    String (" 0 ") muss strukturell als 0 erkannt werden → kein Fehlalarm.
 *  - STATUS Heizlast-Mikrowert: 0.0001 (winzig, aber > 0) → freigegeben; und der
 *    kleinstmögliche positive Double (Number.MIN_VALUE) → freigegeben. (Bisher nur
 *    8.4 / 0 / null / negativ / NaN / Infinity — der „knapp über Null"-Rand fehlte.)
 *  - STATUS viele Räume: rooms-Array mit 50 Einträgen → rooms>0 → freigegeben
 *    (Grenzwert war bisher nur 0 und genau 1).
 *  - MATCH: customerName mit umgebenden Leerzeichen ("  Mustermann  ") → nach Trim
 *    suchbar → Fallback greift (bisher nur whitespace-only → kein_projekt). Plus:
 *    savedProjectId nur aus Newlines ("\n\n") → cleanedId kollabiert zu "" → kein_projekt
 *    (R2 spaces, R7 ZWSP; reine Newline-ID ist eine eigene Whitespace-Variante).
 *  - DIFF: kein Heizkreis gesendet (Rücklauf fehlt) + readback hat ein LEERES Array []
 *    → muss ignoriert werden → freigegeben (R3 ignorierte einen befüllten readback-Kreis
 *    bei nichts-gesendet; das leere Array als Sonderform fehlte).
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

/** Großes Räume-Array (50 Einträge) für den „viele Räume"-Grenzwert. */
const manyRooms: AutarcRoomMock[] = Array.from({ length: 50 }, (_, i) => ({
  id: `r${i}`,
  name: `Raum ${i}`,
  floor: 'ground',
  temperature: 21,
}));

export const T4_CASES_R9: T4Case[] = [
  // === NUMBER-EDGE: JS-Radix-Strings sind numerisch gleich ===================
  {
    id: 't4.r9.diff.hexStringEqual',
    flaeche: 'diff',
    label: 'readback "0x8C" (Hex = 140) vs gesendet 140 — numerisch gleich',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '0x8C' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Number("0x8C") ist 140 — die String→Zahl-Normalisierung egalisiert Hex-Schreibweise → kein Fehlalarm (autarc gibt denselben Wert nur anders kodiert zurück)',
  },
  {
    id: 't4.r9.diff.binaryStringEqual',
    flaeche: 'diff',
    label: 'readback "0b10001100" (Binär = 140) vs gesendet 140 — numerisch gleich',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '0b10001100' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Number("0b10001100") ist 140 — auch Binär-Strings werden numerisch egalisiert → kein Fehlalarm',
  },
  {
    id: 't4.r9.diff.scientificNotationMismatch',
    flaeche: 'diff',
    label: 'readback "1.9e4" (=19000) vs gesendet 18000 — e-Notation, aber echte Differenz',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: '1.9e4' },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'averageEnergyConsumptionLast3Years' },
    why: '"1.9e4" ist numerisch 19000 ≠ 18000 — die e-Notation-Normalisierung darf eine reale Differenz NICHT verschlucken (Gegenstück zu r7s passendem "1.8e4")',
  },
  {
    id: 't4.r9.diff.infinityStringMismatch',
    flaeche: 'diff',
    label: 'readback "Infinity" (Number→∞) vs gesendet 140 — ≠ → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: 'Infinity' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'Number("Infinity") ist ∞ und ≠ 140 — die Normalisierung darf den String "Infinity" nicht still auf eine gültige Fläche egalisieren → Abweichung',
  },

  // === HTTP-GRENZE am oberen ok-Rand (299/300) + 3xx-Redirect ================
  {
    id: 't4.r9.panne.getProject300',
    flaeche: 'panne',
    label: 'readback GET /projects/{id} liefert HTTP 300 (erster nicht-ok über 2xx)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 300 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: '300 ist außerhalb des 2xx-ok-Bereichs (res.ok=false) — die obere ok-Grenze muss als Fehler greifen, sonst würde ein Redirect-Status als Erfolg fehlgedeutet',
  },
  {
    id: 't4.r9.panne.getProject302Redirect',
    flaeche: 'panne',
    label: 'readback GET /projects/{id} liefert HTTP 302 (Redirect)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 302 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'ein 3xx-Redirect-Status (res.ok=false) ist kein verwertbares readback — der Round-Trip ist nicht verifizierbar → fehler, kein Erfolg',
  },

  // === DIFF NON-SKALAR im readback ==========================================
  {
    id: 't4.r9.diff.scalarReadbackIsObject',
    flaeche: 'diff',
    label: 'gesendet 140, readback heatedLivingAreaM2 = { value: 140 } (Objekt statt Skalar)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { heatedLivingAreaM2: { value: 140 } },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'ein verschachteltes Objekt statt eines Skalars ist nicht gleich der gesendeten Zahl — normalizeValue lässt das Objekt durch, scalarsEqual ergibt false → Abweichung (kein Crash, kein Egalisieren)',
  },
  {
    id: 't4.r9.diff.circuitReadbackIsObject',
    flaeche: 'diff',
    label: 'heatingCircuits readback ist ein OBJEKT (nicht Array/null) → gesendeter Kreis fehlt',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { heatingCircuits: { name: 'kein-array' } as unknown as [] },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits[1]' },
    why: 'ist heatingCircuits im readback kein Array (sondern ein Objekt), gilt der gesendete Kreis als nicht angekommen → fehlt-Abweichung (Gegenstück zu r1s null)',
  },

  // === HEIZKREIS: Toleranz-JUST-OVER + Whitespace-Index =====================
  {
    id: 't4.r9.diff.circuitReturnJustOverTolerance',
    flaeche: 'diff',
    label: 'heatingCircuits returnTemperature 45 → 45.02 (> epsilon) → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45.02, index: 1 }],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits[1].returnTemperature' },
    why: 'auf Heizkreis-Temperaturen gilt dieselbe Float-Toleranz wie auf Skalaren — 0.02 > epsilon (0.01) ist eine echte Abweichung und muss blocken (Gegenstück zu r2s within-tolerance)',
  },
  {
    id: 't4.r9.diff.circuitIndexWhitespaceString',
    flaeche: 'diff',
    label: 'heatingCircuits readback index " 0 " (Whitespace-String) → strukturell 0',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [
          { name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: ' 0 ' as unknown as number },
        ],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'der Index wird per normalizeValue verglichen — " 0 " ist getrimmt numerisch 0 und muss denselben Kreis treffen → kein Fehlalarm (R2 prüfte "0", nicht den Whitespace-Fall)',
  },

  // === STATUS: Heizlast knapp über Null + viele Räume =======================
  {
    id: 't4.r9.status.heatLoadTinyPositive',
    flaeche: 'status',
    label: 'Heizlast = 0.0001 (winzig, aber > 0) → freigegeben',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: 0.0001 }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'jeder endliche Wert > 0 zählt als berechnete Heizlast — der „knapp über Null"-Rand muss als freigegeben gelten (Schwelle ist > 0, nicht ein Mindestbetrag)',
  },
  {
    id: 't4.r9.status.heatLoadSmallestDouble',
    flaeche: 'status',
    label: 'Heizlast = Number.MIN_VALUE (kleinstes positives Double) → > 0 → freigegeben',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: Number.MIN_VALUE }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'das kleinstmögliche positive Double ist > 0 (und endlich) — die Heizlast-Schwelle darf an diesem Extrem nicht fälschlich auf 0/eingereicht kippen',
  },
  {
    id: 't4.r9.status.manyRooms',
    flaeche: 'status',
    label: 'rooms-Array mit 50 Einträgen → rooms>0 → freigegeben',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: manyRooms },
    expect: { status: 'freigegeben', blockt: false },
    why: 'viele gescannte Räume sind erst recht „>0" — der Vollständigkeits-Check darf nur auf „mindestens ein Raum" prüfen, nicht auf eine Obergrenze stolpern',
  },

  // === MATCH: gepaddeter gültiger Name + Newline-only-ID =====================
  {
    id: 't4.r9.match.paddedCustomerNameFallback',
    flaeche: 'match',
    label: 'keine ID, customerName "  Mustermann  " (umgebende Leerzeichen) → Fallback greift',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: '  Mustermann  ' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: fullProject(),
      rooms: oneRoom,
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'ein Kundenname mit umgebenden Leerzeichen ist nach Trim suchbar — die Fallback-Auflösung muss sauber durchlaufen (R1 testete whitespace-only=ungültig; der gepaddet-gültige Fall fehlte)',
  },
  {
    id: 't4.r9.match.newlineOnlySavedId',
    flaeche: 'match',
    label: 'savedProjectId nur Newlines ("\\n\\n") + kein Kundenname → kein_projekt',
    formValues: {},
    matchInput: { savedProjectId: '\n\n', customerName: null },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'verknüpf' },
    why: 'eine reine Newline-ID kollabiert via cleanedId zu "" — sie ist keine gültige autarc-ID und darf nicht als matched durchgehen (eigene Whitespace-Variante neben Spaces/ZWSP)',
  },

  // === DIFF: nichts gesendet + leeres readback-Array ignorieren =============
  {
    id: 't4.r9.diff.noCircuitSentEmptyArrayIgnored',
    flaeche: 'diff',
    label: 'kein Heizkreis gesendet (Rücklauf fehlt) + readback heatingCircuits [] → ignoriert',
    // ruecklauftemperatur=null → mapping erzeugt KEIN heatingCircuits im payload.
    formValues: { ruecklauftemperatur: null } as Partial<AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatingCircuits: [] } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'wird kein Heizkreis gesendet, ist auch ein leeres readback-Array irrelevant — der Diff iteriert nur gesendete Felder → kein Fehlalarm (R3 ignorierte einen befüllten readback-Kreis; das leere Array als Sonderform fehlte)',
  },
];
