import { supabase } from '@/integrations/supabase/client';
import { bildAlsKiBase64 } from './foto-verarbeitung';

/**
 * UNVERBINDLICHER Foto-Tipp für Dach-Dämmung & Verglasungstyp (Research: nur Hinweis,
 * NIE Auto-Wert). Liefert einen Vorschlag mit Pflicht-Option „nicht beurteilbar"/„unklar"
 * + Confidence; der Aufrufer zeigt das als Tipp, der Laie bestätigt/überschreibt.
 *
 * DEV ohne `VITE_BILD_HINWEIS_REAL=1` → deterministischer Mock (kein KI-Call).
 */
export type BildHinweisArt = 'dach' | 'verglasung';

export interface BildHinweis {
  geprueft: boolean;
  art: BildHinweisArt | null;
  /** dach: daemmung_sichtbar | keine_daemmung_sichtbar | nicht_beurteilbar
   *  verglasung: einfach | zweifach | dreifach | unklar */
  ergebnis: string;
  confidence: number;
  begruendung: string;
  unverbindlich: true;
}

function echtAktiv(): boolean {
  if (!import.meta.env.DEV) return true;
  return import.meta.env.VITE_BILD_HINWEIS_REAL === '1';
}

/** Deterministischer DEV-Mock (spiegelt den Edge-Function-Mock). */
export function mockBildHinweis(art: BildHinweisArt): BildHinweis {
  return art === 'dach'
    ? { geprueft: true, art, ergebnis: 'daemmung_sichtbar', confidence: 0.78, begruendung: '(Demo) Mineralwolle zwischen den Sparren erkennbar. Bitte bestätigen.', unverbindlich: true }
    : { geprueft: true, art, ergebnis: 'zweifach', confidence: 0.6, begruendung: '(Demo) 4 Lichtreflexe gezählt → Zweifachglas. Bitte bestätigen, ggf. Wärmeschutz prüfen.', unverbindlich: true };
}

export async function holeBildHinweis(quelle: Blob, art: BildHinweisArt): Promise<BildHinweis | null> {
  if (!echtAktiv()) {
    console.warn('[bild-hinweis] DEV-Mock-Mode (kein KI-Call). Für echt: VITE_BILD_HINWEIS_REAL=1.');
    return mockBildHinweis(art);
  }
  try {
    const { base64, mimeType } = await bildAlsKiBase64(quelle);
    if (!base64) return null;
    const { data, error } = await supabase.functions.invoke('aufmass-bild-hinweis', {
      body: { imageBase64: base64, mimeType, art },
    });
    if (error || !data) return null;
    const r = data as Partial<BildHinweis>;
    if (!r.geprueft) return null;
    return {
      geprueft: true,
      art: r.art === 'dach' || r.art === 'verglasung' ? r.art : art,
      ergebnis: typeof r.ergebnis === 'string' ? r.ergebnis : (art === 'dach' ? 'nicht_beurteilbar' : 'unklar'),
      confidence: typeof r.confidence === 'number' ? r.confidence : 0,
      begruendung: typeof r.begruendung === 'string' ? r.begruendung : '',
      unverbindlich: true,
    };
  } catch {
    return null;
  }
}
