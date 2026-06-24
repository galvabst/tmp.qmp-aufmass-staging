/**
 * LIVE Round-Trip-Test des T4-Gates gegen ECHTES autarc (api2.autarc.energy).
 *
 * Zweck: beweisen, dass die Gate-Logik nicht nur gegen das Mock, sondern gegen den
 * realen autarc-Server funktioniert ("Mock == Realität") — und dir Urteil + Meldung
 * + Diff sichtbar machen, damit du beurteilen kannst, ob das Verhalten passt.
 *
 * Läuft NUR, wenn beide Env-Variablen gesetzt sind (sonst übersprungen → kein Netz,
 * kein Einfluss auf die normale Regression):
 *   AUTARC_API_KEY = <dein Key>
 *   AUTARC_LIVE    = 1
 *
 * Aufruf (PowerShell, im Worktree):
 *   $env:AUTARC_API_KEY='DEIN_KEY'; $env:AUTARC_LIVE='1'
 *   npx vitest run src/features/aufmass/data/autarc-live-roundtrip.test.ts
 *   $env:AUTARC_API_KEY=$null; $env:AUTARC_LIVE=$null
 *
 * Räumt sich selbst auf: das angelegte Test-Projekt wird am Ende gelöscht. Der
 * Test-KUNDE ("BITTE-LOESCHEN") wird wiederverwendet falls vorhanden, sonst neu
 * angelegt — die API kann Kunden nicht löschen, also ggf. einmal in der autarc-UI weg.
 */

import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { autarcVerifyCore, type VerifyConfig } from './autarc-verify-core';
import type { FetchLike } from './autarc-match';
import { VALID_BASELINE } from './aufmass-watertight';
import type { AufmassDraftData } from './aufmass-schema';

const BASE = 'https://api2.autarc.energy/api/v1';
const API_KEY = process.env.AUTARC_API_KEY ?? '';
const LIVE = process.env.AUTARC_LIVE === '1' && API_KEY.length > 0;

const realFetch: FetchLike = (url, init) => fetch(url, init);

const ADDRESS = {
  addressLine1: 'Teststrasse 1',
  postalCode: '94032',
  city: 'Passau',
  country: 'Deutschland',
  countryCode: 'DE',
};

async function api(method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} → HTTP ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

function liveCfg(): VerifyConfig {
  return { baseUrl: BASE, apiKey: API_KEY, fetchImpl: realFetch, heatLoadPollMs: 0, heatLoadPollAttempts: 0 };
}

function dump(label: string, r: { status: string; blockt: boolean; meldung: string; sentPayload: Record<string, unknown> }): void {
  // eslint-disable-next-line no-console
  console.log(
    `\n──────── ${label} ────────\n` +
      `  status : ${r.status}\n` +
      `  blockt : ${r.blockt}\n` +
      `  meldung: ${r.meldung}\n` +
      `  gesendet an autarc: ${JSON.stringify(r.sentPayload)}`,
  );
}

describe.skipIf(!LIVE)('autarc LIVE Round-Trip (echte API)', () => {
  let customerId = '';
  let projectId = '';

  beforeAll(async () => {
    // Test-Kunde wiederverwenden, sonst anlegen (vermeidet, jedes Mal neuen Müll anzulegen).
    const found = (await api('GET', '/customers?search=BITTE-LOESCHEN')) as Array<{ id: string }>;
    if (Array.isArray(found) && found.length > 0) {
      customerId = found[0].id;
    } else {
      const c = (await api('POST', '/customers', {
        firstName: 'API-Test', lastName: 'BITTE-LOESCHEN', isCompany: false, address: ADDRESS,
      })) as { id: string };
      customerId = c.id;
    }
    const p = (await api('POST', '/projects', {
      name: 'LIVE-TEST BITTE-LOESCHEN', customerId, status: 'inProgress', source: 'api', address: ADDRESS,
    })) as { id: string };
    projectId = p.id;
    // eslint-disable-next-line no-console
    console.log(`\n[setup] Test-Projekt angelegt: ${projectId} (Kunde ${customerId})`);
  }, 60000);

  afterAll(async () => {
    if (projectId) {
      try {
        await api('DELETE', `/projects/${projectId}`);
        // eslint-disable-next-line no-console
        console.log(`[cleanup] Test-Projekt ${projectId} geloescht. Test-Kunde bleibt (API hat kein Kunden-Delete → ggf. in autarc-UI loeschen).`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`[cleanup] WARN: konnte Projekt nicht loeschen: ${(e as Error).message} (manuell: ${projectId})`);
      }
    }
  }, 60000);

  it('S1 — Happy Round-Trip: PATCH→Readback→Diff gegen echtes autarc (erwartet: diff leer, rooms=0 → unvollstaendig)', async () => {
    const r = await autarcVerifyCore(
      { values: VALID_BASELINE as Partial<AufmassDraftData>, match: { savedProjectId: projectId } },
      liveCfg(),
    );
    dump('S1 Happy Round-Trip', r);

    // Wichtigste Erkenntnis: hat echtes autarc alles 1:1 zurueckgegeben (kein abweichung),
    // oder transformiert es ein Feld (→ realer Fehlalarm, den das Mock nie zeigte)?
    if (r.status === 'abweichung') {
      // eslint-disable-next-line no-console
      console.log('  ⚠️  ECHTES autarc hat mind. ein Feld anders gespeichert als gesendet → Mapping/Diff pruefen (siehe meldung oben).');
    }
    // Invariante: niemals faelschlich freigegeben (rooms=0), niemals stiller Erfolg bei Panne.
    expect(r.status).not.toBe('freigegeben');
    expect(['unvollstaendig', 'abweichung', 'fehler']).toContain(r.status);
    expect(r.blockt).toBe(true);
  }, 60000);

  it('S2 — Nicht existierendes Projekt: erwartet fehler + blockt (Panne nie als Erfolg)', async () => {
    const r = await autarcVerifyCore(
      { values: VALID_BASELINE as Partial<AufmassDraftData>, match: { savedProjectId: '00000000-0000-0000-0000-000000000000' } },
      liveCfg(),
    );
    dump('S2 Nicht-existentes Projekt', r);
    expect(r.status).toBe('fehler');
    expect(r.blockt).toBe(true);
  }, 60000);
});
