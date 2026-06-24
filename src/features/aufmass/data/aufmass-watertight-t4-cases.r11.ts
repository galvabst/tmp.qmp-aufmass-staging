/**
 * Wasserdicht-Loop T4 — Runde 11 (Konvergenz): NEUE, bisher (Seeds + R1 + R2 + R3
 * + R6 + R7 + R8 + R9 + R10) nicht abgedeckte gemeine Fälle.
 *
 * Schwerpunkte dieser Runde — bewusst an Stellen, die KEINE Vorrunde traf:
 *
 *  - DIFF: readback-Skalar === NaN (echtes number-NaN, nicht der String "NaN").
 *    typeof beide number → scalarsEqual nutzt Math.abs(140-NaN)=NaN; NaN<=epsilon
 *    ist false → Abweichung. (R2/R3 prüften NaN nur an der HEIZLAST; an einem
 *    verglichenen Skalarfeld nie — dort wäre ein „NaN ist gleich"-Bug fatal.)
 *  - DIFF: readback-Skalar = whitespace-only String ("   "). normalizeValue
 *    trimmt zu "" (kein numerischer String) → "" ≠ 140 → Abweichung. Heikel, weil
 *    "" NICHT null ist (also kein „fehlt"-Zweig) und nicht numerisch (also kein
 *    Egalisieren) — es muss als echte Werte-Abweichung erkannt werden.
 *  - DIFF: readback-Skalar mit Einheit ("140 m²") → Number(...)=NaN → bleibt String
 *    ≠ 140 → Abweichung (eine Zahl-mit-Suffix darf nicht numerisch egalisiert werden).
 *  - DIFF: readback-Skalar "+140" (führendes Plus) → Number("+140")=140 → gleich →
 *    freigegeben (Gegenstück zu r8 führende Null; das Vorzeichen-Plus fehlte).
 *  - DIFF: readback-Bool an einem ZAHL-Feld als false (numberOfResidents=false) →
 *    normalize false ≠ 3 → Abweichung. R10 prüfte true an Zahlfeld; false ist der
 *    andere Bool-Wert (und besonders heikel, weil false „leer/aus" suggeriert, aber
 *    NICHT null ist → kein „fehlt", sondern echte Abweichung).
 *  - STATUS: Heizlast als ARRAY ([8.4]) — typeof !== number → null-Heizlast →
 *    eingereicht. Eine in ein Array verpackte Heizlast ist kein berechneter Skalar
 *    und darf nicht als final korrekt freigegeben werden. (Bisher String/Bool/NaN/
 *    Infinity/MIN_VALUE — ein nicht-skalarer Container fehlte.)
 *  - STATUS/RÄUME: rooms-Array mit Nicht-Objekt-Einträgen ([1,2,3]) → length>0 →
 *    rooms>0 → freigegeben. Der Vollständigkeits-Check zählt nur die Länge, nicht
 *    die Form der Einträge (autarc-Raumobjekte sind read-only/opak) — er darf an
 *    untypischen Einträgen nicht stolpern. (Bisher nur korrekte Raum-Objekte / [].)
 *  - DIFF abgeleitet (Heizungs-Baujahr) POSITIVER Pfad: Inbetriebnahme 1970 →
 *    before1980, autarc spiegelt before1980 → freigegeben. R3 prüfte nur den
 *    Heizungs-Baujahr-MISMATCH; das korrekt-zurückgespiegelte Gegenstück fehlte.
 *  - DIFF Baualtersklassen-GRENZE: Baujahr exakt 2002 → deriveBuildingAge='from2002',
 *    autarc spiegelt 'from2002' → ok; UND die Grenze knapp darunter (2001) →
 *    'from1995To2001', autarc spiegelt aber 'from2002' (als hätte autarc 2002
 *    klassifiziert) → Abweichung. Prüft, dass die Ableitungs-GRENZE (>=2002) sauber
 *    ins payload geht und Abweichungen daran blocken.
 *  - PANNE: erfolgreicher PATCH + erfolgreicher readback, aber rooms bricht
 *    netzseitig ab WÄHREND diff schon ok war → fehler (nicht „freigegeben mit
 *    diff ok"). Bestätigt, dass ein später Endpunkt-Abbruch den frühen Erfolg
 *    nicht „rettet". (R1 hatte rooms-networkError OHNE readbackOverride; hier mit
 *    explizit grünem diff ist der Punkt, dass diff-ok kein Erfolg ohne rooms ist.)
 *  - DIFF: malformte PATCH-ANTWORT (200 mit Objekt ohne id) bei sauberem readback →
 *    freigegeben. Der PATCH-Body wird verworfen (readback erfolgt separat per GET),
 *    also darf eine kaputte PATCH-Antwort den Erfolg NICHT killen. (R2 setzte
 *    wrongShape auf patch UND getProject → fehler; der patch-allein-Fall fehlte.)
 *    Tag = diff (Erfolgsfall), bewusst NICHT panne (siehe Invariante im Test).
 *  - PANNE-PRÄZEDENZ: readback ok, aber rooms 500 UND Heizlast wäre 0 — der
 *    rooms-500-Abbruch schlägt VOR der Heizlast zu → fehler (nicht eingereicht).
 *    Bestätigt die Orchestrator-Reihenfolge rooms vor Heizlast.
 *  - MATCH: savedProjectId = "0" (numerischer-String-ID, falsy-artig) → cleanedId
 *    behält "0" (nicht leer) → matched mit projectId "0". Eine "0"-ID ist eine
 *    gültige, nicht-leere ID und darf nicht fälschlich als leer verworfen werden
 *    (der Code prüft auf leeren getrimmten String, nicht auf Falsy). PATCH/readback
 *    laufen gegen /projects/0 → freigegeben.
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

export const T4_CASES_R11: T4Case[] = [
  // === DIFF: NaN / whitespace / Einheit / Plus an einem Skalarfeld ===========
  {
    id: 't4.r11.diff.scalarReadbackNaN',
    flaeche: 'diff',
    label: 'readback heatedLivingAreaM2 = NaN (echtes number-NaN) vs gesendet 140 → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { heatedLivingAreaM2: Number.NaN },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'NaN ist typeof number, aber Math.abs(140-NaN)=NaN und NaN<=epsilon ist false → Abweichung; ein NaN am verglichenen Skalar darf NICHT als „im Toleranzfenster" durchrutschen (an der Heizlast wurde NaN geprüft, an einem Diff-Skalar nie)',
  },
  {
    id: 't4.r11.diff.scalarReadbackWhitespaceOnly',
    flaeche: 'diff',
    label: 'readback averageEnergyConsumptionLast3Years = "   " (nur Whitespace) vs 18000 → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: '   ' },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'averageEnergyConsumptionLast3Years' },
    why: 'ein reiner Whitespace-String wird getrimmt zu "" (nicht numerisch, aber auch NICHT null) → "" ≠ 18000 → echte Werte-Abweichung; weder „fehlt"-Zweig noch numerisches Egalisieren darf greifen',
  },
  {
    id: 't4.r11.diff.scalarReadbackWithUnit',
    flaeche: 'diff',
    label: 'readback heatedLivingAreaM2 = "140 m²" (Zahl mit Einheit) vs gesendet 140 → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { heatedLivingAreaM2: '140 m²' },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'Number("140 m²") ist NaN → der String bleibt String ≠ 140 → Abweichung; eine Zahl mit angehängter Einheit darf nicht numerisch egalisiert werden (autarc müsste den reinen Wert spiegeln)',
  },
  {
    id: 't4.r11.diff.scalarReadbackLeadingPlus',
    flaeche: 'diff',
    label: 'readback heatedLivingAreaM2 = "+140" (führendes Plus) vs gesendet 140 → gleich',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { heatedLivingAreaM2: '+140' },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Number("+140") ist 140 — die String→Zahl-Normalisierung egalisiert ein führendes Plus → kein Fehlalarm (Gegenstück zu r8s führender Null)',
  },
  {
    id: 't4.r11.diff.residentsBooleanFalseMismatch',
    flaeche: 'diff',
    label: 'numberOfResidents readback = false (Boolean) vs gesendet 3 → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { numberOfResidents: false as unknown as number },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfResidents' },
    why: 'false ist normalisiert false ≠ 3 → Abweichung; besonders heikel, weil false „aus/leer" suggeriert, aber NICHT null ist → kein „fehlt"-Zweig, sondern echte Abweichung (Gegenstück zu r10s true an Zahlfeld)',
  },

  // === STATUS / RÄUME: nicht-skalare Heizlast + untypische Raum-Einträge ======
  {
    id: 't4.r11.status.heatLoadAsArray',
    flaeche: 'status',
    label: 'Heizlast = [8.4] (Array statt Zahl) → typeof !== number → eingereicht',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { buildingHeatLoadKw: [8.4] as unknown as number },
    },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'eine in ein Array verpackte Heizlast ist kein berechneter Zahl-Skalar (typeof Array !== "number") → readHeatLoad liefert null → eingereicht; ein nicht-skalarer Container darf nie als final korrekt freigegeben werden',
  },
  {
    id: 't4.r11.status.roomsNonObjectEntries',
    flaeche: 'status',
    label: 'rooms = [1, 2, 3] (Nicht-Objekt-Einträge) → length 3 > 0 → freigegeben',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: [1, 2, 3] as unknown as AutarcRoomMock[],
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'der Vollständigkeits-Check zählt nur Array.length, nicht die Form der Einträge — autarc-Raumobjekte sind opak/read-only; untypische Einträge dürfen den „mindestens ein Raum"-Check nicht aushebeln (Array.isArray reicht, kein Form-Crash)',
  },

  // === DIFF abgeleitete Felder: positiver Pfad + Klassengrenze ===============
  {
    id: 't4.r11.diff.heatingYearDerivedOk',
    flaeche: 'diff',
    label: 'Inbetriebnahme 1970 → before1980, autarc spiegelt before1980 → ok',
    // heizung_inbetriebnahme_datum 1970 → payload.currentHeatingSystemConstructionYear === 'before1980'
    formValues: { heizung_inbetriebnahme_datum: '1970-06-01' } as Partial<AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ currentHeatingSystemConstructionYear: 'before1980' }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Gegenstück zum r3-Heizungsjahr-Mismatch: ein korrekt abgeleitetes + zurückgespiegeltes Heizungs-Baujahr darf KEIN Fehlalarm sein (die Ableitung selbst muss konsistent ins payload und sauber durch den Diff)',
  },
  {
    id: 't4.r11.diff.buildingAgeBoundary2002Ok',
    flaeche: 'diff',
    label: 'Baujahr exakt 2002 → deriveBuildingAge from2002, autarc spiegelt from2002 → ok',
    // bauantrag_datum 2002 → payload.buildingAge === 'from2002' (Grenze >=2002)
    formValues: { bauantrag_datum: '2002-01-01' },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingAge: 'from2002' }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'die untere Grenze der jüngsten Baualtersklasse (>=2002) muss korrekt ins payload gehen — 2002 ist from2002; spiegelt autarc das, ist es kein Fehler (Klassengrenzen-Konsistenz)',
  },
  {
    id: 't4.r11.diff.buildingAgeBoundary2001Mismatch',
    flaeche: 'diff',
    label: 'Baujahr 2001 → from1995To2001, autarc spiegelt aber from2002 → Abweichung',
    // bauantrag_datum 2001 → payload.buildingAge === 'from1995To2001'; autarc gibt from2002 zurück.
    formValues: { bauantrag_datum: '2001-12-31' },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingAge: 'from2002' }), rooms: oneRoom },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'buildingAge' },
    why: '2001 fällt knapp in from1995To2001 (Grenze ist >=2002) — gibt autarc stattdessen from2002 zurück, hat es die Klasse falsch übernommen → Abweichung; die Ableitungs-Grenze muss exakt geprüft werden',
  },

  // === PANNEN: später Endpunkt-Abbruch rettet frühen Erfolg NICHT ============
  {
    id: 't4.r11.panne.diffOkButRoomsNetworkError',
    flaeche: 'panne',
    label: 'PATCH+readback grün (diff ok), aber GET /rooms bricht netzseitig ab → fehler',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, networkError: ['getRooms'] },
    expect: { status: 'fehler', blockt: true },
    why: 'ein sauberer diff ist KEIN Erfolg, solange die Vollständigkeit (Räume) nicht prüfbar ist — reißt /rooms netzseitig ab, endet der Lauf in fehler, nicht in einem halben „freigegeben mit diff ok"',
  },
  {
    // Bewusst flaeche='diff' (nicht 'panne'): dieser Fall demonstriert einen ERFOLG
    // (freigegeben), nicht eine Panne. Die Invariante „jede panne → fehler" gilt für
    // panne-Fälle; ein malformter PATCH-Body bei sauberem readback ist gerade KEINE
    // Panne, weil der PATCH-Body verworfen wird. Tag = diff (Round-Trip-Verifikation).
    id: 't4.r11.diff.patchResponseMalformedButReadbackOk',
    flaeche: 'diff',
    label: 'PATCH-Antwort ist 200 mit falscher Form (Objekt ohne id), readback aber sauber → freigegeben',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    // wrongShape NUR auf patch: die PATCH-Antwort ist {unexpected:...} (kein Projekt), aber patchProject
    // wertet den Body NICHT aus (nur res.ok). Der separate readback (getProject) liefert das echte Projekt.
    autarcMock: { project: fullProject(), rooms: oneRoom, wrongShape: ['patch'] },
    expect: { status: 'freigegeben', blockt: false },
    why: 'der PATCH-Response-Body wird bewusst ignoriert (das readback erfolgt separat per GET) — eine malformte PATCH-Antwort bei sauberem readback darf KEIN fehler auslösen; R2 setzte wrongShape auf patch UND getProject (→ fehler), der patch-allein-Fall (Body irrelevant) fehlte',
  },
  {
    id: 't4.r11.panne.roomsErrorBeforeHeatLoadZero',
    flaeche: 'panne',
    label: 'readback ok, rooms 500, Heizlast wäre 0 — rooms-Fehler schlägt vor der Heizlast zu → fehler',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject({ buildingHeatLoadKw: 0 }),
      rooms: oneRoom,
      httpStatus: { getRooms: 500 },
    },
    expect: { status: 'fehler', blockt: true },
    why: 'der Orchestrator holt erst die Räume, dann die Heizlast — scheitert /rooms (500), wird die Heizlast nie erreicht und der Lauf endet in fehler (nicht „eingereicht" wegen Heizlast 0); ein technischer Abbruch hat Vorrang vor dem fachlichen Heizlast-Urteil',
  },

  // === MATCH: "0"-ID ist gültig (nicht leer, nur falsy-artig) ================
  {
    id: 't4.r11.match.savedIdZeroString',
    flaeche: 'match',
    label: 'savedProjectId = "0" (numerischer-String, falsy-artig) → gültige ID → matched',
    formValues: {},
    matchInput: { savedProjectId: '0' },
    // PATCH/readback laufen gegen /projects/0; das Mock-Projekt hat id 'p-1', aber getProject prüft nur
    // „id != null", nicht die Gleichheit mit der angefragten ID → das Projekt gilt als gültiges readback.
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'cleanedId verwirft nur leere/whitespace-/unsichtbare IDs, nicht „falsy"-Werte — "0" ist eine nicht-leere, gültige ID und muss als matched durchgehen; der Code darf nicht auf Truthiness statt auf „nach Trim nicht leer" prüfen',
  },
];
