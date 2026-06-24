/**
 * Wasserdicht-Loop T4 — Fall-Katalog für das autarc-Validierungs-Gate.
 *
 * Jeder Fall ist eine Kombination aus (teils gemeinen) Formularwerten + einer
 * gemockten autarc-Welt (inkl. Pannen). Der Test fährt ihn gegen den ECHTEN
 * `autarcVerifyCore` mit einem URL-routenden Mock-fetch und prüft das Urteil:
 *  - blockt/meldet er jeden Fehlerfall konkret?
 *  - lässt er NUR echt valide durch (`freigegeben`, blockt=false)?
 *
 * Invariante (im Loop hart getestet): jede Panne (HTTP/JSON/Timeout/Netz) endet in
 * `fehler` & blockt — „kein Fehler je als Erfolg". `freigegeben` ist der EINZIGE
 * nicht-blockende Zustand. Jeder Nicht-`freigegeben`-Zustand liefert eine konkrete
 * DE-Meldung (Substring-Garantie via `meldungEnthaelt`).
 */

import type { AufmassDraftData } from './aufmass-schema';
import type { AutarcMatchInput } from './autarc-match';
import type { AutarcSyncStatus } from './autarc-gate';
import { T4_CASES_R1 } from './aufmass-watertight-t4-cases.r1';
import { T4_CASES_R2 } from './aufmass-watertight-t4-cases.r2';
import { T4_CASES_R3 } from './aufmass-watertight-t4-cases.r3';
import { T4_CASES_R6 } from './aufmass-watertight-t4-cases.r6';
import { T4_CASES_R7 } from './aufmass-watertight-t4-cases.r7';
import { T4_CASES_R8 } from './aufmass-watertight-t4-cases.r8';
import { T4_CASES_R9 } from './aufmass-watertight-t4-cases.r9';
import { T4_CASES_R10 } from './aufmass-watertight-t4-cases.r10';
import { T4_CASES_R11 } from './aufmass-watertight-t4-cases.r11';

/** Zurückgelesenes Projekt (GET /projects/{id}) — gesendete + computed Felder. */
export interface AutarcProjectMock {
  id: string;
  humanId?: string;
  // gesendete (Auszug; "200" als String möglich → Diff egalisiert):
  buildingType?: string;
  heatedLivingAreaM2?: number | string;
  numberOfResidents?: number;
  numberOfFloors?: number;
  isMonumentProtected?: boolean;
  averageEnergyConsumptionLast3Years?: number;
  isFacadeInsulated?: boolean;
  isRoofInsulated?: boolean;
  pipeSystemType?: string;
  windowGlazingType?: string;
  hasFireplace?: boolean;
  hasSolarThermalSystem?: boolean;
  currentHeatingSystemType?: string;
  roomHeatingType?: string;
  buildingAge?: string;
  currentHeatingSystemConstructionYear?: string;
  drinkingWaterHeatingSystemType?: string;
  heatingCircuits?: Array<{
    name?: string;
    flowTemperature: number;
    returnTemperature: number;
    index: number;
  }>;
  // computed (NIE vergleichen):
  buildingHeatLoadKw?: number | null;
  technicalFeasibilityAssesment?: unknown;
  heatPumpSizing?: { heatPumpStandardOutputKw?: number; bivalencePoint?: number } | null;
  [k: string]: unknown;
}

export interface AutarcRoomMock {
  id: string;
  name: string;
  floor?: string;
  temperature?: number | null;
}

export interface AutarcCustomerMock {
  id: string;
  firstName: string;
  lastName: string;
}

export type AutarcEndpoint =
  | 'patch'
  | 'getProject'
  | 'getRooms'
  | 'searchCustomers'
  | 'listProjects';

/** Gemockte autarc-Welt für einen Fall + Pannen-Schalter. */
export interface AutarcMock {
  /** Antwort auf GET /customers?search= (Fallback-Auflösung). */
  customers?: AutarcCustomerMock[];
  /** Antwort auf GET /projects?customerId= (Fallback). */
  projectsByCustomer?: Array<{ id: string; humanId?: string }>;
  /** Das via PATCH/GET gehandhabte Projekt. readback nach PATCH. */
  project?: AutarcProjectMock;
  /** readback-Overrides: spiegeln absichtlich abweichende Werte zurück. */
  readbackOverride?: Record<string, unknown>;
  /** Antwort auf GET /projects/{id}/rooms. */
  rooms?: AutarcRoomMock[];
  /** PANNEN: erzwinge HTTP-Status pro Endpunkt (statt 200). */
  httpStatus?: Partial<Record<AutarcEndpoint, number>>;
  /** PANNE: liefere kaputtes JSON bei genanntem Endpunkt. */
  brokenJson?: AutarcEndpoint[];
  /** PANNE: simuliere Netzwerk-Abbruch (fetch wirft) bei genanntem Endpunkt. */
  networkError?: AutarcEndpoint[];
  /**
   * PANNE: liefere 200 mit FALSCHER Form (Objekt statt erwartetem Array) am
   * genannten Endpunkt. Trifft list-/array-Endpunkte (rooms/customers/listProjects).
   * Bei getProject/patch wird statt des Projekts ein nacktes `{}`-Objekt geliefert.
   */
  wrongShape?: AutarcEndpoint[];
  /** PANNE: liefere 200 mit body `null` am genannten Endpunkt. */
  nullBody?: AutarcEndpoint[];
  /** PANNE/Match: readback ist ein faktisch leeres Projekt (nur `id`) → kein gesendetes Feld. */
  readbackEmpty?: boolean;
  /** Verzögerte Heizlast: erste N getProject-reads liefern 0, danach Wert (Poll §9). */
  heatLoadAppearsAfterReads?: number;
}

export interface T4Case {
  /** Stabile ID, z. B. 't4.diff.areaMismatch'. */
  id: string;
  /** Angriffsfläche. */
  flaeche: 'mapping' | 'diff' | 'match' | 'status' | 'meldung' | 'panne';
  label: string;
  /** Partielle Formularwerte (werden über VALID_BASELINE gemergt → mapAufmassToAutarc). */
  formValues: Partial<AufmassDraftData>;
  /** Match-Input (savedProjectId/customerName) für den Fall. */
  matchInput?: AutarcMatchInput;
  /** Gemockte autarc-Welt inkl. Pannen. */
  autarcMock: AutarcMock;
  /** Erwartetes Urteil. */
  expect: {
    status: AutarcSyncStatus;
    blockt: boolean;
    /** Substring, der in der DE-Meldung vorkommen MUSS (Konkretheits-Garantie). */
    meldungEnthaelt?: string;
  };
  why: string;
  /** Bewusst übersprungen (mit Begründung) — analog WatertightCase.skip. */
  skip?: string;
}

/**
 * Vollständig korrektes, vom Mapping erzeugtes Mock-Projekt (spiegelt die
 * VALID_BASELINE-Werte exakt + computed Heizlast > 0). Per Override anpassbar.
 */
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

/** Pflicht-Seed-Fälle (Contract §4). */
const T4_SEED_CASES: T4Case[] = [
  // --- Happy ---------------------------------------------------------------
  {
    id: 't4.happy.freigegeben',
    flaeche: 'status',
    label: 'alles korrekt: diff ok, rooms>0, heizlast>0',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom },
    expect: { status: 'freigegeben', blockt: false },
    why: 'echt valider Round-Trip muss durchgelassen werden — der einzige Erfolg',
  },

  // --- Diff ----------------------------------------------------------------
  {
    id: 't4.diff.areaMismatch',
    flaeche: 'diff',
    label: 'readback heatedLivingAreaM2 abweichend (140 → 999)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: 999 } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatedLivingAreaM2' },
    why: 'gesendet ≠ zurückgelesen → muss blocken mit Feld in der Meldung',
  },
  {
    id: 't4.diff.stringNumberEqual',
    flaeche: 'diff',
    label: 'readback "140" (String) vs gesendet 140 (Zahl)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { heatedLivingAreaM2: '140' } },
    expect: { status: 'freigegeben', blockt: false },
    why: 'numerischer String darf KEIN Fehlalarm sein',
  },
  {
    id: 't4.diff.circuitFlowMismatch',
    flaeche: 'diff',
    label: 'heatingCircuits flowTemperature abweichend (55 → 70)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: {
        heatingCircuits: [{ name: 'Heizkreis 1', flowTemperature: 70, returnTemperature: 45, index: 0 }],
      },
    },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'heatingCircuits' },
    why: 'Heizkreis-Vorlauf strukturell pro Index vergleichen — Abweichung muss blocken',
  },
  {
    id: 't4.diff.enumMismatch',
    flaeche: 'diff',
    label: 'readback buildingType anderer Enum-Wert',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { buildingType: 'multiFamilyHouse' } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'buildingType' },
    why: 'Enums exakt vergleichen — andere Schreibweise = Abweichung',
  },
  {
    id: 't4.diff.boolMismatch',
    flaeche: 'diff',
    label: 'readback isFacadeInsulated true → false',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { isFacadeInsulated: false } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'isFacadeInsulated' },
    why: 'Booleans exakt — true ≠ false ist Abweichung',
  },
  {
    id: 't4.diff.floatWithinTolerance',
    flaeche: 'diff',
    label: 'readback Verbrauch minimal anders (18000 → 18000.005)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { averageEnergyConsumptionLast3Years: 18000.005 },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'innerhalb Float-Toleranz → kein Fehlalarm',
  },
  {
    id: 't4.diff.computedIgnored',
    flaeche: 'diff',
    label: 'computed technicalFeasibilityAssesment abweichend ist egal',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: {
      project: fullProject(),
      rooms: oneRoom,
      readbackOverride: { technicalFeasibilityAssesment: 'ganz-anders', heatPumpSizing: { heatPumpStandardOutputKw: 12 } },
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'computed Felder werden nie verglichen — kein Fehlalarm',
  },

  // --- Vollständigkeit / Status -------------------------------------------
  {
    id: 't4.complete.noRooms',
    flaeche: 'status',
    label: 'autarc hat noch keine Räume (rooms=[])',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: [] },
    expect: { status: 'unvollstaendig', blockt: true, meldungEnthaelt: 'Räume' },
    why: 'ohne gescannte Räume ist autarc nicht vollständig → blocken',
  },
  {
    id: 't4.complete.heatLoadZero',
    flaeche: 'status',
    label: 'Heizlast noch 0',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: 0 }), rooms: oneRoom },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'Round-Trip grün, aber Heizlast fehlt → eingereicht (blockt), nicht freigegeben',
  },
  {
    id: 't4.complete.heatLoadNull',
    flaeche: 'status',
    label: 'Heizlast fehlt komplett (null)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject({ buildingHeatLoadKw: null }), rooms: oneRoom },
    expect: { status: 'eingereicht', blockt: true, meldungEnthaelt: 'Heizlast' },
    why: 'null-Heizlast darf nicht als Erfolg durchgehen',
  },
  {
    id: 't4.complete.heatLoadDelayed',
    flaeche: 'status',
    label: 'Heizlast erscheint nach 1 Poll',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, heatLoadAppearsAfterReads: 1 },
    expect: { status: 'freigegeben', blockt: false },
    why: 'verzögerte Heizlast taucht im Poll-Fenster auf → freigegeben',
  },

  // --- Match ---------------------------------------------------------------
  {
    id: 't4.match.noId.noCustomer',
    flaeche: 'match',
    label: 'keine ID, keine Kunden gefunden',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Niemand' },
    autarcMock: { customers: [] },
    expect: { status: 'kein_projekt', blockt: true, meldungEnthaelt: 'verknüpf' },
    why: 'kein autarc-Projekt auflösbar → sichtbarer Hinweis, kein stiller Fehlschlag',
  },
  {
    id: 't4.match.fallbackOk',
    flaeche: 'match',
    label: 'keine gespeicherte ID, Kunde+Projekt via Fallback gefunden',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: fullProject(),
      rooms: oneRoom,
    },
    expect: { status: 'freigegeben', blockt: false },
    why: 'Fallback-Auflösung muss bis zum Erfolg durchlaufen',
  },
  {
    id: 't4.match.customerNoProject',
    flaeche: 'match',
    label: 'Kunde gefunden, aber kein Projekt',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      projectsByCustomer: [],
    },
    expect: { status: 'kein_projekt', blockt: true },
    why: 'Kunde ohne Projekt → kein_projekt (kein PATCH, kein Erfolg)',
  },

  // --- Pannen (kein Fehler je als Erfolg) ----------------------------------
  {
    id: 't4.panne.patch500',
    flaeche: 'panne',
    label: 'PATCH liefert HTTP 500',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { patch: 500 } },
    expect: { status: 'fehler', blockt: true },
    why: 'Server-Fehler beim Schreiben darf nie als Erfolg gelten',
  },
  {
    id: 't4.panne.getProjectTimeout',
    flaeche: 'panne',
    label: 'GET /projects timeout (Netzwerk-Abbruch)',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, networkError: ['getProject'] },
    expect: { status: 'fehler', blockt: true },
    why: 'readback unmöglich → Korrektheit nicht prüfbar → fehler',
  },
  {
    id: 't4.panne.brokenJson',
    flaeche: 'panne',
    label: 'GET /projects liefert kaputtes JSON',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, brokenJson: ['getProject'] },
    expect: { status: 'fehler', blockt: true },
    why: 'unparsebare Antwort = kein verlässliches Signal → fehler',
  },
  {
    id: 't4.panne.getRooms503',
    flaeche: 'panne',
    label: 'GET /rooms liefert 503',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, httpStatus: { getRooms: 503 } },
    expect: { status: 'fehler', blockt: true },
    why: 'Vollständigkeit nicht prüfbar → kein Erfolg',
  },
  {
    id: 't4.panne.searchCustomers500',
    flaeche: 'panne',
    label: 'Fallback: GET /customers liefert 500',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: { httpStatus: { searchCustomers: 500 } },
    expect: { status: 'fehler', blockt: true },
    why: 'Match-Auflösung scheitert technisch → fehler, nicht kein_projekt',
  },
  {
    id: 't4.panne.listProjects500',
    flaeche: 'panne',
    label: 'Fallback: GET /projects?customerId liefert 500',
    formValues: {},
    matchInput: { savedProjectId: null, customerName: 'Mustermann' },
    autarcMock: {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      httpStatus: { listProjects: 500 },
    },
    expect: { status: 'fehler', blockt: true },
    why: 'Projekt-Liste scheitert technisch → fehler',
  },

  // --- Meldung (Konkretheit) ----------------------------------------------
  {
    id: 't4.meldung.unvollstaendigKonkret',
    flaeche: 'meldung',
    label: 'unvollständig nennt konkret die Räume',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: [] },
    expect: { status: 'unvollstaendig', blockt: true, meldungEnthaelt: 'Räume' },
    why: 'Meldung muss handlungsfähig sein (nicht generisch „Fehler")',
  },
  {
    id: 't4.meldung.abweichungNenntFeld',
    flaeche: 'meldung',
    label: 'Abweichungs-Meldung nennt das konkrete Feld',
    formValues: {},
    matchInput: { savedProjectId: 'p-1' },
    autarcMock: { project: fullProject(), rooms: oneRoom, readbackOverride: { numberOfFloors: 9 } },
    expect: { status: 'abweichung', blockt: true, meldungEnthaelt: 'numberOfFloors' },
    why: 'die Differenz muss das Feld benennen, damit der Techniker korrigieren kann',
  },
];

/**
 * Gesamter T4-Fall-Katalog: Pflicht-Seeds (Contract §4) + die je Runde
 * enumerierten neuen Fälle (R1 …). Analog zu `WATERTIGHT_CASES`.
 */
export const T4_CASES: T4Case[] = [
  ...T4_SEED_CASES,
  ...T4_CASES_R1,
  ...T4_CASES_R2,
  ...T4_CASES_R3,
  ...T4_CASES_R6,
  ...T4_CASES_R7,
  ...T4_CASES_R8,
  ...T4_CASES_R9,
  ...T4_CASES_R10,
  ...T4_CASES_R11,
];
