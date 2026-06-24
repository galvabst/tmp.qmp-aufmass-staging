/**
 * U-Wert-SCHÄTZUNG aus dem geschichteten Hüllen-Aufbau (rein deterministisch,
 * offline, DSGVO-frei). Verfahren nach DIN EN ISO 6946:
 *
 *   R_schicht = d / λ           (Dicke in m, λ in W/mK → R in m²K/W)
 *   R_total   = Rsi + Σ R_schicht + Rse
 *   U         = 1 / R_total     (W/m²K)
 *
 * Bewusst eine SCHÄTZUNG: die λ-Tabelle ist auf typische Bestandsbaustoffe
 * kalibriert (Bandbreite real ±20–30 %). Verborgene Schichten / Feuchte /
 * Wärmebrücken sind nicht erfasst. Dient der Plausibilisierung vor Ort, NICHT
 * der Heizlast-Auslegung (die macht autarc mit den Rohwerten). Keine Berechnung
 * ohne die physikalisch tragende Schicht (Mauerwerk bzw. Boden-/Dachaufbau).
 *
 * Fachliche Feinjustierung der λ-Werte ist mit Alexander (Heizlast) zu mergen —
 * Schwellen/λ zentral in LAMBDA_* + R_SI/R_SE.
 */

import type { UWerteData } from './aufmass-schema';

/** Wärmeleitfähigkeit λ [W/mK] der Mauerwerk-Materialien (Bestand, kalibriert). */
export const LAMBDA_MAUERWERK: Record<string, number> = {
  vollziegel: 0.68,       // Vollziegel Bestand (≈1800 kg/m³) → 36 cm ungedämmt ~1.4
  hochlochziegel: 0.21,   // perforierter Hochlochziegel
  kalksandstein: 0.99,    // dichter KS-Stein
  ytong_porenbeton: 0.13, // Porenbeton / Ytong
  beton: 2.1,             // Normalbeton
  bruchstein: 2.3,        // Naturstein-Bruchmauerwerk
  gasbeton: 0.13,         // Gasbeton (wie Porenbeton)
  andere: 0.7,            // konservativer Fallback (eher schlechter)
};

/** Wärmeleitfähigkeit λ [W/mK] der Dämmstoffe. `keine` → keine Dämmschicht. */
export const LAMBDA_DAEMMSTOFF: Record<string, number> = {
  mineralwolle: 0.035,
  eps_styropor: 0.035,
  xps: 0.035,
  pur_pir: 0.025,
  holzfaser: 0.045,
  kork: 0.045,
  schaumglas: 0.045,
  keine: Number.POSITIVE_INFINITY, // markiert „keine Schicht" → R = 0
  andere: 0.040,                   // generischer Dämmstoff
};

/** λ [W/mK] mineralischer Putz (Innen-/Außenputz, Kalk-/Zementmörtel). */
export const LAMBDA_PUTZ = 0.87;

/**
 * Wärmeübergangswiderstände [m²K/W] je Wärmestromrichtung (DIN EN ISO 6946):
 *  - horizontal (Wand): Rsi 0.13, Rse 0.04
 *  - aufwärts (Dach):   Rsi 0.10, Rse 0.04
 *  - abwärts (Boden):   Rsi 0.17 — außen gegen Erdreich/unbeheizt: Rse 0.0
 */
export const R_SI = { wand: 0.13, dach: 0.10, boden: 0.17 } as const;
export const R_SE = { wand: 0.04, dach: 0.04, boden: 0.0 } as const;

/** Eine berechnete Schicht (für die Anzeige „wie kommt der U-Wert zustande"). */
export interface UWertSchicht {
  /** Klartext-Name der Schicht (z. B. „Mauerwerk", „Dämmung"). */
  name: string;
  /** Dicke in cm (wie erfasst). */
  cm: number;
  /** angesetztes λ [W/mK]. */
  lambda: number;
  /** Wärmedurchlasswiderstand R = d/λ [m²K/W]. */
  r: number;
}

/** Ergebnis je Bauteil. `null`-Felder = nicht berechenbar (tragende Schicht fehlt). */
export interface UWertErgebnis {
  /** geschätzter U-Wert [W/m²K], gerundet auf 2 Nachkommastellen. */
  uWert: number;
  /** R_total inkl. Rsi/Rse [m²K/W]. */
  rTotal: number;
  /** Einzelschichten (ohne Rsi/Rse) — für die Transparenz-Anzeige. */
  schichten: UWertSchicht[];
}

/** cm → m, ungültige/negative Werte → 0. */
function cmToM(cm: number | undefined): number {
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return 0;
  return cm / 100;
}

/** R einer Schicht: d/λ. λ = Infinity (z. B. „keine") oder d = 0 → R = 0. */
function schichtR(cm: number | undefined, lambda: number): number {
  const d = cmToM(cm);
  if (d === 0 || !Number.isFinite(lambda) || lambda <= 0) return 0;
  return d / lambda;
}

/** λ eines Dämmstoff-Enums; unbekannt/`keine`/leer → null (keine Dämmschicht). */
function daemmLambda(typ: string | undefined): number | null {
  if (!typ || typ === 'keine') return null;
  const l = LAMBDA_DAEMMSTOFF[typ];
  return l != null && Number.isFinite(l) ? l : null;
}

/** Aus Schichten + Rsi/Rse das Ergebnis bauen (U = 1/Rtotal, 2 Nachkommastellen). */
function baueErgebnis(schichten: UWertSchicht[], rsi: number, rse: number): UWertErgebnis {
  const rTotal = rsi + rse + schichten.reduce((sum, s) => sum + s.r, 0);
  const uWert = Math.round((1 / rTotal) * 100) / 100;
  return { uWert, rTotal: Math.round(rTotal * 1000) / 1000, schichten };
}

type Wand = NonNullable<UWerteData['aussenwand']>;

/**
 * U-Wert einer (Außen-/Anbau-)Wand. Tragende Schicht = Mauerwerk: ohne Material
 * ODER ohne Dicke ist keine Schätzung möglich → null.
 */
export function berechneWandUWert(wand: Wand | undefined): UWertErgebnis | null {
  if (!wand?.mauerwerk_material) return null;
  const mauerLambda = LAMBDA_MAUERWERK[wand.mauerwerk_material];
  if (mauerLambda == null || cmToM(wand.mauerwerk_cm) === 0) return null;

  const schichten: UWertSchicht[] = [];
  if ((wand.aussenputz_cm ?? 0) > 0) {
    schichten.push({ name: 'Außenputz', cm: wand.aussenputz_cm!, lambda: LAMBDA_PUTZ, r: schichtR(wand.aussenputz_cm, LAMBDA_PUTZ) });
  }
  const dl = daemmLambda(wand.daemmstoff_typ);
  if (dl != null && (wand.daemmstoff_cm ?? 0) > 0) {
    schichten.push({ name: 'Dämmung', cm: wand.daemmstoff_cm!, lambda: dl, r: schichtR(wand.daemmstoff_cm, dl) });
  }
  schichten.push({ name: 'Mauerwerk', cm: wand.mauerwerk_cm!, lambda: mauerLambda, r: schichtR(wand.mauerwerk_cm, mauerLambda) });
  if ((wand.innenputz_cm ?? 0) > 0) {
    schichten.push({ name: 'Innenputz', cm: wand.innenputz_cm!, lambda: LAMBDA_PUTZ, r: schichtR(wand.innenputz_cm, LAMBDA_PUTZ) });
  }
  return baueErgebnis(schichten, R_SI.wand, R_SE.wand);
}

type Dach = NonNullable<UWerteData['dach']>;

/**
 * U-Wert des Dachs aus den Dämmschichten (Zwischensparren + Aufdach + Untersparren).
 * Ohne Dachtyp ist nichts erfasst → null. Ohne jede Dämmung wird der ungedämmte
 * Grenzfall geschätzt (nur Rsi+Rse → hoher U-Wert, fachlich korrekt „schlecht").
 *
 * ACHTUNG (Grenzfall): Ohne JEDE Dämmschicht ist rTotal = Rsi+Rse(dach) = 0,14 →
 * U ≈ 7,14 W/m²K. Das ist BEWUSST nur die Hülle-Übergangs-Untergrenze und damit
 * für ein REALES ungedämmtes Dach zu hoch — Sparren/Schalung/Eindeckung (real
 * U ≈ 3–5) werden hier NICHT modelliert (kein eigenes Tragschicht-Feld im Schema).
 * Nur als Plausibilisierungs-SCHÄTZUNG ansehen; ein 7+-Wert signalisiert „gar keine
 * Dämmung erfasst", nicht den exakten Bauteil-U-Wert. Heizlast macht autarc separat.
 */
export function berechneDachUWert(dach: Dach | undefined): UWertErgebnis | null {
  if (!dach?.dachtyp) return null;
  const schichten: UWertSchicht[] = [];
  // Untersparren hat KEIN eigenes Material-Feld im Schema/der UI → bewusste Annahme:
  // gleicher Dämmstoff wie Zwischensparren (in der UI als Standard ausgewiesen). Ohne
  // gewählten Zwischensparren-Typ liefert daemmLambda() null → die Untersparren-Schicht
  // wird übersprungen (konservativ: U-Wert eher zu hoch, nie fälschlich zu gut).
  const lagen: ReadonlyArray<readonly [string, number | undefined, string | undefined]> = [
    ['Aufdach-Dämmung', dach.aufdach_cm, dach.aufdach_daemmstoff_typ],
    ['Zwischensparren-Dämmung', dach.zwischensparren_cm, dach.zwischensparren_daemmstoff_typ],
    ['Untersparren-Dämmung', dach.untersparren_cm, dach.zwischensparren_daemmstoff_typ],
  ];
  for (const [name, cm, typ] of lagen) {
    const l = daemmLambda(typ);
    if (l != null && (cm ?? 0) > 0) {
      schichten.push({ name, cm: cm!, lambda: l, r: schichtR(cm, l) });
    }
  }
  return baueErgebnis(schichten, R_SI.dach, R_SE.dach);
}

type Boden = NonNullable<UWerteData['unten']>;

/**
 * U-Wert Bodenplatte/Kellerdecke aus der Dämmschicht. Ohne Art-Auswahl → null.
 * Ohne Dämmung wird der ungedämmte Grenzfall geschätzt (Rsi+Rse).
 */
export function berechneBodenUWert(boden: Boden | undefined): UWertErgebnis | null {
  if (!boden?.art) return null;
  const schichten: UWertSchicht[] = [];
  const l = daemmLambda(boden.daemmung_typ);
  if (l != null && (boden.daemmung_cm ?? 0) > 0) {
    schichten.push({ name: 'Dämmung', cm: boden.daemmung_cm!, lambda: l, r: schichtR(boden.daemmung_cm, l) });
  }
  return baueErgebnis(schichten, R_SI.boden, R_SE.boden);
}

/** Berechnete U-Werte je Bauteil (null = nicht berechenbar). */
export interface UWerteBerechnung {
  aussenwand: UWertErgebnis | null;
  dach: UWertErgebnis | null;
  unten: UWertErgebnis | null;
  anbauwand: UWertErgebnis | null;
}

/** Alle Bauteil-U-Werte aus dem U-Werte-Block schätzen. */
export function berechneUWerte(u: UWerteData | undefined): UWerteBerechnung {
  return {
    aussenwand: berechneWandUWert(u?.aussenwand),
    dach: berechneDachUWert(u?.dach),
    unten: berechneBodenUWert(u?.unten),
    anbauwand: u?.anbau?.vorhanden ? berechneWandUWert(u.anbau.wand) : null,
  };
}
