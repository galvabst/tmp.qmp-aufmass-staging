/**
 * Wasserdicht-Loop T4 — Runde 8 (Konvergenz): NEUE, bisher (Seeds + R1 + R2 + R3
 * + R6 + R7) nicht abgedeckte gemeine Fälle.
 *
 * Schwerpunkte dieser Runde — bewusst an Stellen, die KEINE Vorrunde traf:
 *
 *  - LOCALE/NUMBER: deutsche Dezimal-Komma-Notation ("140,5") und Unterstrich-
 *    Trenner ("1_000") sind in JS KEINE Zahlen → bleiben Strings → echte
 *    Abweichung (die String→Zahl-Normalisierung darf Locale-Schreibweisen NICHT
 *    fälschlich als gleich werten). Gegenstück: führende Null ("00140") IST
 *    numerisch 140 → kein Fehlalarm.
 *  - ENCODING/WHITESPACE: Zahlstring mit Tab/Newline ("\t140\n") wird getrimmt →
 *    gleich. Enum mit Non-Breaking-Space (U+00A0) wird von .trim() entfernt →
 *    gleich. (Bisher nur reguläre Leerzeichen getestet.)
 *  - KOMBINATION mehrerer Abweichungstypen GLEICHZEITIG: abgeleitetes Feld
 *    (buildingAge) + Heizkreis-Vorlauf + direkter Skalar alle falsch → blockt,
 *    Meldung nennt mehrere konkret. (R3 mischte nur abgeleitet+direkt, nie +Kreis.)
 *  - HEIZKREIS-MEHRFACH-MISMATCH am SELBEN Kreis: Vorlauf UND Rücklauf zugleich
 *    falsch → ZWEI Diff-Einträge, beide benannt. (R7 testete nur Rücklauf-allein.)
 *  - MELDUNGS-PRÄZISION/REIHENFOLGE: eine „fehlt"-Abweichung als ERSTES Feld
 *    (buildingType=null) + ein abweichendes Feld dahinter → die Meldung nennt
 *    BEIDE konkret, „nicht angekommen" für das fehlende. (Mischung fehlt+abweichung
 *    in den ersten 3 wurde nie geprüft.)
 *  - POLL-GRENZFALL: Heizlast erscheint exakt in der Mitte des Fensters
 *    (afterReads=2 bei attempts=3) → freigegeben. Plus: erster read negativ,
 *    danach positiv im Fenster → freigegeben (Poll überschreibt negativen Erstwert).
 *  - EXOTISCHE HTTP-CODES an JE ANDEREM Call: 502 Bad Gateway auf PATCH, 409
 *    Conflict auf readback, 418 auf rooms, 408 auf searchCustomers. Jeder Non-2xx
 *    muss `fehler` & blockt — kein Code-Pfad darf einen dieser durchlassen.
 *  - HTTP 400 exakt (untere Grenze des Fehlerbereichs): readback 400 → fehler
 *    (399 wäre <400; 400 ist der erste „nicht ok"-Code).
 *  - NEGATIVE/NULL je Feldtyp im readback: numberOfFloors=0 (gesendet 2) →
 *    Abweichung; numberOfResidents negativ (-5) → Abweichung. (Bisher nur 999/99.)
 *  - MATCH: customers[0] hat eine LEERE id, ein zweiter Kunde hätte eine gültige —
 *    der Code nimmt bewusst NUR customers[0] (Contract §6) → dessen leere id führt
 *    via leere projectsByCustomer-Auflösung zu kein_projekt (kein Crash, kein
 *    stilles Überspringen auf den zweiten Kunden).
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

/** Non-Breaking-Space (U+00A0) — wird von JS String.trim() entfernt. */
const NBSP = ' ';

export const T4_CASES_R8: T4Case[] = [
  // === LOCALE / NUMBER: deutsche Schreibweisen sind KEINE JS-Zahlen ==========
  {
    id: 't4.r8.diff.germanDecimalCommaMismatch',
    flaeche: 'diff',
    label: 'readback "140,5" (deutsches Dezimalkomma) vs gesendet 140 — kein JS-Number → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '140,5' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: '"140,5" ist in JS kein numerischer String (Number()→NaN) → bleibt String und ≠ 140 → echte Abweichung; die Normalisierung darf Locale-Komma nicht still als gleich werten',
  },
  {
    id: 't4.r8.diff.underscoreSeparatorMismatch',
    flaeche: 'diff',
    label: 'readback "18_000" (Unterstrich-Trenner) vs gesendet 18000 — kein JS-Number → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: '18_000' },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'averageEnergyConsumptionLast3Years' },
    why: '"18_000" ist nur als JS-Literal eine Zahl, als Laufzeit-String aber NaN → bleibt String ≠ 18000 → Abweichung (kein falsches Egalisieren von Trennzeichen)',
  },
  {
    id: 't4.r8.diff.leadingZeroNumberEqual',
    flaeche: 'diff',
    label: 'readback "00140" (führende Nullen) vs gesendet 140 — numerisch gleich',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '00140' } },
    expect: { status: 'freigegeben', blockt: false },
    why: '"00140" ist numerisch 140 — die String→Zahl-Normalisierung egalisiert führende Nullen → kein Fehlalarm',
  },

  // === ENCODING / WHITESPACE-VARIANTEN (Tab/Newline/NBSP) ====================
  {
    id: 't4.r8.diff.tabNewlineNumberEqual',
    flaeche: 'diff',
    label: 'readback "\\t140\\n" (Tab/Newline um die Zahl) vs gesendet 140 — getrimmt gleich',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '\t140\n' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'auch Tab/Newline (nicht nur Leerzeichen) sind Whitespace — getrimmt ist "\\t140\\n" numerisch 140 → kein Fehlalarm',
  },
  {
    id: 't4.r8.diff.enumNbspTrimmedEqual',
    flaeche: 'diff',
    label: "readback 'gas\\u00A0' (Non-Breaking-Space) vs gesendet 'gas' — von trim entfernt → gleich",
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { currentHeatingSystemType: 'gas' + NBSP },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'JS String.trim() entfernt auch U+00A0 — ein Enum mit angehängtem Non-Breaking-Space ist getrimmt "gas" → kein Fehlalarm (Gegenstück zu r6 mit regulärem Leerzeichen)',
  },

  // === KOMBINATION mehrerer Abweichungstypen GLEICHZEITIG ====================
  {
    id: 't4.r8.diff.derivedPlusCircuitPlusScalar',
    flaeche: 'diff',
    label: 'abgeleitet (buildingAge) + Heizkreis-Vorlauf + direkter Skalar alle falsch zugleich',
    // bauantrag_datum 2010 → payload.buildingAge='from2002'; autarc spiegelt aber from1995To2001 (Mismatch).
    formValues: { bauantrag_datum: '2010-01-01' },
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        numberOfResidents: 7, // direkter Skalar falsch
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 70, returnTemperature: 45, index: 0 }], // Vorlauf falsch
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfResidents' },
    why: 'mehrere Abweichungstypen (abgeleitet + Heizkreis + direkt) zugleich müssen ALLE als Abweichung erfasst werden und blocken — kein Typ darf einen anderen maskieren',
  },

  // === HEIZKREIS-MEHRFACH-MISMATCH am SELBEN Kreis ===========================
  {
    id: 't4.r8.diff.circuitFlowAndReturnBothWrong',
    flaeche: 'diff',
    label: 'Heizkreis index 1: Vorlauf (55→70) UND Rücklauf (45→30) zugleich falsch → zwei Einträge',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 70, returnTemperature: 30, index: 1 }],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits[1].returnTemperature' },
    why: 'sind Vor- UND Rücklauf desselben Kreises falsch, müssen BEIDE als getrennte Abweichung erscheinen — der Rücklauf-Mismatch darf nicht hinter dem Vorlauf verschwinden',
  },

  // === MELDUNGS-PRÄZISION: fehlt + abweichung gemischt in den ersten Feldern ==
  {
    id: 't4.r8.meldung.fehltUndAbweichungGemischt',
    flaeche: 'meldung',
    label: 'erstes Feld fehlt (buildingType=null) + zweites weicht ab (heatedLivingAreaM2) → beide konkret',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { buildingType: null, heatedLivingAreaM2: 999 },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'nicht angekommen' },
    why: 'eine „fehlt"-Abweichung (buildingType nicht angekommen) gemischt mit einer Werte-Abweichung muss konkret als „nicht angekommen" benannt werden — die Mischung darf die Klartext-Meldung nicht verwischen',
  },

  // === POLL-GRENZFÄLLE ========================================================
  {
    id: 't4.r8.status.heatLoadAppearsMidWindow',
    flaeche: 'status',
    label: 'Heizlast erscheint in der Mitte des Poll-Fensters (afterReads=2, attempts=3)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, heatLoadAppearsAfterReads: 2 },
    expect: { status: 'freigegeben', blockt: false },
    why: 'eine Heizlast, die mitten im Poll-Fenster (3. read) auftaucht, muss als freigegeben gelten — das Poll-Fenster wird vollständig genutzt, nicht nur der erste/letzte Versuch',
  },
  {
    id: 't4.r8.status.heatLoadNegativeThenPositiveInPoll',
    flaeche: 'status',
    label: 'erster readback Heizlast negativ, danach positiv im Poll-Fenster → freigegeben',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    // Erster GET liefert -2 (über heatLoadAppearsAfterReads wird kw=0 erzwungen,
    // ist ebenfalls <=0); ab read 2 kommt der echte positive Wert aus fullProject.
    autarcMock: {
      project: fullProject({ buildingHeatLoadKw: 8.4 }),
      rooms: oneRoom,
      heatLoadAppearsAfterReads: 1,
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'ist die Heizlast beim ersten read noch nicht da (<=0), der Poll holt aber kurz darauf den positiven Wert → freigegeben (der nicht-positive Erstwert darf nicht final werden)',
  },

  // === EXOTISCHE HTTP-CODES an je anderem Call ===============================
  {
    id: 't4.r8.panne.patch502',
    flaeche: 'panne',
    label: 'PATCH liefert HTTP 502 (Bad Gateway)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { patch: 502 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'ein Gateway-Fehler (502) beim Schreiben ist eine Panne — nichts ist bestätigt angekommen, darf nie als Erfolg gelten',
  },
  {
    id: 't4.r8.panne.getProject409',
    flaeche: 'panne',
    label: 'readback GET /projects/{id} liefert HTTP 409 (Conflict)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 409 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'ein Conflict (409) beim readback lässt den Round-Trip nicht verifizieren → fehler, nicht Erfolg/Abweichung',
  },
  {
    id: 't4.r8.panne.getRooms418',
    flaeche: 'panne',
    label: 'GET /rooms liefert HTTP 418 (I am a teapot)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getRooms: 418 } },
    expect: { status: 'fehler', blockt: true },
    why: 'jeder Non-2xx bei den Räumen (auch ein kurioser 418) macht die Vollständigkeit unprüfbar → fehler, nicht „keine Räume"',
  },
  {
    id: 't4.r8.panne.searchCustomers408',
    flaeche: 'panne',
    label: 'Fallback: GET /customers liefert HTTP 408 (Request Timeout)',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: { httpStatus: { searchCustomers: 408 } },
    expect: { status: 'fehler', blockt: true },
    why: 'ein Server-seitiger Request-Timeout (408) bei der Kundensuche ist technisch gescheitert → fehler, NICHT „kein Kunde gefunden"',
  },
  {
    id: 't4.r8.panne.getProject400',
    flaeche: 'panne',
    label: 'readback GET /projects/{id} liefert HTTP 400 (untere Grenze des Fehlerbereichs)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 400 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: '400 ist der erste „nicht ok"-Code (res.ok wird false) — die Grenze muss als Fehler greifen, kein Erfolg durch einen knapp-unter-Schwellenwert',
  },

  // === NEGATIVE / NULL-Werte je Feldtyp im readback =========================
  {
    id: 't4.r8.diff.floorsZeroMismatch',
    flaeche: 'diff',
    label: 'numberOfFloors readback 0 (gesendet 2) — 0 ist ein Wert, keine Abwesenheit → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { numberOfFloors: 0 } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfFloors' },
    why: 'autarc gibt 0 Etagen zurück, gesendet wurden 2 — 0 ist ein echter (falscher) Wert, kein „fehlt"; muss als Abweichung blocken',
  },
  {
    id: 't4.r8.diff.residentsNegativeMismatch',
    flaeche: 'diff',
    label: 'numberOfResidents readback -5 (gesendet 3) — negativer Wert → Abweichung',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { numberOfResidents: -5 } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfResidents' },
    why: 'ein negativer Bewohnerwert aus autarc weicht real von der gesendeten 3 ab → muss blocken (kein Vorzeichen-Überschlag in der Toleranz)',
  },

  // === MATCH: customers[0] mit leerer id (Contract §6: nur der erste zählt) ===
  {
    id: 't4.r8.match.firstCustomerEmptyIdNoFallthrough',
    flaeche: 'match',
    label: 'customers[0] hat leere id, ein zweiter hätte gültige — Code nimmt nur den ersten',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [
        { id: '', firstName: 'Leer', lastName: 'Mustermann' },
        { id: 'c-2', firstName: 'Max', lastName: 'Mustermann' },
      ],
      // customerId='' → /projects?customerId= liefert leere Liste → kein_projekt.
      projectsByCustomer: [],
    },
    expect: { status: 'kein_projekt', blockt: true },
    why: 'der Code nimmt bewusst customers[0] (Contract §6, keine zuverlässige Disambiguierung) — dessen leere id darf NICHT still auf den zweiten Kunden ausweichen; die Auflösung endet sauber in kein_projekt (kein Crash, kein PATCH an Geister-Kunde)',
  },
];
