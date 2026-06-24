import { describe, it, expect } from 'vitest';
import {
  hammingHex,
  istAehnlichesBild,
  PHASH_BITS,
  PHASH_HAMMING_SCHWELLE,
} from './phash-distanz';

/**
 * Fuzzy-phash-Vergleich. Sichert die Hamming-Distanz + die kalibrierte Schwelle
 * gegen Regressionen ab (exakt gleiches Bild, leicht verändert, klar anders).
 *
 * Die dHash-Erzeugung hier spiegelt foto-verarbeitung.ts (9×8 Graustufen-Diff →
 * 64 Bit → 16 Hex). So sind „leicht verändert" / „klar anders" echte Hash-Distanzen
 * aus derselben Logik, keine handgepflückten Hex-Strings.
 */

/** dHash aus einem 9×8-Graustufen-Raster (identisch zur Produktionslogik). */
function dHashAusGrau(gray: number[]): string {
  let bits = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits += gray[y * 9 + x] < gray[y * 9 + x + 1] ? '1' : '0';
    }
  }
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

/** Deterministisches 9×8-Grauraster aus einem Seed (pseudo-Bildinhalt). */
function rasterMitSeed(seed: number): number[] {
  const g: number[] = [];
  for (let i = 0; i < 9 * 8; i++) {
    g.push((Math.sin((i + 1) * seed) * 0.5 + 0.5) * 255);
  }
  return g;
}

describe('hammingHex — Bit-Distanz', () => {
  it('identische Hashes → 0', () => {
    expect(hammingHex('00ff00ff00ff00ff', '00ff00ff00ff00ff')).toBe(0);
  });

  it('ein gekipptes Bit (0x00 vs 0x01) → 1', () => {
    expect(hammingHex('0000000000000000', '0000000000000001')).toBe(1);
  });

  it('komplett invertiert (alle 64 Bit) → 64', () => {
    expect(hammingHex('0000000000000000', 'ffffffffffffffff')).toBe(PHASH_BITS);
  });

  it('0x0f vs 0xf0 in einem Byte → 8 Bit', () => {
    expect(hammingHex('0f', 'f0')).toBe(8);
  });

  it('ungleiche Länge → null (nicht vergleichbar)', () => {
    expect(hammingHex('00ff', '00ff00')).toBeNull();
  });

  it('leerer String → null', () => {
    expect(hammingHex('', '')).toBeNull();
  });

  it('ungültiges Hex → null statt Falsch-Distanz', () => {
    expect(hammingHex('zz', '00')).toBeNull();
  });
});

describe('istAehnlichesBild — exakt / leicht verändert / klar anders', () => {
  it('exakt gleiches Bild → ähnlich', () => {
    const h = dHashAusGrau(rasterMitSeed(1.3));
    expect(istAehnlichesBild(h, h)).toBe(true);
  });

  it('leicht verändertes Bild (wenige Bits gekippt) → noch ähnlich', () => {
    const grau = rasterMitSeed(1.3);
    const original = dHashAusGrau(grau);

    // Minimale „Bearbeitung": ein paar Pixel leicht verschieben (Helligkeit/Crop-artig).
    const leicht = [...grau];
    leicht[10] += 4;
    leicht[20] -= 4;
    leicht[35] += 3;
    const veraendert = dHashAusGrau(leicht);

    const d = hammingHex(original, veraendert);
    expect(d).not.toBeNull();
    expect(d!).toBeLessThanOrEqual(PHASH_HAMMING_SCHWELLE);
    expect(istAehnlichesBild(original, veraendert)).toBe(true);
  });

  it('klar anderes Bild (anderer Inhalt) → NICHT ähnlich', () => {
    const a = dHashAusGrau(rasterMitSeed(1.3));
    const b = dHashAusGrau(rasterMitSeed(7.9));

    const d = hammingHex(a, b);
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThan(PHASH_HAMMING_SCHWELLE);
    expect(istAehnlichesBild(a, b)).toBe(false);
  });

  it('Distanz genau auf der Schwelle → noch ähnlich (≤ inklusive)', () => {
    // Hash B unterscheidet sich um exakt PHASH_HAMMING_SCHWELLE Bits von A.
    const a = '0000000000000000';
    // 10 gesetzte Bits = 10 unterschiedliche Bits: 0x07,0x07,0x0f (3+3+4=10).
    const b = '0707000f00000000';
    expect(hammingHex(a, b)).toBe(PHASH_HAMMING_SCHWELLE);
    expect(istAehnlichesBild(a, b)).toBe(true);
  });

  it('Distanz knapp über Schwelle → NICHT ähnlich', () => {
    const a = '0000000000000000';
    const b = '0707000f00000001'; // 11 Bit
    expect(hammingHex(a, b)).toBe(PHASH_HAMMING_SCHWELLE + 1);
    expect(istAehnlichesBild(a, b)).toBe(false);
  });

  it('nicht vergleichbar (ungleiche Länge) → fail-closed, NICHT ähnlich', () => {
    expect(istAehnlichesBild('00ff', '00ff00')).toBe(false);
  });

  it('eigene Schwelle überschreibbar (z. B. strenger ≤5)', () => {
    const a = '0000000000000000';
    const b = '000000000000003f'; // 6 Bit
    expect(istAehnlichesBild(a, b, 5)).toBe(false);
    expect(istAehnlichesBild(a, b, 10)).toBe(true);
  });
});
