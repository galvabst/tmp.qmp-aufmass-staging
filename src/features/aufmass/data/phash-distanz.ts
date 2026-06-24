/**
 * Fuzzy-Vergleich für dHash/perceptual-Hashes (siehe foto-verarbeitung.ts).
 *
 * Hintergrund: Der dHash ist 64 Bit (16 Hex-Zeichen). Reine Re-Kompression /
 * Skalierung lässt ihn unverändert — deshalb fängt phash mehr als sha256. Aber
 * jede inhaltliche Mini-Änderung (Crop, Helligkeit, Sticker) kippt einzelne Bits.
 * Ein exakter Gleichheits-Vergleich (=) findet solche „leicht veränderten" Bilder
 * NICHT. Die Hamming-Distanz (Anzahl unterschiedlicher Bits) misst genau diese
 * Ähnlichkeit und erlaubt eine konservative Schwelle gegen Fehlalarme.
 *
 * Reine Logik (keine DB, kein Netz) — bewusst hier zentral, damit kalibrierbar
 * und unabhängig testbar. Eingehängt wird sie serverseitig (DB-RPC, siehe Report).
 */

/** Bit-Breite eines dHash (9×8-Pixel-Diff → 64 Vergleiche). */
export const PHASH_BITS = 64;

/**
 * Hamming-Schwelle für „gleiches Bild, leicht verändert".
 *
 * Kalibrierung (dHash, 64 Bit): ≤5 = quasi identisch (zu streng, verfehlt Crop),
 * ≤10 = toleriert Crop / Helligkeit / leichte Bearbeitung, >12 driftet in
 * Fehlalarme (verschiedene Innenraum-Fotos liegen oft schon bei ~14–22 Bit).
 * 10 ist der konservative Mittelweg: fängt Manipulation, ohne ehrliche
 * verschiedene Fotos fälschlich als Duplikat zu markieren.
 */
export const PHASH_HAMMING_SCHWELLE = 10;

/** Bits, die in einem Byte (0–255) gesetzt sind. */
function bitsImByte(b: number): number {
  let n = b;
  let count = 0;
  while (n) {
    n &= n - 1; // löscht jeweils das niederwertigste gesetzte Bit
    count++;
  }
  return count;
}

/**
 * Hamming-Distanz zweier dHash-Hex-Strings (Anzahl unterschiedlicher Bits).
 * Erwartet zwei gleich lange Hex-Strings (16 Zeichen = 64 Bit). Bei ungültiger
 * oder ungleicher Länge → null (Aufrufer entscheidet, z. B. „nicht vergleichbar").
 */
export function hammingHex(a: string, b: string): number | null {
  if (a.length === 0 || a.length !== b.length || a.length % 2 !== 0) return null;
  let distanz = 0;
  for (let i = 0; i < a.length; i += 2) {
    const byteA = parseInt(a.slice(i, i + 2), 16);
    const byteB = parseInt(b.slice(i, i + 2), 16);
    if (Number.isNaN(byteA) || Number.isNaN(byteB)) return null;
    distanz += bitsImByte(byteA ^ byteB);
  }
  return distanz;
}

/**
 * Sind zwei dHash-Hashes „dasselbe Bild (ggf. leicht verändert)"?
 * Konservativ: nur true, wenn vergleichbar UND Distanz ≤ Schwelle.
 * Nicht vergleichbar (null) → false (keine Falsch-Treffer auf Müll-Eingaben).
 */
export function istAehnlichesBild(
  a: string,
  b: string,
  schwelle: number = PHASH_HAMMING_SCHWELLE,
): boolean {
  const d = hammingHex(a, b);
  return d !== null && d <= schwelle;
}
