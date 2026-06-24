import meterstab from '@/assets/aufmass/beispiele/wanddicke-meterstab.webp';
import fassade from '@/assets/aufmass/beispiele/fassade-uebersicht.webp';
import laibung from '@/assets/aufmass/beispiele/laibung-daemmung.webp';

/**
 * Illustrative Beispielbilder „so sieht ein gutes Foto aus" für den U-Werte-Foto-Wizard
 * und das Hilfe-Sheet. KI-generiert (nano_banana) → bewusst als „Beispiel (illustrativ)"
 * gekennzeichnet (FotoBeispiel-Komponente), niemals als belastbarer Messwert. Captions
 * erklären, WORAUF zu achten ist — sie behaupten nicht, dass das Bild den Befund beweist.
 */
export interface FotoBeispielData {
  src: string;
  alt: string;
  caption: string;
}

/** Beispiel je U-Werte-Foto-View (Slug in UWerteAIPanel). Nur Views mit verlässlichem Bild. */
export const VIEW_BEISPIEL: Record<string, FotoBeispielData | undefined> = {
  fenster_laibung_meterstab: {
    src: meterstab,
    alt: 'Zollstock quer in einer offenen Fensterlaibung, Wanddicke ablesbar',
    caption: 'So geht das wichtigste Maß: Fenster auf, Zollstock/Meterstab quer durch die Laibung legen (die Tiefe = Wanddicke) und so fotografieren, dass die Zahl lesbar ist.',
  },
  fassade_uebersicht: {
    src: fassade,
    alt: 'Ganze Hausfassade gerade von vorn fotografiert',
    caption: 'Stell dich gerade vor die Hauswand und nimm die ganze Wand auf — Putz/Klinker, Fenster und Fensterstil müssen drauf sein.',
  },
  laibung_daemmung: {
    src: laibung,
    alt: 'Offene Fensterlaibung von innen mit Blick auf den seitlichen Wandaufbau',
    caption: 'Offene Laibung von innen: hier auf eine helle Dämmschicht zwischen Mauer und Fensterrahmen achten und sie fotografieren. Siehst du nur Mauer/Putz ohne Dämmung → kein Problem, dieses Feld ist optional.',
  },
};

/** Beispiel je Hilfe-Feld-Key (fürs Hilfe-Sheet) — wiederverwendete Bilder. */
export const FELD_BEISPIEL: Record<string, FotoBeispielData | undefined> = {
  'u_werte.aussenwand.mauerwerk_cm': VIEW_BEISPIEL.fenster_laibung_meterstab,
  fassade_gedaemmt: VIEW_BEISPIEL.fassade_uebersicht,
};
