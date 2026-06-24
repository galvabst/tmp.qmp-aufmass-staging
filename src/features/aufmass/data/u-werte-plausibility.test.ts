import { describe, it, expect } from 'vitest';
import { checkUWertePlausibilitaet, pruefeUWerteVollstaendigkeit } from './u-werte-plausibility';
import { FIELD_META } from './aufmass-validation';
import type { AufmassDraftData } from './aufmass-schema';

const block = (is: ReturnType<typeof checkUWertePlausibilitaet>) => is.filter((i) => i.severity === 'block');
const soft = (is: ReturnType<typeof checkUWertePlausibilitaet>) => is.filter((i) => i.severity === 'soft');
const v = (u: unknown, extra: Partial<AufmassDraftData> = {}): Partial<AufmassDraftData> =>
  ({ u_werte: u, ...extra }) as never;

describe('checkUWertePlausibilitaet — block', () => {
  it('leeres u_werte → keine Issues', () => {
    expect(checkUWertePlausibilitaet({})).toEqual([]);
    expect(checkUWertePlausibilitaet(v(undefined))).toEqual([]);
  });

  it('Dämmdicke > 0 aber Typ „keine" → block (Widerspruch)', () => {
    const is = checkUWertePlausibilitaet(v({ aussenwand: { daemmstoff_cm: 12, daemmstoff_typ: 'keine' } }));
    expect(block(is).map((i) => i.ruleId)).toContain('u_werte_aussenwand.daemmWiderspruch');
  });

  it('Dämmjahr vor Baujahr → block (Zeitlogik)', () => {
    const is = checkUWertePlausibilitaet(v({ aussenwand: { daemmstoff_jahr: 1990 } }, { bauantrag_datum: '2005-06-01' }));
    expect(block(is).map((i) => i.ruleId)).toContain('u_werte_aussenwand.daemmjahr');
  });

  it('Mauerwerk < 5 cm → block (physikalisch)', () => {
    const is = checkUWertePlausibilitaet(v({ aussenwand: { mauerwerk_cm: 3, mauerwerk_material: 'vollziegel' } }));
    expect(block(is).map((i) => i.ruleId)).toContain('u_werte_aussenwand.mauerwerkDuenn');
  });

  it('Dach-Dämmjahr vor Baujahr → block', () => {
    const is = checkUWertePlausibilitaet(v({ dach: { zwischensparren_jahr: 1980 } }, { bauantrag_datum: '2000-01-01' }));
    expect(block(is).map((i) => i.ruleId)).toContain('u_werte_dach.zwischensparren_jahr');
  });

  it('Boden: Dämmdicke > 0 + Typ keine → block', () => {
    const is = checkUWertePlausibilitaet(v({ unten: { daemmung_cm: 8, daemmung_typ: 'keine', art: 'bodenplatte_erdberuehrt' } }));
    expect(block(is).map((i) => i.ruleId)).toContain('u_werte_unten.daemmWiderspruch');
  });

  it('Fenster-Tauschjahr vor Baujahr → block (Zeitlogik)', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { getauscht: true, tausch_jahr: 1990 } }, { bauantrag_datum: '2005-01-01' }));
    expect(block(is).map((i) => i.ruleId)).toContain('u_werte_fenster.tauschVorBaujahr');
  });
});

describe('checkUWertePlausibilitaet — soft', () => {
  it('Neubau (≥2015) ungedämmte Wand → soft (GEG)', () => {
    const is = checkUWertePlausibilitaet(v({ aussenwand: { mauerwerk_material: 'vollziegel', mauerwerk_cm: 36, daemmstoff_typ: 'keine' } }, { bauantrag_datum: '2022-04-01' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_aussenwand.neubauUngedaemmt');
    expect(block(is)).toEqual([]);
  });

  it('untypische Dämmdicke (> 40 cm) → soft', () => {
    const is = checkUWertePlausibilitaet(v({ aussenwand: { daemmstoff_typ: 'eps_styropor', daemmstoff_cm: 45 } }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_aussenwand.daemmDickeUntypisch');
  });

  it('Fenster getauscht ohne Tauschjahr → soft', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { getauscht: true } }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.tauschJahr');
  });

  it('Fenstertausch ≥2010 + Einfachverglasung → soft (Mismatch)', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { getauscht: true, tausch_jahr: 2018 } }, { verglasung: 'einfach' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.einfachUntypisch');
  });

  it('Flachdach mit Steildach-Dämmwerten → soft', () => {
    const is = checkUWertePlausibilitaet(v({ dach: { dachtyp: 'flachdach', zwischensparren_cm: 18 } }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_dach.flachdachMitSteildachDaemmung');
  });

  it('Wand: Dämmdicke > 0 ohne Dämmstoff-Typ → soft (Schicht fällt sonst still raus)', () => {
    // daemmstoff_typ undefined (nicht „keine") → kein Block, aber die Schicht wird in
    // der U-Wert-Schätzung ignoriert → der Techniker muss gewarnt werden.
    const is = checkUWertePlausibilitaet(v({ aussenwand: { daemmstoff_cm: 12 } }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_aussenwand.daemmCmOhneTyp');
    expect(block(is)).toEqual([]);
  });

  it('Wand: Dämmdicke 0 ohne Typ → KEIN daemmCmOhneTyp (nichts zu dämmen)', () => {
    const is = checkUWertePlausibilitaet(v({ aussenwand: { daemmstoff_cm: 0 } }));
    expect(soft(is).map((i) => i.ruleId)).not.toContain('u_werte_aussenwand.daemmCmOhneTyp');
  });

  it('Dach: Zwischensparren-Dicke > 0 ohne Typ → soft', () => {
    const is = checkUWertePlausibilitaet(v({ dach: { dachtyp: 'satteldach', zwischensparren_cm: 16 } }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_dach.zwischensparren_cmOhneTyp');
  });

  it('Dach: Aufdach-Dicke > 0 ohne Typ → soft', () => {
    const is = checkUWertePlausibilitaet(v({ dach: { dachtyp: 'satteldach', aufdach_cm: 8 } }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_dach.aufdach_cmOhneTyp');
  });

  it('Neubau-Dach: Dämmstoff-Typ gesetzt aber cm=0 → neubauUngedaemmt feuert trotzdem', () => {
    // Lücken-Regression: Typ='mineralwolle' aber cm=0 = real KEINE wirksame Dämmschicht.
    // Früher unterdrückte der gesetzte Typ den Neubau-ungedämmt-Hinweis still.
    const is = checkUWertePlausibilitaet(
      v({ dach: { dachtyp: 'satteldach', zwischensparren_daemmstoff_typ: 'mineralwolle', zwischensparren_cm: 0 } }, { bauantrag_datum: '2022-04-01' }),
    );
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_dach.neubauUngedaemmt');
  });

  it('Neubau-Dach: echte Dämmschicht (Typ + cm>0) → KEIN neubauUngedaemmt', () => {
    const is = checkUWertePlausibilitaet(
      v({ dach: { dachtyp: 'satteldach', zwischensparren_daemmstoff_typ: 'mineralwolle', zwischensparren_cm: 20 } }, { bauantrag_datum: '2022-04-01' }),
    );
    expect(soft(is).map((i) => i.ruleId)).not.toContain('u_werte_dach.neubauUngedaemmt');
  });

  it('plausibler vollständiger Aufbau → kein block', () => {
    const is = checkUWertePlausibilitaet(v({
      aussenwand: { mauerwerk_material: 'kalksandstein', mauerwerk_cm: 24, daemmstoff_typ: 'mineralwolle', daemmstoff_cm: 16, daemmstoff_jahr: 2015, geprueft_per: 'gemessen' },
      dach: { dachtyp: 'satteldach', zwischensparren_daemmstoff_typ: 'mineralwolle', zwischensparren_cm: 20, zwischensparren_jahr: 2015 },
      unten: { art: 'kellerdecke_unbeheizt', daemmung_typ: 'eps_styropor', daemmung_cm: 10, daemmung_jahr: 2015 },
    }, { bauantrag_datum: '2014-01-01' }));
    expect(block(is)).toEqual([]);
  });
});

describe('checkUWertePlausibilitaet — Fenster-U-Wert ↔ Verglasung', () => {
  it('Einfachverglasung mit zu gutem (niedrigem) Uw → soft', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { u_wert: 1.1 } }, { verglasung: 'einfach' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.uWertZuGutFuerEinfach');
  });
  it('einfache Zweifachverglasung mit zu gutem Uw → soft', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { u_wert: 1.2 } }, { verglasung: 'zweifach' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.uWertZuGutFuerZweifach');
  });
  it('Zweifach-Wärmeschutz mit zu schlechtem (hohem) Uw → soft', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { u_wert: 2.5 } }, { verglasung: 'zweifach_waermeschutz' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.uWertZuSchlechtFuerZweifachWs');
  });
  it('Dreifachverglasung mit zu schlechtem Uw → soft', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { u_wert: 2.0 } }, { verglasung: 'dreifach' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.uWertZuSchlechtFuerDreifach');
  });
  it('Dreifach-Wärmeschutz mit zu schlechtem Uw → soft', () => {
    const is = checkUWertePlausibilitaet(v({ fenster: { u_wert: 1.8 } }, { verglasung: 'dreifach_waermeschutz' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.uWertZuSchlechtFuerDreifach');
  });
  it('passender Uw je Verglasung → kein Befund', () => {
    // Hinweis: Für 'einfach' gibt es im Schema-Band (u_wert ≤ 3,0) KEINEN plausiblen
    // Wert (real ≈ 4,5–5,8) → eigener Fall unten. Hier nur die Verglasungstypen mit
    // schema-erreichbarem Plausibilitäts-Fenster.
    expect(soft(checkUWertePlausibilitaet(v({ fenster: { u_wert: 2.8 } }, { verglasung: 'zweifach' }))).map((i) => i.ruleId)).not.toContain('u_werte_fenster.uWertZuGutFuerZweifach');
    expect(soft(checkUWertePlausibilitaet(v({ fenster: { u_wert: 1.3 } }, { verglasung: 'zweifach_waermeschutz' }))).map((i) => i.ruleId)).not.toContain('u_werte_fenster.uWertZuSchlechtFuerZweifachWs');
    expect(soft(checkUWertePlausibilitaet(v({ fenster: { u_wert: 0.9 } }, { verglasung: 'dreifach' }))).map((i) => i.ruleId)).not.toContain('u_werte_fenster.uWertZuSchlechtFuerDreifach');
  });
  it('Einfachverglasung mit schema-maximalem Uw (2,9) → soft (kein stiller Durchlass)', () => {
    // Schwelle = Schema-Deckel 3,0: jeder erfassbare Einfachglas-Uw ist physikalisch
    // zu gut → muss als unplausibel markiert werden (vorher rutschten 2,6–3,0 durch).
    const is = checkUWertePlausibilitaet(v({ fenster: { u_wert: 2.9 } }, { verglasung: 'einfach' }));
    expect(soft(is).map((i) => i.ruleId)).toContain('u_werte_fenster.uWertZuGutFuerEinfach');
  });
  it('ohne u_wert oder ohne Verglasung → keine Querprüfung', () => {
    expect(checkUWertePlausibilitaet(v({ fenster: { getauscht: true, tausch_jahr: 2020 } }, { verglasung: 'dreifach' })).filter((i) => i.ruleId.startsWith('u_werte_fenster.uWert'))).toEqual([]);
    expect(checkUWertePlausibilitaet(v({ fenster: { u_wert: 0.6 } })).filter((i) => i.ruleId.startsWith('u_werte_fenster.uWert'))).toEqual([]);
  });
});

describe('checkUWertePlausibilitaet — Anbau', () => {
  it('Anbau-Wand wird nur bei vorhanden=true geprüft', () => {
    const aus = checkUWertePlausibilitaet(v({ anbau: { vorhanden: false, wand: { mauerwerk_cm: 2 } } }));
    expect(block(aus)).toEqual([]); // nicht geprüft
    const an = checkUWertePlausibilitaet(v({ anbau: { vorhanden: true, wand: { mauerwerk_cm: 2 } } }));
    expect(block(an).map((i) => i.ruleId)).toContain('u_werte_anbau.mauerwerkDuenn');
  });
});

describe('pruefeUWerteVollstaendigkeit', () => {
  it('leer → Kern-Pflichtfelder fehlen (Außenwand-Material+cm, Dach, Boden)', () => {
    const f = pruefeUWerteVollstaendigkeit({});
    const felder = f.map((x) => x.label);
    expect(felder).toContain('Außenwand: Mauerwerk-Material');
    expect(felder).toContain('Außenwand: Mauerwerk-Dicke (cm)');
    expect(felder).toContain('Dach: Dachtyp');
    expect(felder).toContain('Bodenplatte/Keller: Art');
  });

  it('Außenwand-Dicke 0 → gilt als fehlend (nicht als grüner Haken)', () => {
    const f = pruefeUWerteVollstaendigkeit(v({
      aussenwand: { mauerwerk_material: 'vollziegel', mauerwerk_cm: 0 },
      dach: { dachtyp: 'satteldach' },
      unten: { art: 'bodenplatte_erdberuehrt' },
    }));
    expect(f.map((x) => x.label)).toContain('Außenwand: Mauerwerk-Dicke (cm)');
  });

  it('Kern vollständig → keine Fehlend', () => {
    const f = pruefeUWerteVollstaendigkeit(v({
      aussenwand: { mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 },
      dach: { dachtyp: 'satteldach' },
      unten: { art: 'bodenplatte_erdberuehrt' },
    }));
    expect(f).toEqual([]);
  });

  it('Fenster getauscht ohne Tauschjahr → fehlt', () => {
    const f = pruefeUWerteVollstaendigkeit(v({
      aussenwand: { mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 },
      dach: { dachtyp: 'satteldach' }, unten: { art: 'unbekannt' },
      fenster: { getauscht: true },
    }));
    expect(f.map((x) => x.label)).toContain('Fenster: Tauschjahr');
  });

  it('Anbau vorhanden → Baujahr + Material Pflicht', () => {
    const f = pruefeUWerteVollstaendigkeit(v({
      aussenwand: { mauerwerk_material: 'vollziegel', mauerwerk_cm: 36 },
      dach: { dachtyp: 'satteldach' }, unten: { art: 'unbekannt' },
      anbau: { vorhanden: true },
    }));
    expect(f.map((x) => x.label)).toContain('Anbau: Baujahr');
    expect(f.map((x) => x.label)).toContain('Anbau: Mauerwerk-Material');
  });
});

// Contract-Guard (deckt Critic-Gap #4 ab): jeder `feld`-Bezeichner, den
// pruefeUWerteVollstaendigkeit ODER checkUWertePlausibilitaet zurückgibt, MUSS in
// FIELD_META existieren und auf den U-Werte-Schritt (Gebäudedaten = Schritt 2)
// auflösen. Sonst greift in AufmassFormPage.handleSubmit der `?? 2`-Fallback und
// der Stepper springt evtl. zum falschen Schritt statt zum echten Fehlerfeld.
describe('U-Werte-Felder ↔ FIELD_META (Sprung-Contract)', () => {
  const U_WERTE_STEP = 2;

  it('alle U-Werte-Vollständigkeits-Felder sind in FIELD_META auf Schritt 2', () => {
    // Maximal-Eingabe, die jeden Vollständigkeits-Zweig auslöst (Anbau + Fenster).
    const fehlend = pruefeUWerteVollstaendigkeit(v({
      anbau: { vorhanden: true },
      fenster: { getauscht: true },
    }));
    // Sicherstellen, dass wir tatsächlich Felder prüfen (kein leerer Durchlauf).
    expect(fehlend.length).toBeGreaterThan(0);
    for (const { feld } of fehlend) {
      const meta = FIELD_META[feld];
      expect(meta, `FIELD_META fehlt für U-Werte-Feld "${feld}"`).toBeDefined();
      expect(meta!.step, `U-Werte-Feld "${feld}" sollte auf Schritt ${U_WERTE_STEP} zeigen`).toBe(U_WERTE_STEP);
    }
  });

  it('alle U-Werte-Plausi-Issue-Felder sind in FIELD_META auf Schritt 2', () => {
    // Eingabe, die Wand-, Dach-, Boden-, Fenster- und Anbau-Issues triggert.
    const issues = checkUWertePlausibilitaet(v({
      aussenwand: { daemmstoff_cm: 12, daemmstoff_typ: 'keine' },
      dach: { dachtyp: 'flachdach', zwischensparren_cm: 18 },
      unten: { daemmung_cm: 8, daemmung_typ: 'keine', art: 'bodenplatte_erdberuehrt' },
      fenster: { getauscht: true },
      anbau: { vorhanden: true, wand: { mauerwerk_cm: 2 } },
    }));
    expect(issues.length).toBeGreaterThan(0);
    for (const { field } of issues) {
      const meta = FIELD_META[field];
      expect(meta, `FIELD_META fehlt für U-Werte-Issue-Feld "${field}"`).toBeDefined();
      expect(meta!.step, `U-Werte-Issue-Feld "${field}" sollte auf Schritt ${U_WERTE_STEP} zeigen`).toBe(U_WERTE_STEP);
    }
  });
});
