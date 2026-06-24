import { describe, it, expect } from 'vitest';
import {
  resolveAutarcProject,
  type FetchLike,
  type AutarcClientConfig,
  type AutarcMatchInput,
} from './autarc-match';

/**
 * Unit-Tests Projekt-Matching/Fallback (Spec §6, Contract §2 autarc-match.ts).
 * Primaer: gespeicherte ID. Fallback: customers?search -> projects?customerId.
 * Kein Treffer -> kein_projekt (sichtbarer Hinweis). Netz/HTTP-Panne -> fehler.
 * Alles ueber injizierbares fetch — KEIN echter autarc-Call.
 */

const BASE = 'https://api2.autarc.energy/api/v1';

interface Recorded {
  url: string;
  method: string;
}

/** Baut ein Mock-fetch, das je URL-Pfad eine JSON-Antwort liefert, und protokolliert Aufrufe. */
function makeFetch(
  handlers: {
    customers?: unknown;
    projectsByCustomer?: unknown;
    customersStatus?: number;
    projectsStatus?: number;
    throwOn?: 'customers' | 'projects';
  },
  recorded: Recorded[],
): FetchLike {
  return async (url: string, init?: RequestInit) => {
    recorded.push({ url, method: init?.method ?? 'GET' });
    const isCustomers = url.includes('/customers');
    const isProjects = url.includes('/projects');

    if (handlers.throwOn === 'customers' && isCustomers) {
      throw new TypeError('network down');
    }
    if (handlers.throwOn === 'projects' && isProjects && !isCustomers) {
      throw new TypeError('network down');
    }

    if (isCustomers) {
      const status = handlers.customersStatus ?? 200;
      return new Response(JSON.stringify(handlers.customers ?? []), { status });
    }
    if (isProjects) {
      const status = handlers.projectsStatus ?? 200;
      return new Response(JSON.stringify(handlers.projectsByCustomer ?? []), { status });
    }
    return new Response('null', { status: 200 });
  };
}

function cfg(fetchImpl: FetchLike): AutarcClientConfig {
  return { baseUrl: BASE, apiKey: 'test-key', fetchImpl };
}

describe('resolveAutarcProject — primaer gespeicherte ID', () => {
  it('nutzt savedProjectId ohne Netz-Call (source=saved)', async () => {
    const recorded: Recorded[] = [];
    const input: AutarcMatchInput = { savedProjectId: 'p-saved-1', customerName: 'Mustermann' };
    const result = await resolveAutarcProject(input, cfg(makeFetch({}, recorded)));

    expect(result.status).toBe('matched');
    expect(result.projectId).toBe('p-saved-1');
    expect(result.source).toBe('saved');
    expect(recorded.length).toBe(0);
  });
});

describe('resolveAutarcProject — ungueltige savedProjectId zaehlt nicht als matched', () => {
  it('whitespace-only savedProjectId faellt auf den Fallback durch', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      {
        customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
        projectsByCustomer: [{ id: 'p-fb-1' }],
      },
      recorded,
    );
    const result = await resolveAutarcProject(
      { savedProjectId: '   ', customerName: 'Mustermann' },
      cfg(fetchImpl),
    );
    // whitespace-ID darf NICHT als matched gelten -> es wird der Fallback gegangen.
    expect(result.source).toBe('fallback');
    expect(result.projectId).toBe('p-fb-1');
    expect(recorded.length).toBeGreaterThan(0);
  });

  it('leerer-String savedProjectId ohne Name -> kein_projekt', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch({}, recorded);
    const result = await resolveAutarcProject(
      { savedProjectId: '', customerName: '' },
      cfg(fetchImpl),
    );
    expect(result.status).toBe('kein_projekt');
    expect(recorded.length).toBe(0);
  });
});

describe('resolveAutarcProject — Fallback ueber customers -> projects', () => {
  it('loest Projekt ueber Kundenname auf (source=fallback)', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      {
        customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
        projectsByCustomer: [{ id: 'p-fb-1', humanId: 'AT-1001' }],
      },
      recorded,
    );
    const input: AutarcMatchInput = { savedProjectId: null, customerName: 'Mustermann' };
    const result = await resolveAutarcProject(input, cfg(fetchImpl));

    expect(result.status).toBe('matched');
    expect(result.projectId).toBe('p-fb-1');
    expect(result.source).toBe('fallback');
    expect(recorded.some((r) => r.url.includes('/customers'))).toBe(true);
    expect(recorded.some((r) => r.url.includes('/projects'))).toBe(true);
  });

  it('uebergibt den Kundennamen als search-Parameter', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      {
        customers: [{ id: 'c-1', firstName: 'Erika', lastName: 'Beispiel' }],
        projectsByCustomer: [{ id: 'p-2' }],
      },
      recorded,
    );
    await resolveAutarcProject({ customerName: 'Beispiel' }, cfg(fetchImpl));
    const customersCall = recorded.find((r) => r.url.includes('/customers'));
    expect(customersCall?.url).toContain('Beispiel');
  });
});

describe('resolveAutarcProject — kein Treffer', () => {
  it('keine ID und leere Kundenliste -> kein_projekt mit DE-Meldung', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch({ customers: [] }, recorded);
    const result = await resolveAutarcProject(
      { savedProjectId: null, customerName: 'Niemand' },
      cfg(fetchImpl),
    );
    expect(result.status).toBe('kein_projekt');
    expect(result.projectId).toBeNull();
    expect(result.source).toBeNull();
    expect(result.meldung).toBeTruthy();
    expect((result.meldung ?? '').length).toBeGreaterThan(0);
  });

  it('Fallback-Projekt ohne id -> kein_projekt (nicht matched-ohne-ID)', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      {
        customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
        projectsByCustomer: [{ id: '' }],
      },
      recorded,
    );
    const result = await resolveAutarcProject({ customerName: 'Mustermann' }, cfg(fetchImpl));
    expect(result.status).toBe('kein_projekt');
    expect(result.projectId).toBeNull();
    expect(result.meldung).toBeTruthy();
  });

  it('Kunde gefunden, aber keine Projekte -> kein_projekt', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      { customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }], projectsByCustomer: [] },
      recorded,
    );
    const result = await resolveAutarcProject({ customerName: 'Mustermann' }, cfg(fetchImpl));
    expect(result.status).toBe('kein_projekt');
    expect(result.projectId).toBeNull();
  });

  it('weder ID noch Kundenname -> kein_projekt (kein stiller Fehlschlag)', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch({}, recorded);
    const result = await resolveAutarcProject({}, cfg(fetchImpl));
    expect(result.status).toBe('kein_projekt');
    expect(result.meldung).toBeTruthy();
  });
});

describe('resolveAutarcProject — Pannen enden NIE als matched', () => {
  it('Netzwerk-Abbruch bei customers -> fehler', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch({ throwOn: 'customers' }, recorded);
    const result = await resolveAutarcProject({ customerName: 'Mustermann' }, cfg(fetchImpl));
    expect(result.status).toBe('fehler');
    expect(result.projectId).toBeNull();
    expect(result.meldung).toBeTruthy();
  });

  it('HTTP 500 bei customers -> fehler', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch({ customersStatus: 500 }, recorded);
    const result = await resolveAutarcProject({ customerName: 'Mustermann' }, cfg(fetchImpl));
    expect(result.status).toBe('fehler');
    expect(result.projectId).toBeNull();
  });

  it('HTTP 500 bei projects?customerId -> fehler', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      { customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }], projectsStatus: 500 },
      recorded,
    );
    const result = await resolveAutarcProject({ customerName: 'Mustermann' }, cfg(fetchImpl));
    expect(result.status).toBe('fehler');
  });
});

describe('resolveAutarcProject — Disambiguierung mit addressHint', () => {
  it('löst zwei Projekte per addressHint eindeutig auf (kein Blind-Pick)', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      {
        customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
        projectsByCustomer: [
          { id: 'p-a', address: { city: 'Linz' } },
          { id: 'p-b', address: { city: 'Wien' } },
        ],
      },
      recorded,
    );
    const result = await resolveAutarcProject(
      { customerName: 'Mustermann', addressHint: 'Hauptstr. 1, 1010 Wien' },
      cfg(fetchImpl),
    );
    expect(result.status).toBe('matched');
    expect(result.projectId).toBe('p-b');
    expect(result.source).toBe('fallback');
  });

  it('zwei Projekte OHNE auflösbaren addressHint → kein_projekt statt Blind-Pick', async () => {
    const recorded: Recorded[] = [];
    const fetchImpl = makeFetch(
      {
        customers: [{ id: 'c-1', firstName: 'Max', lastName: 'Mustermann' }],
        projectsByCustomer: [{ id: 'p-a' }, { id: 'p-b' }],
      },
      recorded,
    );
    const result = await resolveAutarcProject(
      { customerName: 'Mustermann', addressHint: 'Musterstr. 1' },
      cfg(fetchImpl),
    );
    expect(result.status).toBe('kein_projekt');
  });
});
