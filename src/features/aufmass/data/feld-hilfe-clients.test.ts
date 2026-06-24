import { describe, it, expect } from 'vitest';
import { mockTypenschildScan } from './typenschild-scan-client';
import { mockBildHinweis } from './bild-hinweis-client';
import { hilfeKontext, mockChatAntwort, frageFeldHilfeChat } from './feld-hilfe-chat-client';

/**
 * Verträge der KI-Hilfe-Clients (DEV-Mocks + RAG-Kontext). Garantiert, dass der
 * lokale/DSGVO-sichere Mock-Pfad ein gültiges, übernehmbares Ergebnis liefert.
 */

describe('Typenschild-Scan Mock', () => {
  it('liefert ein lesbares, übernehmbares Ergebnis mit Brennstoff-Kategorie', () => {
    const s = mockTypenschildScan();
    expect(s.geprueft).toBe(true);
    expect(s.lesbar).toBe(true);
    expect(s.brennstoff_kategorie).toBe('gas');
    expect(s.leistung_kw).toBeGreaterThan(0);
    // Ehrlichkeits-Regel: kein geratenes Baujahr aus der Seriennummer.
    expect(s.baujahr_klartext).toBeNull();
  });
});

describe('Bild-Hinweis Mock', () => {
  it('dach: liefert ein eindeutiges, übernehmbares Ergebnis', () => {
    const r = mockBildHinweis('dach');
    expect(r.geprueft).toBe(true);
    expect(r.art).toBe('dach');
    expect(['daemmung_sichtbar', 'keine_daemmung_sichtbar', 'nicht_beurteilbar']).toContain(r.ergebnis);
    expect(r.unverbindlich).toBe(true);
  });

  it('verglasung: liefert einen Verglasungstyp', () => {
    const r = mockBildHinweis('verglasung');
    expect(r.art).toBe('verglasung');
    expect(['einfach', 'zweifach', 'dreifach', 'unklar']).toContain(r.ergebnis);
    expect(r.unverbindlich).toBe(true);
  });
});

describe('hilfeKontext (RAG-Grundlage für KI-Chat)', () => {
  it('baut für ein schweres Feld einen nicht-leeren Kontext', () => {
    const k = hilfeKontext('verglasung');
    expect(k.length).toBeGreaterThan(20);
    // Reflexlogik soll im Kontext stecken (für die KI-Antwort).
    expect(k.toLowerCase()).toContain('reflex');
  });

  it('liefert leeren Kontext für unbekannte Felder', () => {
    expect(hilfeKontext('gibt_es_nicht')).toBe('');
  });
});

describe('Feld-Hilfe-Chat (hartnäckig, multimodal)', () => {
  it('Text-Frage → Mock nudged Richtung Foto statt eines „unbekannt"-Auswegs', () => {
    const a = mockChatAntwort('verglasung', [{ rolle: 'user', text: 'Wie finde ich das raus?' }]);
    expect(a.length).toBeGreaterThan(20);
    // Hartnäckigkeit: bietet das Anhängen eines Fotos als nächsten Schritt an.
    expect(a).toContain('Foto');
    // Kein bequemer Ausweg: schlägt NICHT vor, „unbekannt" einzutragen.
    expect(a.toLowerCase()).not.toMatch(/trag.*unbekannt|unbekannt.*eintrag|„unbekannt" ein/);
  });

  it('Foto angehängt → Mock bestätigt das Bild und macht weiter (kein „unbekannt")', () => {
    const a = mockChatAntwort('verglasung', [
      { rolle: 'user', text: '', bildDataUrl: 'data:image/jpeg;base64,AAAA' },
    ]);
    expect(a.toLowerCase()).toMatch(/foto|bild/);
    expect(a.toLowerCase()).not.toContain('unbekannt');
  });

  it('leerer Verlauf → null (kein KI-Call)', async () => {
    expect(await frageFeldHilfeChat('verglasung', [])).toBeNull();
  });
});
