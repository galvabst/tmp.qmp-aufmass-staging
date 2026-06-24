/**
 * Foto-Verarbeitung vor dem Upload:
 *  1. Runterskalieren (Speicher sparen) — IMMER, nicht nur bei großen Dateien.
 *  2. sha256 der finalen Bytes (erkennt exakt dieselbe Datei).
 *  3. dHash / perceptual hash (erkennt dasselbe Bild auch nach Neu-Komprimierung
 *     oder von einem anderen Handy) — robust gegen Metadaten-Unterschiede.
 *
 * Alles client-seitig (Canvas + WebCrypto), keine neuen Pakete.
 */

const MAX_KANTE = 1600;
const JPEG_QUALITAET = 0.8;

export interface VerarbeitetesFoto {
  /** Runterskaliertes JPEG für den Upload. */
  blob: Blob;
  /** SHA-256 der finalen Bytes (hex). */
  sha256: string;
  /** dHash (16 hex = 64 bit) über den Bildinhalt. */
  phash: string;
  width: number;
  height: number;
  groesseBytes: number;
}

function ladeBild(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Bild konnte nicht dekodiert werden'));
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function canvasZuBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas-Export fehlgeschlagen'))),
      type,
      quality,
    );
  });
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Difference-Hash (dHash): Bild auf 9×8 Graustufen, je Nachbarpaar 1 Bit
 * (links<rechts) → 64 Bit als 16 Hex-Zeichen. Stabil gegen Skalierung/Kompression.
 */
function dHashVonBild(img: HTMLImageElement): string {
  const w = 9;
  const h = 8;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  const gray: number[] = [];
  for (let i = 0; i < w * h; i++) {
    gray.push(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  }

  let bits = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w - 1; x++) {
      bits += gray[y * w + x] < gray[y * w + x + 1] ? '1' : '0';
    }
  }

  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export async function verarbeiteFotoFuerUpload(file: File): Promise<VerarbeitetesFoto> {
  const img = await ladeBild(file);

  let width = img.width;
  let height = img.height;
  if (width > MAX_KANTE || height > MAX_KANTE) {
    const ratio = Math.min(MAX_KANTE / width, MAX_KANTE / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas-Kontext nicht verfügbar');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasZuBlob(canvas, 'image/jpeg', JPEG_QUALITAET);
  const sha256 = await sha256Hex(await blob.arrayBuffer());
  const phash = dHashVonBild(img);

  return { blob, sha256, phash, width, height, groesseBytes: blob.size };
}

/**
 * Kleines Base64-JPEG für die KI-Bildprüfung (Token-/Kosten-sparend, ~768 px).
 */
export async function bildAlsKiBase64(quelle: Blob, maxKante = 768): Promise<{ base64: string; mimeType: string }> {
  const img = await ladeBild(quelle);

  let width = img.width;
  let height = img.height;
  if (width > maxKante || height > maxKante) {
    const ratio = Math.min(maxKante / width, maxKante / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas-Kontext nicht verfügbar');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  return { base64: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg' };
}
