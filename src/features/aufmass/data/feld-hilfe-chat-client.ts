import { supabase } from '@/integrations/supabase/client';
import { feldHilfe } from './feld-hilfe';

/**
 * „KI fragen"-Eskalation der Feld-Hilfe (Ebene 3). Der Laie stellt eine freie Frage
 * zu EINEM Feld; die KI antwortet kurz auf Basis der hinterlegten statischen Hilfe
 * (RAG-Kontext). Beratend — bei Fehler/offline → null (kein Blockieren).
 *
 * Modell: gemini-2.5-flash-lite (Edge Function `aufmass-feld-hilfe-chat`).
 * DEV ohne `VITE_FELD_HILFE_REAL=1` → deterministischer Mock (kein KI-Call), damit
 * der lokale Flow + Verifikation ohne Kosten/Netz durchläuft.
 */

/** Echte KI aktiv? In DEV nur mit `VITE_FELD_HILFE_REAL=1`. In Prod immer. */
function echterChatAktiv(): boolean {
  if (!import.meta.env.DEV) return true;
  return import.meta.env.VITE_FELD_HILFE_REAL === '1';
}

/** Statischen Hilfe-Kontext eines Feldes als Klartext (RAG-Grundlage für die KI). */
export function hilfeKontext(feldKey: string): string {
  const h = feldHilfe(feldKey);
  if (!h) return '';
  const teile: string[] = [h.inline];
  const s = h.sheet;
  if (s) {
    if (s.titel) teile.push(s.titel);
    if (s.quellen?.length) teile.push('Wo finde ich das: ' + s.quellen.join('; '));
    if (s.schritte?.length) teile.push('Vorgehen: ' + s.schritte.join('; '));
    if (s.typisch) teile.push('Typische Werte: ' + s.typisch);
    if (s.fallstricke) teile.push('Achtung: ' + s.fallstricke);
  }
  return teile.filter(Boolean).join('\n');
}

/** Deterministische Mock-Antwort (DEV) — fasst die statische Hilfe zur Frage zusammen. */
function mockAntwort(feldKey: string, frage: string): string {
  const kontext = hilfeKontext(feldKey);
  return [
    `(Demo-Antwort – keine echte KI in dieser Umgebung.)`,
    kontext || 'Für dieses Feld liegt aktuell keine zusätzliche Hilfe vor.',
    'Wenn du unsicher bist: frag den Eigentümer oder trage „weiß nicht / unbekannt" ein – nichts raten.',
  ].join('\n\n');
}

/**
 * Stellt eine feldspezifische Frage an die Hilfe-KI. Liefert die Antwort als Text
 * oder null (Fehler/offline/leere Frage) — der Aufrufer zeigt dann einen Fallback.
 */
export async function frageFeldHilfe(feldKey: string, frage: string): Promise<string | null> {
  const sauber = frage.trim();
  if (!sauber) return null;

  if (!echterChatAktiv()) {
    return mockAntwort(feldKey, sauber);
  }

  try {
    const { data, error } = await supabase.functions.invoke('aufmass-feld-hilfe-chat', {
      body: { feld: feldKey, frage: sauber, kontext: hilfeKontext(feldKey) },
    });
    if (error || !data) return null;
    const antwort = (data as { antwort?: string }).antwort;
    return typeof antwort === 'string' && antwort.trim() ? antwort.trim() : null;
  } catch {
    return null;
  }
}
