import { describe, it, expect } from 'vitest';
import { autarcVerifyCore, type VerifyConfig, type VerifyInput } from './autarc-verify-core';
import type { FetchLike } from './autarc-match';
import { VALID_BASELINE } from './aufmass-watertight';
import type { AufmassDraftData } from './aufmass-schema';

/**
 * Integrationstest des Kerns gegen ein INJIZIERTES Mock-fetch (Contract §3).
 * Faehrt den ganzen Gate-Flow: match -> PATCH -> readback -> diff -> rooms -> heizlast.
 * Deckt happy path (freigegeben) UND alle Pannen ab:
 *   abweichung / unvollstaendig / kein_projekt / fehler.
 * KEIN echter autarc-Call, kein Netz — die einzige Aussenwelt ist cfg.fetchImpl.
 */

const BASE = 'https://api2.autarc.energy/api/v1';

interface AutarcProjectShape {
  id: string;
  humanId?: string;
  [k: string]: unknown;
}

interface MockWorld {
  /** Das via PATCH/GET gehandhabte Projekt (readback nach PATCH). */
  project?: AutarcProjectShape;
  /** Antwort auf GET /projects/{id}/rooms. */
  rooms?: Array<{ id: string; name: string }>;
  /** Antwort auf GET /customers?search=. */
  customers?: Array<{ id: string; firstName: string; lastName: string }>;
  /** Antwort auf GET /projects?customerId=. */
  projectsByCustomer?: Array<{ id: string; humanId?: string }>;
  /** Wenn gesetzt, liefert das PATCH-readback fuer diese Felder absichtlich andere Werte. */
  readbackOverride?: Record<string, unknown>;
  /** PANNEN: erzwinge HTTP-Status pro Endpunkt. */
  httpStatus?: Partial<
    Record<'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects', number>
  >;
  /** PANNE: kaputtes JSON bei genanntem Endpunkt. */
  brokenJson?: Array<'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects'>;
  /** PANNE: fetch wirft bei genanntem Endpunkt. */
  networkError?: Array<'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects'>;
  /** Verzoegerte Heizlast: erste N getProject-reads liefern 0, danach den echten Wert. */
  heatLoadAppearsAfterReads?: number;
  /** PANNE: getProject liefert 200 mit einem Objekt OHNE id (kein Projekt). */
  getProjectNoId?: boolean;
}

type Endpoint = 'patch' | 'getProject' | 'getRooms' | 'searchCustomers' | 'listProjects';

/** Klassifiziert method+URL -> Endpunkt-Name (analog Contract §3 mock-fetch). */
function classify(url: string, method: string): Endpoint {
  const m = method.toUpperCase();
  if (url.includes('/customers')) return 'searchCustomers';
  if (url.includes('/rooms')) return 'getRooms';
  if (/\/projects\?/.test(url) || /[?&]customerId=/.test(url)) return 'listProjects';
  if (m === 'PATCH' && /\/projects\//.test(url)) return 'patch';
  return 'getProject';
}

/** Baut ein URL-routendes Mock-fetch fuer eine Mock-Welt (inkl. Pannen-Schalter). */
function mockFetchFor(world: MockWorld): FetchLike {
  let projectReads = 0;
  return async (url: string, init?: RequestInit) => {
    const ep = classify(url, init?.method ?? 'GET');

    if (world.networkError?.includes(ep)) {
      throw new TypeError(`network error at ${ep}`);
    }

    const status = world.httpStatus?.[ep] ?? 200;
    if (status >= 400) {
      return new Response(JSON.stringify({ error: `http ${status}` }), { status });
    }
    if (world.brokenJson?.includes(ep)) {
      return new Response('{ this is : not json', { status: 200 });
    }

    if (ep === 'searchCustomers') {
      return new Response(JSON.stringify(world.customers ?? []), { status: 200 });
    }
    if (ep === 'listProjects') {
      return new Response(JSON.stringify(world.projectsByCustomer ?? []), { status: 200 });
    }
    if (ep === 'getRooms') {
      return new Response(JSON.stringify(world.rooms ?? []), { status: 200 });
    }

    // patch + getProject liefern das (ggf. modifizierte) Projekt zurueck
    const baseProject: AutarcProjectShape = { id: 'p-1', ...(world.project ?? {}) };
    const project: AutarcProjectShape = { ...baseProject, ...(world.readbackOverride ?? {}) };

    if (ep === 'getProject') {
      projectReads += 1;
      if (world.getProjectNoId) {
        return new Response(JSON.stringify({ unexpected: 'kein-projekt-objekt' }), { status: 200 });
      }
      if (
        world.heatLoadAppearsAfterReads != null &&
        projectReads <= world.heatLoadAppearsAfterReads
      ) {
        return new Response(JSON.stringify({ ...project, buildingHeatLoadKw: 0 }), { status: 200 });
      }
    }
    return new Response(JSON.stringify(project), { status: 200 });
  };
}

/** Vollstaendig gueltige Formularwerte (Baseline der Wasserdicht-Suite). */
function happyValues(): Partial<AufmassDraftData> {
  return { ...(VALID_BASELINE as Partial<AufmassDraftData>) };
}

/** Mock-Projekt, das den gesendeten Payload exakt zurueckspiegelt + computed Heizlast. */
function happyProject(): AutarcProjectShape {
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
  };
}

function cfg(fetchImpl: FetchLike, extra?: Partial<VerifyConfig>): VerifyConfig {
  return {
    baseUrl: BASE,
    apiKey: 'test-key',
    fetchImpl,
    heatLoadPollMs: 0,
    heatLoadPollAttempts: 0,
    ...extra,
  };
}

function input(world?: { savedProjectId?: string | null; customerName?: string | null }, values?: Partial<AufmassDraftData>): VerifyInput {
  return {
    values: values ?? happyValues(),
    match: {
      savedProjectId: world?.savedProjectId ?? 'p-1',
      customerName: world?.customerName ?? 'Mustermann',
    },
  };
}

describe('autarcVerifyCore — Happy Path', () => {
  it('alles gruen (diff ok, rooms>0, heizlast>0) -> freigegeben & blockt=false', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'Wohnzimmer' }],
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('freigegeben');
    expect(r.blockt).toBe(false);
    expect(r.projectId).toBe('p-1');
    expect(r.syncedAt).toBeTruthy();
    expect(typeof r.sentPayload).toBe('object');
  });

  it('gibt den tatsaechlich gesendeten Payload zurueck (sentPayload)', async () => {
    const world: MockWorld = { project: happyProject(), rooms: [{ id: 'r1', name: 'WZ' }] };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.sentPayload.buildingType).toBe('singleOrDoubleFamilyHouse');
    expect(r.sentPayload.heatedLivingAreaM2).toBe(140);
    // technicalFeasibilityAssesment darf NIE gesendet werden (Spec §7)
    expect(r.sentPayload).not.toHaveProperty('technicalFeasibilityAssesment');
  });
});

describe('autarcVerifyCore — Abweichung', () => {
  it('readback weicht bei heatedLivingAreaM2 ab -> abweichung & blockt mit Liste', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      readbackOverride: { heatedLivingAreaM2: 999 },
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('abweichung');
    expect(r.blockt).toBe(true);
    expect(r.abweichungen?.some((a) => a.feld === 'heatedLivingAreaM2')).toBe(true);
  });

  it('"140" als String zurueck ist KEIN Fehlalarm -> bleibt freigegeben', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      readbackOverride: { heatedLivingAreaM2: '140' },
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('freigegeben');
    expect(r.blockt).toBe(false);
  });
});

describe('autarcVerifyCore — Vollstaendigkeit', () => {
  it('keine Raeume (rooms=[]) -> unvollstaendig & blockt, Meldung nennt Raeume', async () => {
    const world: MockWorld = { project: happyProject(), rooms: [] };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('unvollstaendig');
    expect(r.blockt).toBe(true);
    expect(r.meldung).toMatch(/[Rr]äume/);
  });

  it('Heizlast 0 -> eingereicht & blockt', async () => {
    const world: MockWorld = {
      project: { ...happyProject(), buildingHeatLoadKw: 0 },
      rooms: [{ id: 'r1', name: 'WZ' }],
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('eingereicht');
    expect(r.blockt).toBe(true);
  });

  it('verzoegerte Heizlast taucht nach Poll auf -> freigegeben', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      heatLoadAppearsAfterReads: 1,
    };
    const r = await autarcVerifyCore(
      input(),
      cfg(mockFetchFor(world), { heatLoadPollMs: 1, heatLoadPollAttempts: 3 }),
    );
    expect(r.status).toBe('freigegeben');
    expect(r.blockt).toBe(false);
  });
});

describe('autarcVerifyCore — kein Projekt', () => {
  it('keine ID, keine Kunden -> kein_projekt & blockt, kein PATCH', async () => {
    const world: MockWorld = { customers: [] };
    const r = await autarcVerifyCore(
      input({ savedProjectId: null, customerName: 'Niemand' }),
      cfg(mockFetchFor(world)),
    );
    expect(r.status).toBe('kein_projekt');
    expect(r.blockt).toBe(true);
    expect(r.projectId).toBeNull();
    expect(r.meldung).toBeTruthy();
  });
});

describe('autarcVerifyCore — Pannen enden NIE als Erfolg (Invariante)', () => {
  it('PATCH 500 -> fehler & blockt', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      httpStatus: { patch: 500 },
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  });

  it('getProject Timeout (networkError) -> fehler & blockt', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      networkError: ['getProject'],
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  });

  it('kaputtes JSON beim readback -> fehler & blockt (nie freigegeben)', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      brokenJson: ['getProject'],
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  });

  it('getProject 200 ohne id (kein Projekt-Objekt) -> fehler & blockt (nicht kein_projekt)', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      getProjectNoId: true,
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    // Ein strukturell kaputtes readback ist eine Panne, kein sauberes Sachurteil.
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  });

  it('getRooms 503 -> fehler & blockt (Vollstaendigkeit nicht pruefbar = kein Erfolg)', async () => {
    const world: MockWorld = {
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
      httpStatus: { getRooms: 503 },
    };
    const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  });

  it('KEINE Panne fuehrt zu blockt=false ausser dem echten Happy Path', async () => {
    const pannen: MockWorld[] = [
      { project: happyProject(), rooms: [{ id: 'r1', name: 'WZ' }], httpStatus: { patch: 500 } },
      { project: happyProject(), rooms: [{ id: 'r1', name: 'WZ' }], networkError: ['getProject'] },
      { project: happyProject(), rooms: [{ id: 'r1', name: 'WZ' }], brokenJson: ['getProject'] },
    ];
    for (const world of pannen) {
      const r = await autarcVerifyCore(input(), cfg(mockFetchFor(world)));
      expect(r.blockt).toBe(true);
      expect(r.status).not.toBe('freigegeben');
    }
  });
});

describe('autarcVerifyCore — Fallback-Match feeds in den Flow', () => {
  it('keine gespeicherte ID, aber Kunde+Projekt gefunden -> Flow laeuft bis freigegeben', async () => {
    const world: MockWorld = {
      customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
      projectsByCustomer: [{ id: 'p-1', humanId: 'AT-1001' }],
      project: happyProject(),
      rooms: [{ id: 'r1', name: 'WZ' }],
    };
    const r = await autarcVerifyCore(
      input({ savedProjectId: null, customerName: 'Mustermann' }),
      cfg(mockFetchFor(world)),
    );
    expect(r.status).toBe('freigegeben');
    expect(r.projectId).toBe('p-1');
  });
});
