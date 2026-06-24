import { supabase } from '@/integrations/supabase/client';
import { feldHilfe } from './feld-hilfe';

/**
 * „KI fragen"-Eskalation der Feld-Hilfe (Ebene 3) als ECHTER Chat: Der Laie führt
 * ein Gespräch zu EINEM Feld, kann Fotos anhängen, und die KI bleibt hartnäckig
 * dran (Rückfragen, Foto-Auswertung), bis der richtige Wert gefunden ist — sie
 * schlägt NICHT vorschnell „unbekannt" vor. Der ganze Verlauf (inkl. Bilder) wird
 * mitgeschickt, damit die KI den Kontext behält. Rein beratend — KEINE Werte gesetzt.
 *
 * Modell: gemini-2.5-flash-lite (Edge Function `aufmass-feld-hilfe-chat`, multimodal).
 * DEV ohne `VITE_FELD_HILFE_REAL=1` → deterministischer Mock (kein KI-Call/Netz/Kosten),
 * damit der lokale Flow + Verifikation DSGVO-sicher durchläuft.
 */

/** Eine Nachricht im Feld-Hilfe-Chat. `bildDataUrl` (data:…;base64,…) nur bei User-Nachrichten. */
export interface ChatNachricht {
  rolle: 'user' | 'ki';
  text: string;
  bildDataUrl?: string;
}

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

/** Zerlegt eine data-URL in mimeType + base64 (für das Mitschicken von Fotos). */
function teileDataUrl(dataUrl: string): { base64: string; mimeType: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return null;
  return { mimeType: m[1], base64: m[2] };
}

/** Deterministische Mock-Antwort (DEV) — hartnäckig, fragt nach Foto, KEIN „unbekannt"-Ausweg. */
export function mockChatAntwort(feldKey: string, verlauf: ChatNachricht[]): string {
  const letzte = verlauf[verlauf.length - 1];
  if (letzte?.bildDataUrl) {
    return [
      '(Demo-Antwort – keine echte KI in dieser Umgebung.)',
      'Hier würde ich dein Foto auswerten und dir sagen, was darauf zu erkennen ist.',
      'Beschreib mir kurz, was du auf dem Bild siehst (z. B. die Aufschrift) — dann kommen wir dem richtigen Wert Schritt für Schritt näher.',
    ].join('\n\n');
  }
  const kontext = hilfeKontext(feldKey);
  return [
    '(Demo-Antwort – keine echte KI in dieser Umgebung.)',
    kontext || 'Für dieses Feld liegt aktuell kein zusätzlicher Hilfe-Kontext vor.',
    'Findest du den Wert nicht? Mach ein Foto (z. B. vom Typenschild, Energieausweis oder Heizkessel) und häng es hier an — dann finden wir es gemeinsam heraus.',
  ].join('\n\n');
}

/**
 * Schickt den ganzen Chat-Verlauf (inkl. Fotos) an die Hilfe-KI und liefert deren
 * nächste Nachricht als Text — oder null (Fehler/offline/leerer Verlauf). Der Aufrufer
 * zeigt dann einen Offline-Fallback.
 */
export async function frageFeldHilfeChat(feldKey: string, verlauf: ChatNachricht[]): Promise<string | null> {
  if (!verlauf.length) return null;

  if (!echterChatAktiv()) {
    return mockChatAntwort(feldKey, verlauf);
  }

  try {
    // Foto NUR von der aktuellen (letzten) Nachricht mitschicken — spart Vision-Kosten
    // und hält die Payload klein; ältere Foto-Beobachtungen stehen schon als Text im Verlauf.
    const letzterIndex = verlauf.length - 1;
    const nachrichten = verlauf.map((m, i) => {
      const bild = m.rolle === 'user' && m.bildDataUrl && i === letzterIndex ? teileDataUrl(m.bildDataUrl) : null;
      return {
        rolle: m.rolle,
        text: m.text,
        ...(bild ? { bildBase64: bild.base64, mimeType: bild.mimeType } : {}),
      };
    });

    const { data, error } = await supabase.functions.invoke('aufmass-feld-hilfe-chat', {
      body: { feld: feldKey, kontext: hilfeKontext(feldKey), verlauf: nachrichten },
    });
    if (error || !data) return null;
    const antwort = (data as { antwort?: string }).antwort;
    return typeof antwort === 'string' && antwort.trim() ? antwort.trim() : null;
  } catch {
    return null;
  }
}
