/**
 * Wasserdicht-Loop T4 — Runde 7 (Bestätigungsrunde): NEUE, bisher nicht
 * abgedeckte gemeine Fälle.
 *
 * Über Seeds + R1 + R2 + R3 + R6 hinaus. Schwerpunkte dieser Runde — bewusst an
 * Stellen, die KEINE Vorrunde traf:
 *
 *  - PANNE mit NEUEN HTTP-Codes (bisher nur 401/404/500/503): 429 (Rate-Limit)
 *    und 403 (Forbidden) an PATCH / readback / rooms / Fallback. Jeder Non-2xx
 *    muss `fehler` & blockt werden — kein neuer Code-Pfad darf 429/403 durchlassen.
 *  - PANNE: rooms liefert kaputtes JSON (brokenJson auf getRooms; bisher dort nur
 *    nullBody/wrongShape/networkError/HTTP).
 *  - DIFF-Meldung: die „fehlt"-Variante (Feld in autarc NICHT angekommen) muss den
 *    konkreten Text „nicht angekommen" + Feldnamen liefern (bisher nur abweichung-
 *    Substrings geprüft, nie der fehlt-Wortlaut).
 *  - DIFF-Meldungs-Kürzung präzise: bei >3 Abweichungen nennt die Meldung die
 *    ERSTEN drei Felder konkret und sagt „weitere" — ein VIERTES (alphabetisch/
 *    Reihenfolge-spätes) Feld erscheint NICHT mehr im Text (Lesbarkeit bleibt
 *    konkret statt endlos).
 *  - DIFF heatingCircuits: derselbe gesendete Kreis (index 0), Vorlauf OK aber
 *    Rücklauf falsch → genau returnTemperature wird benannt (Vorlauf-OK darf den
 *    Rücklauf-Mismatch nicht maskieren). Plus: readback mit index 0 (korrekt) +
 *    mehreren EXTRA-Kreisen (index 1,2) → nur der gesendete zählt → freigegeben.
 *  - DIFF große Zahlen: sehr große exakt gleiche Zahl → ok; sehr große, deutlich
 *    abweichende Zahl → Abweichung (kein Float-Toleranz-Überschlag). Plus:
 *    wissenschaftliche Notation als String ("1.8e4") == 18000 → kein Fehlalarm.
 *  - MATCH Unicode: savedProjectId aus reinem Zero-Width-Space (U+200B). `.trim()`
 *    entfernt nur ASCII-Whitespace — eine ID aus unsichtbaren Zeichen ist FAKTISCH
 *    leer und darf NICHT als gültige autarc-ID (matched) durchgehen, sonst ginge
 *    ein PATCH an eine Geister-ID und ein kaputter Datensatz würde scheinbar
 *    „freigegeben". → muss kein_projekt sein.
 *  - MATCH: customers-Treffer, dessen NAME nicht zum gesuchten passt — der Code
 *    nimmt bewusst customers[0] (Contract §6: erstes Projekt; autarc liefert keine
 *    zuverlässige Adress-/Namens-Disambiguierung). Dokumentierter Erwartungs-Fall:
 *    Auflösung läuft durch (matched → freigegeben). KEIN Loch, sondern bestätigt
 *    das spezifizierte Verhalten.
 *  - STATUS: buildingHeatLoadKw === Infinity. `Infinity` ist zwar typeof number und
 *    > 0, aber physikalisch keine berechnete Heizlast — eine unendliche/nicht-
 *    endliche Heizlast darf NICHT als final korrekt freigegeben werden. → eingereicht.
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

export const T4_CASES_R7: T4Case[] = [
  // === PANNEN: neue HTTP-Codes (429 Rate-Limit / 403 Forbidden) =============
  {
    id: 't4.r7.panne.patch429',
    flaeche: 'panne',
    label: 'PATCH liefert HTTP 429 (Rate-Limit)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { patch: 429 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'Rate-Limit beim Schreiben ist eine Panne — nichts ist angekommen, darf nie als Erfolg gelten',
  },
  {
    id: 't4.r7.panne.getProject403',
    flaeche: 'panne',
    label: 'readback GET /projects/{id} liefert HTTP 403 (Forbidden)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getProject: 403 } },
    expect: { status: 'fehler', blockt: true, meldungEnthaelt: 'NICHT bestätigt' },
    why: 'verbotener readback (403) lässt den Round-Trip nicht verifizieren → fehler, nicht Erfolg/Abweichung',
  },
  {
    id: 't4.r7.panne.getRooms429',
    flaeche: 'panne',
    label: 'GET /rooms liefert HTTP 429',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getRooms: 429 } },
    expect: { status: 'fehler', blockt: true },
    why: 'Rate-Limit bei den Räumen → Vollständigkeit unprüfbar → fehler (nicht „keine Räume")',
  },
  {
    id: 't4.r7.panne.searchCustomers403',
    flaeche: 'panne',
    label: 'Fallback: GET /customers liefert HTTP 403',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: { httpStatus: { searchCustomers: 403 } },
    expect: { status: 'fehler', blockt: true },
    why: 'verbotene Kundensuche ist technisch gescheitert → fehler, NICHT „kein Kunde gefunden"',
  },
  {
    id: 't4.r7.panne.roomsBrokenJson',
    flaeche: 'panne',
    label: 'GET /rooms liefert 200 mit kaputtem JSON',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, brokenJson: ['getRooms'] },
    expect: { status: 'fehler', blockt: true },
    why: 'unparsebare Räume-Antwort ist kein verlässliches „0 Räume" → fehler',
  },

  // === DIFF: Meldungs-Wortlaut der „fehlt"-Variante =========================
  {
    id: 't4.r7.meldung.fehltSagtNichtAngekommen',
    flaeche: 'meldung',
    label: 'fehlt-Abweichung nennt „nicht angekommen" + Feldname',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { pipeSystemType: null } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'nicht angekommen' },
    why: 'wenn ein gesendetes Feld in autarc fehlt, muss die Meldung das als „nicht angekommen" benennen — nicht generisch',
  },

  // === DIFF: Meldungs-Kürzung präzise (4. Feld erscheint NICHT) ==============
  {
    id: 't4.r7.meldung.fourthFieldTruncated',
    flaeche: 'meldung',
    label: '>3 Abweichungen → 4. Feld (windowGlazingType) NICHT in Meldung, nur „weitere"',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      // 4 direkte Abweichungen; iteriert in payload-Reihenfolge:
      // buildingType, heatedLivingAreaM2, numberOfResidents (erste 3) + windowGlazingType (4., gekürzt).
      readbackOverride: {
        buildingType: 'multiFamilyHouse',
        heatedLivingAreaM2: 999,
        numberOfResidents: 99,
        windowGlazingType: 'single',
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'weitere' },
    why: 'die Meldung muss lesbar bleiben: erste drei konkret, Rest als „N weitere" — sie wird nicht beliebig lang',
  },

  // === DIFF heatingCircuits: Vorlauf OK, Rücklauf falsch (gleicher Kreis) ====
  {
    id: 't4.r7.diff.circuitFlowOkReturnWrong',
    flaeche: 'diff',
    label: 'Heizkreis index 1: Vorlauf korrekt (55), aber Rücklauf falsch (45→33)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 33, index: 1 }],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits[1].returnTemperature' },
    why: 'ein korrekter Vorlauf darf einen falschen Rücklauf NICHT maskieren — der Rücklauf-Mismatch muss konkret benannt werden',
  },
  {
    id: 't4.r7.diff.circuitCorrectPlusManyExtra',
    flaeche: 'diff',
    label: 'readback: gesendeter Kreis index 1 korrekt + zwei EXTRA-Kreise (index 2, 3)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [
          { name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 1 },
          { name: 'Extra A', flowTemperature: 35, returnTemperature: 28, index: 2 },
          { name: 'Extra B', flowTemperature: 30, returnTemperature: 25, index: 3 },
        ],
      },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'nur der gesendete Kreis (index 1) wird geprüft — zusätzliche autarc-Kreise sind kein Fehlersignal',
  },

  // === DIFF: sehr große Zahlen ==============================================
  {
    id: 't4.r7.diff.veryLargeNumberEqual',
    flaeche: 'diff',
    label: 'sehr große Wohnfläche exakt gleich (1234567890)',
    formValues: { beheizte_wohnflaeche_m2: 1234567890 } as Partial<import('./aufmass-schema').AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ heatedLivingAreaM2: 1234567890 }), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'eine sehr große, exakt gespiegelte Zahl ist keine Abweichung — die Float-Toleranz darf hier nicht greifen müssen',
  },
  {
    id: 't4.r7.diff.veryLargeNumberMismatch',
    flaeche: 'diff',
    label: 'sehr große Wohnfläche deutlich abweichend (1234567890 → 1234567000)',
    formValues: { beheizte_wohnflaeche_m2: 1234567890 } as Partial<import('./aufmass-schema').AufmassDraftData>,
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ heatedLivingAreaM2: 1234567000 }), rooms: oneRoom },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'eine echte Differenz bei großen Zahlen (890 m²) muss trotz Größenordnung als Abweichung erkannt werden',
  },
  {
    id: 't4.r7.diff.scientificNotationStringEqual',
    flaeche: 'diff',
    label: 'readback "1.8e4" (wissenschaftliche Notation als String) vs gesendet 18000',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: '1.8e4' },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: '"1.8e4" ist numerisch 18000 — die String→Zahl-Normalisierung muss auch e-Notation egalisieren, kein Fehlalarm',
  },

  // === MATCH: Unicode / unsichtbare ID =====================================
  {
    id: 't4.r7.match.zeroWidthSpaceId',
    flaeche: 'match',
    label: 'savedProjectId besteht nur aus Zero-Width-Space (U+200B) + kein Kundenname',
    formValues: {},
    matchInput: { savedProjectId: ZWSP + ZWSP, customerName: null },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'verknüpf' },
    why: 'eine ID aus unsichtbaren Unicode-Zeichen ist faktisch leer — darf nicht als gültige autarc-ID gelten (sonst PATCH an eine Geister-ID und Schein-Freigabe)',
  },
  {
    id: 't4.r7.match.zeroWidthSpaceIdFallback',
    flaeche: 'match',
    label: 'savedProjectId nur Zero-Width-Space, aber Kundenname vorhanden → Fallback greift',
    formValues: {},
    matchInput: { savedProjectId: ZWSP, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: fullProject(),
      rooms: oneRoom,
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'eine unsichtbare ID muss als ungültig verworfen werden, damit der Fallback (Kundensuche) sauber übernimmt — nicht an der Geister-ID hängenbleiben',
  },
  {
    id: 't4.r7.match.customerNameMismatchPicksFirst',
    flaeche: 'match',
    label: 'customers-Treffer mit unpassendem Namen — Code nimmt bewusst den ersten (Contract §6)',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Schmidt' },
    autarcMock: {
      // autarc-Suche liefert einen Kunden, dessen Name NICHT „Schmidt" ist.
      customers: [{ id: 'c-9', firstName: 'Anna', lastName: 'Ganzanders' }],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: fullProject(),
      rooms: oneRoom,
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'dokumentiertes Verhalten (Contract §6): es gibt keine zuverlässige Namens-Disambiguierung — der erste Treffer wird genommen, die Auflösung läuft durch (kein Loch, sondern Spec-Bestätigung)',
  },

  // === STATUS: nicht-endliche Heizlast ======================================
  {
    id: 't4.r7.status.heatLoadInfinity',
    flaeche: 'status',
    label: 'Heizlast = Infinity (typeof number, > 0, aber nicht endlich)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { buildingHeatLoadKw: Number.POSITIVE_INFINITY },
    },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'eine unendliche Heizlast ist keine plausible berechnete Heizlast — sie darf nicht als final korrekt freigegeben werden (nur endliche > 0 zählt)',
  },
];
