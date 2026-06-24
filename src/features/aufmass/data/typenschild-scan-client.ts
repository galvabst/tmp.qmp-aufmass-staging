import { supabase } from '@/integrations/supabase/client';
import { bildAlsKiBase64 } from './foto-verarbeitung';

/**
 * Typenschild-Scan der bestehenden Heizung (das EINE verbindliche KI-Foto-Feature).
 * Liefert NUR, was wörtlich auf dem Schild steht — das Baujahr NIE aus der
 * Seriennummer abgeleitet (nur Klartext). Der Aufrufer übernimmt alles als
 * VORSCHLAG mit Pflicht-Bestätigung, nie als Auto-Fakt.
 *
 * DEV ohne `VITE_TYPENSCHILD_REAL=1` → deterministischer Mock (kein KI-Call, kein
 * echtes Foto nötig → DSGVO-sicher beim lokalen Testen).
 */
export interface TypenschildScan {
  geprueft: boolean;
  lesbar: boolean;
  hersteller: string | null;
  modell: string | null;
  leistung_kw: number | null;
  brennstoff: string | null;
  brennstoff_kategorie: 'gas' | 'oel' | 'sonstige' | null;
  seriennummer: string | null;
  baujahr_klartext: number | null;
  hinweis: string;
}

function echtAktiv(): boolean {
  if (!import.meta.env.DEV) return true;
  return import.meta.env.VITE_TYPENSCHILD_REAL === '1';
}

/** Deterministischer DEV-Mock (spiegelt den Edge-Function-Mock). */
export function mockTypenschildScan(): TypenschildScan {
  return {
    geprueft: true, lesbar: true,
    hersteller: 'Viessmann', modell: 'Vitodens 200-W', leistung_kw: 19,
    brennstoff: 'Erdgas', brennstoff_kategorie: 'gas',
    seriennummer: '7501234567890123', baujahr_klartext: null,
    hinweis: '(Demo) Baujahr nicht im Klartext aufgedruckt — bitte beim Eigentümer/Schornsteinfeger erfragen.',
  };
}

export async function scanTypenschild(quelle: Blob): Promise<TypenschildScan | null> {
  if (!echtAktiv()) {
    console.warn('[typenschild] DEV-Mock-Mode (kein KI-Call). Für echten Scan: VITE_TYPENSCHILD_REAL=1.');
    return mockTypenschildScan();
  }
  try {
    const { base64, mimeType } = await bildAlsKiBase64(quelle);
    if (!base64) return null;
    const { data, error } = await supabase.functions.invoke('aufmass-typenschild-scan', {
      body: { imageBase64: base64, mimeType },
    });
    if (error || !data) return null;
    const r = data as Partial<TypenschildScan>;
    if (!r.geprueft) return null;

    const kat = r.brennstoff_kategorie;
    return {
      geprueft: true,
      lesbar: r.lesbar === true,
      hersteller: typeof r.hersteller === 'string' ? r.hersteller : null,
      modell: typeof r.modell === 'string' ? r.modell : null,
      leistung_kw: typeof r.leistung_kw === 'number' ? r.leistung_kw : null,
      brennstoff: typeof r.brennstoff === 'string' ? r.brennstoff : null,
      brennstoff_kategorie: kat === 'gas' || kat === 'oel' || kat === 'sonstige' ? kat : null,
      seriennummer: typeof r.seriennummer === 'string' ? r.seriennummer : null,
      baujahr_klartext: typeof r.baujahr_klartext === 'number' ? r.baujahr_klartext : null,
      hinweis: typeof r.hinweis === 'string' ? r.hinweis : '',
    };
  } catch {
    return null;
  }
}
