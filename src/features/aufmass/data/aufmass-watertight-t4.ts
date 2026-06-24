/**
 * Wasserdicht-Loop T4 — Harness (analog `aufmass-watertight.ts`).
 *
 * Fährt jeden T4-Fall gegen den ECHTEN `autarcVerifyCore` mit einem URL-routenden
 * Mock-fetch, das die gemockte autarc-Welt des Falls (inkl. Pannen) abbildet. Urteil:
 * Status & Block-Verhalten müssen genau der Erwartung entsprechen; bei gesetztem
 * `meldungEnthaelt` muss der Substring in der DE-Meldung vorkommen.
 *
 * KEIN echter autarc-Server, kein Netz — die einzige Außenwelt ist das Mock-fetch.
 */

import { autarcVerifyCore, type VerifyConfig, type VerifyResult } from './autarc-verify-core';
import type { FetchLike } from './autarc-match';
import { VALID_BASELINE } from './aufmass-watertight';
import type { AufmassDraftData } from './aufmass-schema';
import {
  type T4Case,
  type AutarcMock,
  type AutarcEndpoint,
  type AutarcProjectMock,
} from './aufmass-watertight-t4-cases';

const BASE = 'https://api2.autarc.energy/api/v1';

/** Klassifiziert method+URL → Endpunkt-Name (analog Contract §3 mock-fetch). */
function classify(url: string, method: string): AutarcEndpoint {
  const m = method.toUpperCase();
  if (url.includes('/customers')) return 'searchCustomers';
  if (url.includes('/rooms')) return 'getRooms';
  if (/\/projects\?/.test(url) || /[?&]customerId=/.test(url)) return 'listProjects';
  if (m === 'PATCH' && /\/projects\//.test(url)) return 'patch';
  return 'getProject';
}

/** Baut aus dem Mock eines Falls ein FetchLike, das je URL die richtige Antwort liefert. */
export function mockFetchFor(c: T4Case): FetchLike {
  const world: AutarcMock = c.autarcMock;
  let projectReads = 0;

  return async (url: string, init?: RequestInit) => {
    const ep = classify(url, init?.method ?? 'GET');

    // PANNE: Netzwerk-Abbruch
    if (world.networkError?.includes(ep)) {
      throw new TypeError(`network error at ${ep}`);
    }
    // PANNE: erzwungener HTTP-Status. JEDER nicht-2xx Code wird treu an die Response
    // weitergereicht (nicht nur >=400), damit der echte Gate-Code seinen `res.ok`-
    // Check tatsächlich gegen den Status laufen lässt. Sonst würde ein erzwungener
    // 3xx-Redirect (z. B. 300/302) im Harness still zu einem 200-Body kollabieren
    // und die Panne nie beim Produktivcode ankommen — ein Harness-Loch, das eine
    // Panne fälschlich als Erfolg durchließe. `res.ok` ist nur für 200–299 true.
    const status = world.httpStatus?.[ep] ?? 200;
    if (status < 200 || status >= 300) {
      return new Response(JSON.stringify({ error: `http ${status}` }), { status });
    }
    // PANNE: kaputtes JSON
    if (world.brokenJson?.includes(ep)) {
      return new Response('{ this is : not json', { status: 200 });
    }
    // PANNE: 200 mit body=null
    if (world.nullBody?.includes(ep)) {
      return new Response('null', { status: 200 });
    }
    // PANNE: 200 mit FALSCHER Form (Objekt statt Array bzw. statt Projekt).
    if (world.wrongShape?.includes(ep)) {
      return new Response(JSON.stringify({ unexpected: 'object-instead-of-array' }), { status: 200 });
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

    // patch + getProject liefern das (ggf. modifizierte) Projekt zurück.
    // readbackEmpty: faktisch leeres Projekt (nur id) → keines der gesendeten Felder.
    const baseProject: AutarcProjectMock = world.readbackEmpty
      ? { id: 'p-1' }
      : { id: 'p-1', ...(world.project ?? {}) };
    const project: AutarcProjectMock = { ...baseProject, ...(world.readbackOverride ?? {}) };

    if (ep === 'getProject') {
      projectReads += 1;
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

/** Vollständige Formularwerte (Baseline + Fall-Overrides) für das Mapping. */
function mergedValues(c: T4Case): Partial<AufmassDraftData> {
  return { ...(VALID_BASELINE as Partial<AufmassDraftData>), ...c.formValues };
}

function cfg(fetchImpl: FetchLike): VerifyConfig {
  return {
    baseUrl: BASE,
    apiKey: 'test-key',
    fetchImpl,
    // kleines Poll-Fenster, damit verzögerte Heizlast im Test ankommt (ms=0 → kein echtes Warten)
    heatLoadPollMs: 0,
    heatLoadPollAttempts: 3,
  };
}

/** Fährt einen Fall gegen den ECHTEN autarcVerifyCore mit dem Fall-Mock. */
export async function runT4Case(c: T4Case): Promise<VerifyResult> {
  return autarcVerifyCore(
    {
      values: mergedValues(c),
      match: c.matchInput ?? { savedProjectId: 'p-1' },
    },
    cfg(mockFetchFor(c)),
  );
}

/** true = der Kern liefert für den Fall genau den erwarteten Status & Block-Verhalten. */
export async function judgedCorrectly(c: T4Case): Promise<boolean> {
  const r = await runT4Case(c);
  if (r.status !== c.expect.status) return false;
  if (r.blockt !== c.expect.blockt) return false;
  if (c.expect.meldungEnthaelt && !r.meldung.includes(c.expect.meldungEnthaelt)) return false;
  return true;
}

/** Alle Fälle, deren Urteil NICHT der Erwartung entspricht = Löcher. */
export async function findT4Holes(cases: T4Case[]): Promise<T4Case[]> {
  const holes: T4Case[] = [];
  for (const c of cases) {
    if (c.skip) continue;
    if (!(await judgedCorrectly(c))) holes.push(c);
  }
  return holes;
}
