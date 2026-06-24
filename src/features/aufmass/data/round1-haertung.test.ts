import { describe, it, expect } from 'vitest';
import { aufmassSubmitSchema } from './aufmass-schema';
import { checkPlausibility } from './aufmass-plausibility';
import { checkPvPlausibility } from './aufmass-pv-plausibility';
import { bewerteGeo, formatDistanz } from './geo';
import { resolveAutarcProject, type FetchLike, type AutarcClientConfig } from './autarc-match';
import { VALID_BASELINE, PV_BASELINE } from './aufmass-watertight';

/**
 * Regressionen aus Runde 1 des 14-Lens-Edge-Hunts (95 Agenten, 49 bestätigte
 * Funde). Hier die als ECHT triagierten Löcher — abgesichert gegen den realen Code.
 */

const sub = (over: Record<string, unknown>) => aufmassSubmitSchema.safeParse({ ...VALID_BASELINE, ...over });
const failsOn = (over: Record<string, unknown>, field: string) => {
  const r = sub(over);
  return !r.success && r.error.issues.some((i) => String(i.path[0]) === field);
};
const has = (issues: { ruleId: string }[], ruleId: string) => issues.some((i) => i.ruleId === ruleId);
const wp = (over: Record<string, unknown>) => checkPlausibility({ ...VALID_BASELINE, ...over });
const pv = (over: Record<string, unknown>) => checkPvPlausibility({ ...PV_BASELINE, ...over });

describe('Härtung — Baseline bleibt gültig (keine Regression)', () => {
  it('VALID_BASELINE besteht das Submit-Schema weiterhin', () => {
    expect(aufmassSubmitSchema.safeParse(VALID_BASELINE).success).toBe(true);
  });
  it('VALID_BASELINE hat 0 Plausibilitäts-Befunde', () => {
    expect(checkPlausibility(VALID_BASELINE)).toEqual([]);
  });
});

describe('Härtung — non-finite Zahlen (Infinity) abgelehnt', () => {
  it('beheizte_wohnflaeche_m2 = Infinity → Schema lehnt ab', () => {
    expect(failsOn({ beheizte_wohnflaeche_m2: Infinity }, 'beheizte_wohnflaeche_m2')).toBe(true);
  });
  it('vorlauftemperatur = Infinity → Schema lehnt ab', () => {
    expect(failsOn({ vorlauftemperatur: Infinity }, 'vorlauftemperatur')).toBe(true);
  });
});

describe('Härtung — Platzhalter in Pflicht-Textfeldern', () => {
  it('kunde_bestaetigung_nachname = "-" → abgelehnt', () => {
    expect(failsOn({ kunde_bestaetigung_nachname: '-' }, 'kunde_bestaetigung_nachname')).toBe(true);
  });
  it('kunde_bestaetigung_vorname = "123" → abgelehnt', () => {
    expect(failsOn({ kunde_bestaetigung_vorname: '123' }, 'kunde_bestaetigung_vorname')).toBe(true);
  });
  it('heizungsart_sonstige = "?" bei sonstige → abgelehnt', () => {
    expect(failsOn({ heizungsart: 'sonstige', heizungsart_sonstige: '?' }, 'heizungsart_sonstige')).toBe(true);
  });
  it('oeltank_transport_beschreibung = "-" bei Öl → abgelehnt', () => {
    expect(
      failsOn(
        { heizungsart: 'oel', oeltank_liter_gesamt: 3000, oeltank_anzahl: 1, oeltank_liter_aktuell: 1500, oeltank_transport_beschreibung: '-' },
        'oeltank_transport_beschreibung',
      ),
    ).toBe(true);
  });
  it('echte Namen/Beschreibungen bleiben gültig', () => {
    expect(sub({ kunde_bestaetigung_nachname: 'Müller-Lüdenscheidt' }).success).toBe(true);
  });
});

describe('Härtung — Plausibilitäts-Boundaries jetzt inklusiv', () => {
  it('EFH mit genau 12 Bewohnern → bewohner.efh soft', () => {
    expect(has(wp({ gebaeudetyp: 'einfamilienhaus', anzahl_bewohner: 12 }), 'bewohner.efh')).toBe(true);
  });
  it('genau 20 m²/Person → flaecheProPerson.eng soft', () => {
    expect(has(wp({ beheizte_wohnflaeche_m2: 40, anzahl_bewohner: 2 }), 'flaecheProPerson.eng')).toBe(true);
  });
  it('EFH mit genau 500 m² → wohnflaeche.efh soft', () => {
    expect(has(wp({ gebaeudetyp: 'einfamilienhaus', beheizte_wohnflaeche_m2: 500 }), 'wohnflaeche.efh')).toBe(true);
  });
  it('genau 25 m²/Etage → flaecheProEtage.duenn soft', () => {
    expect(has(wp({ beheizte_wohnflaeche_m2: 50, anzahl_etagen: 2 }), 'flaecheProEtage.duenn')).toBe(true);
  });
  it('genau 400 m²/Etage → flaecheProEtage.gross soft', () => {
    expect(has(wp({ beheizte_wohnflaeche_m2: 800, anzahl_etagen: 2 }), 'flaecheProEtage.gross')).toBe(true);
  });
});

describe('Härtung — Neubau + Ölheizung Querfeld', () => {
  it('Bauantrag 2018 + Öl → heizung.neubauOel soft', () => {
    const issues = wp({
      bauantrag_datum: '2018-01-01',
      heizung_inbetriebnahme_datum: '2019-06-01',
      heizungsart: 'oel',
      durchschnittsverbrauch_3_jahre: 2000,
    });
    expect(has(issues, 'heizung.neubauOel')).toBe(true);
  });
});

describe('Härtung — PV-Querfelder', () => {
  it('Module auf anderem Gebäude ohne Entfernung → soft', () => {
    expect(has(pv({ module_gleiches_gebaeude: false, gebaeude_entfernung: undefined }), 'pv.entfernung.andersGebaeudeKeine')).toBe(true);
  });
  it('Flachdach (0°) + Aufdachdämmung → soft', () => {
    expect(has(pv({ dachneigung: 0, aufdachdaemmung: true }), 'pv.aufdach.flachdach')).toBe(true);
  });
  it('Ziegel-Neigung "negativ" + 0° → soft', () => {
    expect(has(pv({ ziegel_neigung: 'negativ', ziegel_neigung_grad: 0 }), 'pv.ziegelNeigung.nullRichtung')).toBe(true);
  });
});

describe('Härtung — geo: ungültige Distanz kein Gratis-OK', () => {
  it('negative Distanz → kein "ok"', () => {
    expect(bewerteGeo(-50).status).toBe('abweichung');
    expect(bewerteGeo(-50).abzug).toBe(0);
  });
  it('NaN/Infinity → kein "ok"', () => {
    expect(bewerteGeo(NaN).status).toBe('abweichung');
    expect(bewerteGeo(Infinity).status).toBe('abweichung');
  });
  it('gültige Distanz weiterhin korrekt', () => {
    expect(bewerteGeo(100).status).toBe('ok');
    expect(bewerteGeo(900).status).toBe('abweichung');
  });
  it('formatDistanz(NaN/Infinity) → "unbekannt"', () => {
    expect(formatDistanz(NaN)).toBe('unbekannt');
    expect(formatDistanz(Infinity)).toBe('unbekannt');
  });
});

describe('Härtung — autarc-match Mehrdeutigkeit + Garbage-ID', () => {
  const BASE = 'https://api2.autarc.energy/api/v1';
  const cfg = (fetchImpl: FetchLike): AutarcClientConfig => ({ baseUrl: BASE, apiKey: 'k', fetchImpl });
  const fetchWith = (customers: unknown, projects: unknown): FetchLike => async (url: string) => {
    if (url.includes('/customers')) return new Response(JSON.stringify(customers), { status: 200 });
    return new Response(JSON.stringify(projects), { status: 200 });
  };

  it('zwei gleichnamige Kunden ohne addressHint → kein_projekt (kein Blind-Pick)', async () => {
    const f = fetchWith(
      [{ id: 'c1', lastName: 'Müller', address: { city: 'Linz' } }, { id: 'c2', lastName: 'Müller', address: { city: 'Wien' } }],
      { items: [{ id: 'p1' }] },
    );
    const r = await resolveAutarcProject({ customerName: 'Müller' }, cfg(f));
    expect(r.status).toBe('kein_projekt');
  });

  it('zwei Kunden mit addressHint → eindeutiger Treffer matched', async () => {
    const f = fetchWith(
      [{ id: 'c1', lastName: 'Müller', address: { city: 'Linz' } }, { id: 'c2', lastName: 'Müller', address: { city: 'Wien' } }],
      { items: [{ id: 'p-wien' }] },
    );
    const r = await resolveAutarcProject({ customerName: 'Müller', addressHint: 'Hauptstr. 1, 1010 Wien' }, cfg(f));
    expect(r.status).toBe('matched');
    expect(r.projectId).toBe('p-wien');
  });

  it('Projekt mit Objekt-ID → kein_projekt (kein [object Object])', async () => {
    const f = fetchWith([{ id: 'c1', lastName: 'Solo' }], { items: [{ id: { nested: true } }] });
    const r = await resolveAutarcProject({ customerName: 'Solo' }, cfg(f));
    expect(r.status).toBe('kein_projekt');
  });

  it('zwei Projekte ohne addressHint → kein_projekt', async () => {
    const f = fetchWith([{ id: 'c1', lastName: 'Solo' }], { items: [{ id: 'p1' }, { id: 'p2' }] });
    const r = await resolveAutarcProject({ customerName: 'Solo' }, cfg(f));
    expect(r.status).toBe('kein_projekt');
  });
});
