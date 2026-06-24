/**
 * Reine Präsenz-Prüfung der Pflichtfotos für den Submit-Pfad.
 *
 * Hintergrund (Audit-Finding, high): Bisher prüfte handleSubmit NUR
 *  (1) zod-Pflichtfelder, (2) KI-„passt-nicht"-Verdicts, (3) Plausibilität.
 * Ob in den Foto-Pflicht-Schritten überhaupt ein Foto existiert, wurde NIE
 * erzwungen — `minAnzahl` war nur ein Anzeige-Hinweis. Folge: ein Aufmaß ließ
 * sich mit 0 Fotos einreichen (Kernzweck des Formulars faktisch unverbindlich).
 *
 * Diese Funktion ist absichtlich KI-UNABHÄNGIG und deterministisch: sie zählt
 * nur, ob je Pflicht-Kategorie genügend Bilder vorliegen. So bleibt der harte
 * Foto-Schutz auch dann erhalten, wenn die (bewusst fail-open) KI-Inhalts-
 * prüfung offline/nicht deployt ist.
 *
 * Sichtbarkeit wird gespiegelt: PV-Kategorien nur wenn das PV-Aufmaß aktiv ist,
 * Aufstellort-Alternativen nur wenn der Techniker sie als vorhanden markiert hat
 * — sonst gäbe es Fehlalarme für gar nicht eingeblendete Felder.
 */

import { BILD_KATEGORIEN, VotBildKategorie } from './bild-kategorien';
import { filterBilderByKategorie, type VotBild } from '../hooks/useVotBilder';

/** Eingangskontext für die Sichtbarkeit bedingter Foto-Schritte. */
export interface FotoPraesenzContext {
  /** PV-Aufmaß aktiv (kein_pv / showPvSteps) → PV-Foto-Schritte sichtbar. */
  istPvAufmass: boolean;
  /** Heizungsart === 'oel' → Öltank-Fotos sichtbar/erforderlich. */
  istOel: boolean;
  /** „Mehr Bilder Heizungsraum" gewählt → Extra-Heizungsraum-Schritt sichtbar. */
  mehrBilderHeizungsraum: boolean;
  /** Erdung vorhanden → Erdungs-Foto erforderlich. */
  hatErdung: boolean;
  /** 1. Alternative Aufstellort vorhanden → Alt-1-Fotos erforderlich. */
  alternative1Vorhanden: boolean;
  /** 2. Alternative Aufstellort vorhanden → Alt-2-Fotos erforderlich. */
  alternative2Vorhanden: boolean;
  /** anzahl_unbegehbare_raeume > 0 → Foto-Nachweis je unbegehbarem Raum. */
  hatUnbegehbareRaeume?: boolean;
  /** Bestehende PV-Anlage (hat_pv_anlage) → Foto der vorhandenen Anlage. */
  hatPvAnlage?: boolean;
  /** PV-Planung: Hindernisse für die Gerüstplanung vorhanden → Foto. */
  pvHindernisseVorhanden?: boolean;
  /** PV-Planung: Gerüst auf öffentlicher Fläche → Foto des Standorts. */
  pvOeffentlicheFlaeche?: boolean;
  /** PV-Planung: Blitzschutzanlage vorhanden → Foto. */
  pvBlitzschutzVorhanden?: boolean;
  /** U-Werte: Fenster wurden getauscht → Original-Rechnung als Nachweis-Foto. */
  fensterGetauscht?: boolean;
}

export interface FehlendesFoto {
  kategorie: VotBildKategorie;
  label: string;
  /** Aktuell vorhandene Bilder dieser Kategorie. */
  vorhanden: number;
  /** Geforderte Mindestanzahl (config.minAnzahl). */
  minAnzahl: number;
  /** BASE_STEPS-Index des zugehörigen Foto-Schritts. */
  step: number;
}

/**
 * Foto-Pflicht-Kategorien mit ihrem Stepper-Schritt und (optional) einer
 * Sichtbarkeits-Bedingung. Bewusst kuratiert (statt blind alle minAnzahl>0),
 * damit nur die tatsächlich eingeblendeten Pflicht-Schritte zählen.
 *
 * Schritt-Indizes = BASE_STEPS in AufmassFormPage (unabhängig von der PV-Variante,
 * da PV-Schritte hinten angehängt werden). PV-Schritte starten bei Index 15
 * (14 = PV-Allgemein ohne Foto).
 */
const PFLICHT_FOTOS: ReadonlyArray<{
  kategorie: VotBildKategorie;
  step: number;
  sichtbar?: (ctx: FotoPraesenzContext) => boolean;
}> = [
  // Galvanek-Hausschuhe — im Techniker-Schritt (Index 0). Pflicht (minAnzahl 1):
  // ohne Nachweis greift der 10-€-Vertragsabzug (BILD_KATEGORIEN.hausschuhe) nicht.
  { kategorie: 'hausschuhe', step: 0 },
  // U-Werte / Gebäudehülle — im Gebäudedaten-Schritt (Index 2, kein Index-Shift).
  // Pflicht ist nur der MACHBARE Nachweis: Wanddicke per Meterstab im Fenster.
  // wandaufbau/dachaufbau/bodenaufbau sind optional (Schichtaufbau einer
  // geschlossenen Wand ist ohne Aufbruch nicht fotografierbar → minAnzahl 0).
  { kategorie: 'wanddicke_fenster_meterstab', step: 2 },
  { kategorie: 'fenster_originalrechnung', step: 2, sichtbar: (c) => c.fensterGetauscht === true },
  // Reine Foto-Schritte (immer sichtbar)
  { kategorie: 'treppenabgang', step: 3 },
  { kategorie: 'eingang_heizungsraum', step: 4 },
  // Heizungsraum (Schritt 5)
  { kategorie: 'heizungsraum', step: 5 },
  { kategorie: 'heizungsraum_extra', step: 5, sichtbar: (c) => c.mehrBilderHeizungsraum },
  // Heizungsart & Heizanlage (Schritt 6)
  { kategorie: 'heizanlage', step: 6 },
  { kategorie: 'oeltank', step: 6, sichtbar: (c) => c.istOel },
  // Heizkörper (Schritt 7)
  { kategorie: 'heizkreisverteiler', step: 7 },
  { kategorie: 'heizkoerper', step: 7 },
  // Elektrik & Zähler (Schritt 8)
  { kategorie: 'zaehlerschrank', step: 8 },
  { kategorie: 'sicherungen', step: 8 },
  { kategorie: 'zaehler', step: 8 },
  { kategorie: 'erdung', step: 8, sichtbar: (c) => c.hatErdung },
  { kategorie: 'hausanschlusskasten', step: 8 },
  // Aufstellort (Schritt 9)
  { kategorie: 'aufstellort_option_1', step: 9 },
  { kategorie: 'aufstellort_umgebung_1', step: 9 },
  { kategorie: 'aufstellort_alt_1', step: 9, sichtbar: (c) => c.alternative1Vorhanden },
  { kategorie: 'aufstellort_umgebung_alt_1', step: 9, sichtbar: (c) => c.alternative1Vorhanden },
  { kategorie: 'aufstellort_alt_2', step: 9, sichtbar: (c) => c.alternative1Vorhanden && c.alternative2Vorhanden },
  { kategorie: 'aufstellort_umgebung_alt_2', step: 9, sichtbar: (c) => c.alternative1Vorhanden && c.alternative2Vorhanden },
  // Unbegehbare Räume (Schritt 12) — Nachweis nur wenn welche angegeben sind.
  { kategorie: 'unbegehbarer_raum', step: 12, sichtbar: (c) => c.hatUnbegehbareRaeume === true },
  // Bestehende PV-Anlage (Schritt 13) — Foto nur wenn vorhanden.
  { kategorie: 'pv_anlage', step: 13, sichtbar: (c) => c.hatPvAnlage === true },
  // PV-Aufmaß (nur wenn aktiv; Foto-Schritte 15–20)
  { kategorie: 'pv_dach', step: 15, sichtbar: (c) => c.istPvAufmass },
  { kategorie: 'pv_sparrenabstand', step: 15, sichtbar: (c) => c.istPvAufmass },
  { kategorie: 'pv_dachziegel', step: 16, sichtbar: (c) => c.istPvAufmass },
  // PV: Gerüst (Schritt 17) — je nur bei der jeweiligen Bedingung (kein Fehlalarm).
  { kategorie: 'pv_hindernisse', step: 17, sichtbar: (c) => c.istPvAufmass && c.pvHindernisseVorhanden === true },
  { kategorie: 'pv_geruest_oeffentlich', step: 17, sichtbar: (c) => c.istPvAufmass && c.pvOeffentlicheFlaeche === true },
  // PV: Blitzschutz (Schritt 20) — nur wenn eine Anlage vorhanden ist.
  { kategorie: 'pv_blitzschutz', step: 20, sichtbar: (c) => c.istPvAufmass && c.pvBlitzschutzVorhanden === true },
];

/** Eine sichtbare Pflicht-Foto-Kategorie (Anzeige- und Gate-Quelle). */
export interface SichtbarePflichtKategorie {
  kategorie: VotBildKategorie;
  step: number;
}

/** Stepper-Schritt einer Pflicht-Foto-Kategorie (undefined = nicht in PFLICHT_FOTOS). */
export function stepFuerKategorie(kategorie: VotBildKategorie): number | undefined {
  return PFLICHT_FOTOS.find((e) => e.kategorie === kategorie)?.step;
}

/**
 * Die im aktuellen Kontext SICHTBAREN Pflicht-Foto-Kategorien (minAnzahl > 0).
 * Einzige Quelle für „welche Foto-Slots sind hier verpflichtend" — sowohl die
 * Präsenz-Prüfung (genug Fotos?) als auch das Inhalts-Gate (richtiges Motiv?)
 * leiten daraus ab, damit beide exakt dieselben Slots betrachten.
 */
export function sichtbarePflichtFotos(ctx: FotoPraesenzContext): SichtbarePflichtKategorie[] {
  return PFLICHT_FOTOS
    .filter((e) => !e.sichtbar || e.sichtbar(ctx))
    .filter((e) => BILD_KATEGORIEN[e.kategorie].minAnzahl > 0)
    .map((e) => ({ kategorie: e.kategorie, step: e.step }));
}

/**
 * Liefert alle Pflicht-Foto-Kategorien, die (sichtbar, aber) zu wenige Bilder
 * haben. Leeres Array = alle Pflichtfotos vollständig.
 */
export function pruefeFotoPraesenz(
  bilder: VotBild[],
  ctx: FotoPraesenzContext,
): FehlendesFoto[] {
  const fehlend: FehlendesFoto[] = [];
  for (const eintrag of sichtbarePflichtFotos(ctx)) {
    const config = BILD_KATEGORIEN[eintrag.kategorie];
    const vorhanden = filterBilderByKategorie(bilder, eintrag.kategorie).length;
    if (vorhanden < config.minAnzahl) {
      fehlend.push({
        kategorie: eintrag.kategorie,
        label: config.label,
        vorhanden,
        minAnzahl: config.minAnzahl,
        step: eintrag.step,
      });
    }
  }
  return fehlend;
}
