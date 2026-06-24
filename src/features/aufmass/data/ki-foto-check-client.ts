import { supabase } from '@/integrations/supabase/client';
import { BILD_KATEGORIEN, VotBildKategorie } from './bild-kategorien';
import { bildAlsKiBase64 } from './foto-verarbeitung';

export interface FotoCheckErgebnis {
  geprueft: boolean;
  /** true = Bild zeigt das Geforderte, ist scharf genug UND das Geforderte ist lesbar. */
  passt: boolean;
  confidence: number;
  erkannt: string;
  begruendung: string;
  /**
   * Vom Messwerkzeug (Maßband/Zollstock/Meterstab) abgelesener Zahlenwert, falls
   * die KI auf dem Foto einen lesen konnte — sonst `null`/`undefined`.
   * Forward-kompatibel: Die Edge Function liefert dieses Feld erst NACH dem im
   * Report dokumentierten Patch; bis dahin bleibt es undefined und der
   * Massband-Quercheck (foto-messwert-check.ts) löst bewusst nichts aus.
   */
  messwert?: number | null;
  /** Einheit des abgelesenen Werts (z. B. "cm", "°"). */
  messwertEinheit?: string;
  /**
   * Struktur-Befunde der erweiterten Prüfung (motiv/schärfe/lesbarkeit). Optional &
   * forward-kompatibel: ältere Function-Versionen liefern sie nicht → undefined.
   * `passt` fasst diese Teilurteile bereits fail-closed zusammen (siehe baueFotoVerdict);
   * die Einzelfelder dienen Transparenz/Anzeige und Tests.
   */
  motivOk?: boolean;
  schaerfeOk?: boolean;
  lesbarkeitOk?: boolean;
}

/**
 * Roh-Teilurteile der KI (vor der fail-closed Zusammenfassung). Spiegelt das, was
 * die Edge Function als JSON liefert: Motiv korrekt? scharf genug? Gefordertes
 * lesbar? — jeweils mit einer kurzen deutschen Begründung.
 */
export interface FotoRohUrteil {
  /** Zeigt das Bild inhaltlich das geforderte Motiv? */
  motivOk: boolean;
  /** Ist das Bild scharf genug (nicht verwackelt/unscharf/zu dunkel)? */
  schaerfeOk: boolean;
  /**
   * Ist das auf dem Bild Geforderte LESBAR (z. B. Typenschild, Zählernummer,
   * Meterstab-Skala, Rechnungstext)? Bei Kategorien ohne lesbare Anforderung
   * liefert die KI hier `true`.
   */
  lesbarkeitOk: boolean;
  confidence: number;
  /** Was die KI tatsächlich sieht (kurz). */
  erkannt: string;
  /** Optionaler Klartext-Grund der KI (wird bevorzugt, wenn vorhanden). */
  grund?: string;
}

/** Deutsche Klartext-Gründe je fehlgeschlagenem Teilurteil (Reihenfolge = Priorität). */
const GRUND_TEXT = {
  motiv: 'Falsches Motiv – das Foto zeigt nicht das Geforderte.',
  schaerfe: 'Bild zu unscharf/verwackelt – bitte ein scharfes Foto machen.',
  lesbarkeit: 'Das Geforderte ist nicht lesbar – bitte näher heran und scharf fotografieren.',
} as const;

/**
 * Reine, fail-closed Zusammenfassung der KI-Teilurteile in ein `{ passt, begruendung }`.
 *
 * Regel (Nutzer-Entscheidung): ein Pflichtfoto passt NUR, wenn ALLE drei Achsen
 * positiv sind — richtiges Motiv UND scharf genug UND das Geforderte lesbar.
 * Fällt eine Achse durch, ist `passt=false` und `begruendung` trägt den deutschen
 * Klartext-Grund (Motiv zuerst, dann Schärfe, dann Lesbarkeit), der im Store
 * gespeichert und dem Techniker angezeigt wird.
 *
 * KI- und React-frei → direkt testbar.
 */
export function baueFotoVerdict(roh: FotoRohUrteil): { passt: boolean; begruendung: string } {
  const gruende: string[] = [];
  if (!roh.motivOk) gruende.push(GRUND_TEXT.motiv);
  if (!roh.schaerfeOk) gruende.push(GRUND_TEXT.schaerfe);
  if (!roh.lesbarkeitOk) gruende.push(GRUND_TEXT.lesbarkeit);

  if (gruende.length === 0) {
    // Alles ok → die KI-Begründung (falls vorhanden) durchreichen, sonst neutraler Text.
    return { passt: true, begruendung: (roh.grund ?? '').trim() || 'Foto ok – Motiv, Schärfe und Lesbarkeit bestätigt.' };
  }
  // Fail: bevorzugt den konkreten KI-Grund, ergänzt um die strukturierten Achsen-Gründe.
  const kiGrund = (roh.grund ?? '').trim();
  const achsen = gruende.join(' ');
  return { passt: false, begruendung: kiGrund ? `${kiGrund} (${achsen})` : achsen };
}

/**
 * Soll-Inhalt pro Kategorie für die KI-Prüfung („was MUSS auf dem Bild sein").
 * Präziser als das knappe UI-Label → zuverlässigere Vision-Bewertung.
 * Domänen-Defaults (Wärmepumpen-Thermocheck) — bei Bedarf kalibrieren.
 */
const KI_ERWARTET: Partial<Record<VotBildKategorie, string>> = {
  hausschuhe: 'Hausschuhe / Pantoffeln (getragen oder daneben gestellt) in einer Wohnung — KEIN Screenshot, kein anderes Objekt',
  treppenabgang: 'Eine Treppe bzw. ein Treppenabgang (z. B. in den Heizungskeller)',
  eingang_heizungsraum: 'Tür / Eingang zu einem Heizungsraum',
  heizungsraum: 'Innenraum eines Heizungs-/Technikraums (Heizungskeller)',
  heizungsraum_extra: 'Innenraum eines Heizungs-/Technikraums',
  heizanlage: 'Eine Heizungsanlage / ein Heizkessel (Gas oder Öl) oder dessen Typenschild',
  heizungsanlage: 'Eine Heizungsanlage / ein Heizkessel',
  oeltank: 'Ein oder mehrere Öltanks (Heizöltank im Keller)',
  heizkreisverteiler: 'Ein Heizkreisverteiler (Verteilerbalken für Heiz-/Fußbodenkreise mit Anschlüssen)',
  heizkoerper: 'Ein Heizkörper / Radiator an einer Wand',
  zaehlerschrank: 'Ein elektrischer Zählerschrank / Zählerkasten',
  sicherungen: 'Sicherungsautomaten / Leitungsschutzschalter in einem Verteiler',
  zaehler: 'Ein Stromzähler (Display oder Zählernummer erkennbar)',
  erdung: 'Eine Erdung / Potentialausgleichsschiene (Erdungsklemme/-band)',
  hausanschlusskasten: 'Ein Hausanschlusskasten (HAK) für den Stromhausanschluss',
  aufstellort_option_1: 'Außenbereich an der Hauswand als Aufstellort für die Wärmepumpe-Außeneinheit',
  aufstellort_umgebung_1: 'Außen-Umgebung des geplanten WP-Aufstellorts (Hauswand, Boden, Nachbarschaft, Abstände)',
  aufstellort_alt_1: 'Außenbereich an der Hauswand als alternativer WP-Aufstellort',
  aufstellort_umgebung_alt_1: 'Außen-Umgebung des alternativen WP-Aufstellorts',
  aufstellort_alt_2: 'Außenbereich an der Hauswand als zweiter alternativer WP-Aufstellort',
  aufstellort_umgebung_alt_2: 'Außen-Umgebung des zweiten alternativen WP-Aufstellorts',
  pv_anlage: 'Eine Photovoltaik-Anlage / Solarmodule (auf dem Dach)',
  unbegehbarer_raum: 'Ein Innenraum (ein nicht scan-/begehbarer Raum)',
  // Unterschriften sind Canvas-Captures (keine Foto-Pflichtslots, daher nie über
  // das Inhalts-Gate validiert) — als Erwartung dennoch hinterlegt, falls ein
  // Aufrufer sie je prüft (Vollständigkeit über ALLE Kategorien).
  unterschrift_aufstellort: 'Eine handschriftliche Unterschrift (Signatur) auf hellem Untergrund',
  unterschrift_techniker: 'Eine handschriftliche Unterschrift (Signatur) auf hellem Untergrund',
  unterschrift_kunde_final: 'Eine handschriftliche Unterschrift (Signatur) auf hellem Untergrund',
  wanddicke_fenster_meterstab: 'Eine offene Fensterlaibung mit angelegtem Meterstab/Zollstock, sodass die Wanddicke ablesbar ist',
  wandaufbau: 'Eine Außenwand bzw. deren sichtbarer Schichtaufbau (Putz/Dämmung/Mauerwerk, z. B. an einer Laibung)',
  dachaufbau: 'Ein Dachaufbau von innen (Dachboden/Sparren/Dämmung)',
  bodenaufbau: 'Eine Bodenplatte oder Kellerdecke (Aufbau/Dämmung von unten)',
  fenster_originalrechnung: 'Eine Rechnung oder ein Datenblatt von Fenstern (Foto eines Dokuments mit Text/Tabelle), KEINE Wohnungs-/Objektaufnahme',
  pv_dach: 'Eine Dachfläche von außen (für PV-Modulplanung)',
  pv_drohne: 'Ein Luft-/Drohnenfoto eines Dachs von oben',
  pv_sparrenabstand: 'Dachsparren mit einer Abstandsmessung (Maßband/Zollstock sichtbar)',
  pv_dachziegel: 'Ein einzelner Dachziegel (Vorder- oder Rückseite, evtl. mit Maßband)',
  pv_hindernisse: 'Hindernisse am/ums Gebäude (für die Gerüstplanung)',
  pv_geruest_oeffentlich: 'Eine öffentliche Fläche / Stellplatz für ein Gerüst',
  pv_blitzschutz: 'Eine Blitzschutzanlage (Fangstange/Ableiter am Dach)',
  bewertung_nachweis: 'Ein Screenshot einer Google- oder Trustpilot-Bewertung',
};

function sollInhalt(kategorie: VotBildKategorie): string {
  const explizit = KI_ERWARTET[kategorie];
  if (explizit) return explizit;
  const cfg = BILD_KATEGORIEN[kategorie];
  return `${cfg.label}${cfg.hinweis ? ' — ' + cfg.hinweis : ''}`;
}

/**
 * Kategorien, bei denen etwas KONKRET LESBAR sein muss (Typenschild, Nummer,
 * Skala, Dokumenttext). Steuert nur den Default des Mock-Modes — die echte KI
 * beurteilt Lesbarkeit immer selbst. Bei allen anderen Kategorien ist Lesbarkeit
 * nicht gefordert (Mock liefert `lesbarkeitOk: true`).
 */
const LESBARKEIT_GEFORDERT: ReadonlySet<VotBildKategorie> = new Set<VotBildKategorie>([
  'heizanlage',                 // Typenschild
  'oeltank',                    // Typenschild
  'zaehler',                    // Zählernummer
  'wanddicke_fenster_meterstab', // Meterstab-Skala
  'fenster_originalrechnung',   // Rechnungs-/Datenblatttext
  'pv_sparrenabstand',          // Maßband-Skala
]);

/**
 * Deterministischer Mock je Kategorie für den lokalen Flow-Test (kein KI-Call).
 *
 * Standard: ein PLAUSIBLES, BESTEHENDES Ergebnis (Motiv/Schärfe/Lesbarkeit ok) —
 * so läuft der localhost-Flow durch, der Status wird aber SICHTBAR über die echte
 * Status-Pipeline gesetzt (geprueft:true) statt hart durchgewunken. Anders als der
 * alte Bypass ist das Resultat damit prüf- und testbar (`baueFotoVerdict`).
 *
 * Rein & deterministisch (keine Zufälligkeit) → in Tests direkt verwendbar.
 */
export function mockFotoCheck(kategorie: VotBildKategorie): FotoCheckErgebnis {
  const roh: FotoRohUrteil = {
    motivOk: true,
    schaerfeOk: true,
    lesbarkeitOk: true, // Mock besteht; LESBARKEIT_GEFORDERT dokumentiert nur die Anforderung.
    confidence: 0.9,
    erkannt: `Mock: ${BILD_KATEGORIEN[kategorie].label}`,
    grund: LESBARKEIT_GEFORDERT.has(kategorie)
      ? 'Mock-Prüfung: Motiv, Schärfe und Lesbarkeit (Typenschild/Skala/Text) bestätigt.'
      : 'Mock-Prüfung: Motiv und Schärfe bestätigt.',
  };
  const verdict = baueFotoVerdict(roh);
  return {
    geprueft: true,
    passt: verdict.passt,
    confidence: roh.confidence,
    erkannt: roh.erkannt,
    begruendung: verdict.begruendung,
    motivOk: roh.motivOk,
    schaerfeOk: roh.schaerfeOk,
    lesbarkeitOk: roh.lesbarkeitOk,
    messwert: null,
    messwertEinheit: '',
  };
}

/**
 * Echte Validierung aktiv? In DEV nur wenn `VITE_FOTO_CHECK_REAL=1`. In Prod immer.
 * Sonst läuft der Mock-Mode (sichtbar, deterministisch, testbar).
 */
function echterCheckAktiv(): boolean {
  if (!import.meta.env.DEV) return true;
  return import.meta.env.VITE_FOTO_CHECK_REAL === '1';
}

/**
 * Lässt die KI (Gemini Vision, Edge Function `aufmass-foto-check`) prüfen, ob das
 * Foto wirklich das zeigt, was die Kategorie verlangt.
 *
 * Beratend — bei Fehler / nicht-konfigurierter Function / Offline → null (kein
 * Badge, kein Blockieren des Aufmaß-Flows).
 */
export async function pruefeFotoInhalt(
  quelle: Blob,
  kategorie: VotBildKategorie,
): Promise<FotoCheckErgebnis | null> {
  // DEV-MOCK-MODE (ersetzt den alten Blind-Bypass): In DEV ohne VITE_FOTO_CHECK_REAL=1
  // liefert ein deterministischer Mock je Kategorie ein SICHTBARES, geprüftes Ergebnis
  // über die echte Status-Pipeline — statt das Foto hart als geprüft durchzuwinken. So
  // greift die Validierung im localhost beobachtbar (Badge, Begründung) und ist testbar.
  // Prod-Builds laufen immer gegen die echte KI; echten Check in DEV erzwingen: VITE_FOTO_CHECK_REAL=1.
  if (!echterCheckAktiv()) {
    console.warn('[foto-check] DEV-Mock-Mode aktiv → deterministisches Ergebnis je Kategorie (kein KI-Call). Für echten Check: VITE_FOTO_CHECK_REAL=1 setzen.');
    return mockFotoCheck(kategorie);
  }
  try {
    const { base64, mimeType } = await bildAlsKiBase64(quelle);
    if (!base64) return null;

    const { data, error } = await supabase.functions.invoke('aufmass-foto-check', {
      body: { imageBase64: base64, mimeType, label: sollInhalt(kategorie), hinweis: '' },
    });
    if (error || !data) return null;

    const r = data as Partial<FotoCheckErgebnis>;
    if (!r.geprueft) return null;

    const confidence = typeof r.confidence === 'number' ? r.confidence : 0;
    const erkannt = String(r.erkannt ?? '');
    const messwert = typeof r.messwert === 'number' && !Number.isNaN(r.messwert) ? r.messwert : null;
    const messwertEinheit = typeof r.messwertEinheit === 'string' ? r.messwertEinheit : '';
    const hatAchsen =
      typeof r.motivOk === 'boolean' && typeof r.schaerfeOk === 'boolean' && typeof r.lesbarkeitOk === 'boolean';

    // Liefert die Function die 3 Achsen (Motiv/Schärfe/Lesbarkeit), wird das Urteil
    // fail-closed über dieselbe baueFotoVerdict-Verdichtung wie im Mock gefällt
    // (passt NUR wenn alle drei ok). Ältere Versionen ohne Achsen → r.passt als Fallback.
    if (hatAchsen) {
      const roh: FotoRohUrteil = {
        motivOk: r.motivOk as boolean,
        schaerfeOk: r.schaerfeOk as boolean,
        lesbarkeitOk: r.lesbarkeitOk as boolean,
        confidence,
        erkannt,
        grund: typeof r.begruendung === 'string' ? r.begruendung : undefined,
      };
      const verdict = baueFotoVerdict(roh);
      return {
        geprueft: true,
        passt: verdict.passt,
        confidence,
        erkannt,
        begruendung: verdict.begruendung,
        messwert,
        messwertEinheit,
        motivOk: roh.motivOk,
        schaerfeOk: roh.schaerfeOk,
        lesbarkeitOk: roh.lesbarkeitOk,
      };
    }

    return {
      geprueft: true,
      // Fail-closed: eine ältere Function ohne explizites passt:true (passt === undefined)
      // gilt als NICHT bestanden — statt fail-open durchzuwinken.
      passt: r.passt === true,
      confidence,
      erkannt,
      begruendung: String(r.begruendung ?? ''),
      // Forward-kompatibel: nur übernehmen, wenn die Function eine Zahl liefert.
      messwert,
      messwertEinheit,
      // Struktur-Teilurteile nur übernehmen, wenn die Function sie (als boolean) liefert.
      motivOk: typeof r.motivOk === 'boolean' ? r.motivOk : undefined,
      schaerfeOk: typeof r.schaerfeOk === 'boolean' ? r.schaerfeOk : undefined,
      lesbarkeitOk: typeof r.lesbarkeitOk === 'boolean' ? r.lesbarkeitOk : undefined,
    };
  } catch {
    return null;
  }
}
