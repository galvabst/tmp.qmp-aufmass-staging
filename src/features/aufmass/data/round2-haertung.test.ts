import { describe, it, expect } from 'vitest';
import { aufmassSubmitSchema } from './aufmass-schema';
import { mapAufmassToAutarc, deriveBuildingAge } from './aufmass-to-autarc';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { pruefeFotoPraesenz, type FotoPraesenzContext } from './foto-praesenz';
import { VALID_BASELINE } from './aufmass-watertight';

/** Regressionen aus Runde 2 (39 Funde) — die als echt triagierten Fixes. */

const sub = (over: Record<string, unknown>) => aufmassSubmitSchema.safeParse({ ...VALID_BASELINE, ...over });

describe('Härtung R2 — Freitext konsistent \\p{L}, kein i18n-Fehlalarm', () => {
  it('oeltank_transport_beschreibung "OK" (2 Zeichen, echte Buchstaben) wird AKZEPTIERT', () => {
    const r = sub({ heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_anzahl: 1, oeltank_liter_aktuell: 1500, oeltank_transport_beschreibung: 'OK' });
    expect(r.success).toBe(true);
  });
  it('oeltank_transport "中文" (chinesisch, 2 Zeichen) wird AKZEPTIERT', () => {
    const r = sub({ heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_anzahl: 1, oeltank_liter_aktuell: 1500, oeltank_transport_beschreibung: '中文' });
    expect(r.success).toBe(true);
  });
  it('oeltank_transport "-" (kein Buchstabe) bleibt ABGELEHNT', () => {
    const r = sub({ heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_anzahl: 1, oeltank_liter_aktuell: 1500, oeltank_transport_beschreibung: '-' });
    expect(r.success).toBe(false);
  });
});

describe('Härtung R2 — String-Längen-Cap', () => {
  it('bemerkungen mit 3000 Zeichen wird abgelehnt', () => {
    expect(sub({ bemerkungen: 'a'.repeat(3000) }).success).toBe(false);
  });
  it('normale Bemerkung bleibt gültig', () => {
    expect(sub({ bemerkungen: 'Alles in Ordnung, Heizraum trocken.' }).success).toBe(true);
  });
});

describe('Härtung R2 — Baualtersklasse zeitzonensicher (Jahr aus ISO-String)', () => {
  it('Bauantrag 2002-01-01 → from2002 (kein TZ-Off-by-one)', () => {
    expect(mapAufmassToAutarc({ bauantrag_datum: '2002-01-01' } as never).payload.buildingAge).toBe('from2002');
  });
  it('Bauantrag 1968-12-31 → from1958To1968', () => {
    expect(mapAufmassToAutarc({ bauantrag_datum: '1968-12-31' } as never).payload.buildingAge).toBe('from1958To1968');
  });
  it('deriveBuildingAge Bucket-Grenzen exakt', () => {
    expect(deriveBuildingAge(1919)).toBe('from1919To1948');
    expect(deriveBuildingAge(1918)).toBe('before1918');
    expect(deriveBuildingAge(1995)).toBe('from1995To2001');
  });
});

describe('Härtung R2 — PV-Plausibilität wird als Block durchgesetzt', () => {
  it('Dachneigung 95° → block', () => {
    expect(checkPvPlausibility({ dachneigung: 95 }).some((i) => i.severity === 'block')).toBe(true);
  });
  it('negative Entfernung → block', () => {
    expect(checkPvPlausibility({ gebaeude_entfernung: -5 }).some((i) => i.severity === 'block')).toBe(true);
  });
});

describe('Härtung R2 — bedingte PV/Unbegehbar-Pflichtfotos', () => {
  const base: FotoPraesenzContext = {
    istPvAufmass: false, istOel: false, mehrBilderHeizungsraum: false,
    hatErdung: false, alternative1Vorhanden: false, alternative2Vorhanden: false,
  };
  const fehlt = (ctx: FotoPraesenzContext, kat: string) =>
    pruefeFotoPraesenz([], ctx).some((f) => f.kategorie === kat);

  it('unbegehbarer_raum: Pflicht NUR wenn hatUnbegehbareRaeume', () => {
    expect(fehlt({ ...base, hatUnbegehbareRaeume: true }, 'unbegehbarer_raum')).toBe(true);
    expect(fehlt(base, 'unbegehbarer_raum')).toBe(false);
  });
  it('pv_anlage: Pflicht NUR wenn hatPvAnlage', () => {
    expect(fehlt({ ...base, hatPvAnlage: true }, 'pv_anlage')).toBe(true);
    expect(fehlt(base, 'pv_anlage')).toBe(false);
  });
  it('pv_blitzschutz: Pflicht NUR bei istPvAufmass + pvBlitzschutzVorhanden', () => {
    expect(fehlt({ ...base, istPvAufmass: true, pvBlitzschutzVorhanden: true }, 'pv_blitzschutz')).toBe(true);
    expect(fehlt({ ...base, istPvAufmass: true }, 'pv_blitzschutz')).toBe(false);
  });
  it('pv_geruest_oeffentlich + pv_hindernisse: nur bei ihrer Bedingung (kein Fehlalarm)', () => {
    expect(fehlt({ ...base, istPvAufmass: true }, 'pv_geruest_oeffentlich')).toBe(false);
    expect(fehlt({ ...base, istPvAufmass: true, pvOeffentlicheFlaeche: true }, 'pv_geruest_oeffentlich')).toBe(true);
    expect(fehlt({ ...base, istPvAufmass: true, pvHindernisseVorhanden: true }, 'pv_hindernisse')).toBe(true);
  });
});
