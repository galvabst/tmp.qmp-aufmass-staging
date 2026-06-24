import { describe, it, expect } from 'vitest';
import { resolveAutarcProject, type FetchLike, type AutarcClientConfig } from './autarc-match';
import { diffHeatingCircuits, diffAutarcPayload } from './autarc-diff';
import { mapAufmassToAutarc } from './aufmass-to-autarc';

/**
 * Regressionen aus dem REAL-Abgleich gegen die echte autarc-API (2026-06-21).
 *
 * Die Mock-Tests der Wasserdicht-Schleife nahmen für ALLE Listen-Endpoints ein
 * bare Array an. Real liefert autarc INKONSISTENTE Envelopes:
 *   GET /customers?search=   → bare Array
 *   GET /projects?customerId= → { items: [...], metadata: {} }
 *   GET /projects/{id}       → bare Objekt
 *   GET /projects/{id}/rooms → bare Array
 * Und Heizkreise: der erste Kreis hat real index:1 (nicht 0).
 */

const BASE = 'https://api2.autarc.energy/api/v1';

function cfg(fetchImpl: FetchLike): AutarcClientConfig {
  return { baseUrl: BASE, apiKey: 'test-key', fetchImpl };
}

/** Mock-fetch mit den ECHTEN Envelope-Formen je Endpoint. */
function realShapedFetch(opts: {
  customers: unknown; // bare Array (real)
  projectsItems?: unknown[]; // wird in { items } gewrappt (real)
  projectsRaw?: unknown; // alternativ: roh zurückgeben (z. B. Fehler-Objekt)
}): FetchLike {
  return async (url: string) => {
    if (url.includes('/customers')) {
      return new Response(JSON.stringify(opts.customers), { status: 200 });
    }
    if (url.includes('/projects')) {
      const body = opts.projectsRaw !== undefined ? opts.projectsRaw : { items: opts.projectsItems ?? [], metadata: {} };
      return new Response(JSON.stringify(body), { status: 200 });
    }
    return new Response('null', { status: 200 });
  };
}

describe('autarc-match — echte Envelope-Formen (Fallback Namenssuche)', () => {
  it('findet das Projekt, obwohl /projects?customerId ein {items}-Objekt liefert (kein bare Array)', async () => {
    const fetchImpl = realShapedFetch({
      customers: [{ id: 'c-1', firstName: 'Nabeela', lastName: 'Ahmad' }], // bare Array (real)
      projectsItems: [{ id: 'p-real-1', humanId: 'P-1000' }], // → { items: [...] }
    });
    const result = await resolveAutarcProject({ customerName: 'Ahmad' }, cfg(fetchImpl));
    expect(result.status).toBe('matched');
    expect(result.projectId).toBe('p-real-1');
    expect(result.source).toBe('fallback');
  });

  it('toleriert auch einen {items}-Envelope bei /customers (falls autarc angleicht)', async () => {
    const fetchImpl = realShapedFetch({
      customers: { items: [{ id: 'c-2', firstName: 'Max', lastName: 'Muster' }] },
      projectsItems: [{ id: 'p-2' }],
    });
    const result = await resolveAutarcProject({ customerName: 'Muster' }, cfg(fetchImpl));
    expect(result.status).toBe('matched');
    expect(result.projectId).toBe('p-2');
  });

  it('leeres items-Array → kein_projekt (sauberes Sachurteil, kein Fehler)', async () => {
    const fetchImpl = realShapedFetch({
      customers: [{ id: 'c-1', firstName: 'Leer', lastName: 'Kunde' }],
      projectsItems: [],
    });
    const result = await resolveAutarcProject({ customerName: 'Kunde' }, cfg(fetchImpl));
    expect(result.status).toBe('kein_projekt');
  });

  it('Fehler-Objekt {message,error,statusCode} statt Liste → fehler (Panik bleibt Panik)', async () => {
    const fetchImpl = realShapedFetch({
      customers: [{ id: 'c-1', firstName: 'X', lastName: 'Y' }],
      projectsRaw: { message: 'Bad Request', error: 'Bad Request', statusCode: 400 },
    });
    const result = await resolveAutarcProject({ customerName: 'Y' }, cfg(fetchImpl));
    expect(result.status).toBe('fehler');
  });
});

describe('autarc-diff — heatingCircuits Einzelkreis-Positions-Fallback', () => {
  it('gesendet index 1, autarc renummeriert auf index 0, gleiche Temps → KEINE Abweichung', () => {
    const sent = [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 1 }];
    const readback = [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 0 }];
    expect(diffHeatingCircuits(sent, readback, 0.01)).toEqual([]);
  });

  it('Einzelkreis, abweichende Temp trotz Index-Mismatch → Abweichung wird gemeldet', () => {
    const sent = [{ name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 1 }];
    const readback = [{ name: 'Heizkreis 1', flowTemperature: 60, returnTemperature: 45, index: 0 }];
    const out = diffHeatingCircuits(sent, readback, 0.01);
    expect(out).toHaveLength(1);
    expect(out[0].art).toBe('abweichung');
  });

  it('Mehrkreis bleibt strikt index-basiert (kein Positions-Fallback)', () => {
    const sent = [
      { name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 1 },
      { name: 'HK2', flowTemperature: 35, returnTemperature: 28, index: 2 },
    ];
    // autarc liefert nur einen Kreis zurück → der zweite fehlt wirklich.
    const readback = [{ name: 'HK1', flowTemperature: 55, returnTemperature: 45, index: 1 }];
    const out = diffHeatingCircuits(sent, readback, 0.01);
    expect(out.some((e) => e.art === 'fehlt')).toBe(true);
  });
});

describe('aufmass-to-autarc — heatingCircuits index 1-basiert (autarc-Konvention)', () => {
  it('Payload sendet heatingCircuits mit index 1', () => {
    const { payload } = mapAufmassToAutarc({ vorlauftemperatur: 55, ruecklauftemperatur: 45 });
    expect(Array.isArray(payload.heatingCircuits)).toBe(true);
    const hc = (payload.heatingCircuits as Array<Record<string, unknown>>)[0];
    expect(hc.index).toBe(1);
    expect(hc.flowTemperature).toBe(55);
    expect(hc.returnTemperature).toBe(45);
  });

  it('round-trip: gesendeter Payload-Kreis matcht den echten autarc-Kreis (index 1) ohne Abweichung', () => {
    const { payload } = mapAufmassToAutarc({ vorlauftemperatur: 55, ruecklauftemperatur: 45 });
    // echter autarc-Readback (so wie real beobachtet)
    const readback = {
      heatingCircuits: [{ id: 'x', name: 'Heizkreis 1', flowTemperature: 55, returnTemperature: 45, index: 1 }],
    };
    const result = diffAutarcPayload(payload, readback, 0.01);
    expect(result.ok).toBe(true);
  });
});
