import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Fail-Closed-Verdrahtung des autarc-Gate-Wrappers runAutarcVerify.
 * Audit-Finding (high): der eigentliche supabase.functions.invoke-Wrapper hatte
 * 0 Tests. Sicherheitskritische Invariante: bei JEDER Panne (error, !data,
 * {error}-Payload, fehlendem/falsch-typisiertem status/meldung, thrown
 * exception) MUSS NICHT_ERREICHBAR (status 'ausstehend', blockt:true) zurück —
 * nie ein technischer Fehler als 'freigegeben'.
 *
 * HINWEIS: runAutarcVerify hat seit dem DEV-Mock (analog Foto-Check) zwei Pfade.
 * In vitest gilt import.meta.env.DEV === true → ohne VITE_AUTARC_REAL=1 würde der
 * DEV-Mock greifen. Die fail-closed-Tests müssen den ECHTEN invoke-Pfad prüfen →
 * VITE_AUTARC_REAL=1 stubben. Der Mock-Pfad hat eigene Tests (s. unten).
 */

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

import { runAutarcVerify, type AutarcVerifyParams } from './autarc-verify-client';

const params: AutarcVerifyParams = {
  votFormularId: 'f-1',
  values: {},
  customerName: 'Mustermann',
};

beforeEach(() => {
  invokeMock.mockReset();
  // Echten invoke-Pfad erzwingen (DEV-Mock sonst aktiv, s. Datei-Kommentar).
  vi.stubEnv('VITE_AUTARC_REAL', '1');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function erwarteAusstehend(): Promise<void> {
  const r = await runAutarcVerify(params);
  expect(r.status).toBe('ausstehend');
  expect(r.blockt).toBe(true);
  expect(typeof r.meldung).toBe('string');
  expect(r.meldung.length).toBeGreaterThan(0);
}

describe('runAutarcVerify — fail-closed bei jeder Panne', () => {
  it('invoke liefert { error } → ausstehend / blockt', async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: 'boom' } });
    await erwarteAusstehend();
  });

  it('invoke liefert { data: null } → ausstehend / blockt', async () => {
    invokeMock.mockResolvedValue({ data: null, error: null });
    await erwarteAusstehend();
  });

  it('data trägt { error: ... } statt Urteil → ausstehend', async () => {
    invokeMock.mockResolvedValue({ data: { error: 'intern kaputt' }, error: null });
    await erwarteAusstehend();
  });

  it('data ohne status → ausstehend', async () => {
    invokeMock.mockResolvedValue({ data: { meldung: 'x', blockt: false }, error: null });
    await erwarteAusstehend();
  });

  it('data mit status falsch typisiert (number) → ausstehend', async () => {
    invokeMock.mockResolvedValue({ data: { status: 200, meldung: 'x' }, error: null });
    await erwarteAusstehend();
  });

  it('data ohne meldung → ausstehend', async () => {
    invokeMock.mockResolvedValue({ data: { status: 'freigegeben' }, error: null });
    await erwarteAusstehend();
  });

  it('invoke wirft → ausstehend (catch)', async () => {
    invokeMock.mockRejectedValue(new Error('network down'));
    await erwarteAusstehend();
  });
});

describe('runAutarcVerify — gültiges Urteil wird durchgereicht', () => {
  it('valides { status:"freigegeben", meldung, blockt:false } → unverändert', async () => {
    invokeMock.mockResolvedValue({
      data: { status: 'freigegeben', meldung: 'Alles passt.', blockt: false },
      error: null,
    });
    const r = await runAutarcVerify(params);
    expect(r.status).toBe('freigegeben');
    expect(r.blockt).toBe(false);
    expect(r.meldung).toBe('Alles passt.');
  });

  it('valides blockendes Urteil (abweichung) bleibt blockt:true', async () => {
    invokeMock.mockResolvedValue({
      data: { status: 'abweichung', meldung: 'Wohnfläche weicht ab.', blockt: true },
      error: null,
    });
    const r = await runAutarcVerify(params);
    expect(r.status).toBe('abweichung');
    expect(r.blockt).toBe(true);
  });
});

describe('runAutarcVerify — DEV-Mock (ohne VITE_AUTARC_REAL=1)', () => {
  it('DEV ohne Flag → freigegeben/blockt:false, OHNE die echte Function zu rufen', async () => {
    vi.stubEnv('VITE_AUTARC_REAL', ''); // DEV bleibt true, Flag aus → Mock-Pfad
    const r = await runAutarcVerify(params);
    expect(r.status).toBe('freigegeben');
    expect(r.blockt).toBe(false);
    expect(typeof r.meldung).toBe('string');
    expect(r.meldung.length).toBeGreaterThan(0);
    // Entscheidend: die irreversible autarc-Function darf NICHT aufgerufen worden sein.
    expect(invokeMock).not.toHaveBeenCalled();
  });
});
