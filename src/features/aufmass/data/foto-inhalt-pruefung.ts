/**
 * Submit-Nachprüfung der Foto-Inhalte (impure Orchestrierung).
 *
 * Der Live-Check in `PhotoUploadField` feuert nur bei frischem Upload. Fotos aus
 * einer FRÜHEREN Sitzung (geöffneter Auftrag) oder aus nie besuchten Schritten
 * haben deshalb keinen Status — bei fail-closed würden sie zu Recht blocken, aber
 * der Techniker hätte keine Chance, sie prüfen zu lassen. Diese Funktion holt das
 * vor dem Absenden nach: für jedes sichtbare Pflichtfoto OHNE positives „ok"
 * (Status undefined oder 'ungeprueft' — Retry) wird das Bild geladen und der
 * KI-Inhalts-Check angestoßen; das Ergebnis landet im Store. Anschließend
 * bewertet `bewerteFotoInhalt` (rein) den Endzustand.
 *
 * 'passt_nicht' wird NICHT erneut geprüft — das ist ein definitives Falsch-Motiv,
 * das der Techniker durch Ersetzen auflösen muss.
 *
 * Alle Abhängigkeiten sind injizierbar → ohne Netz/DB testbar.
 */

import { filterBilderByKategorie, getSignedImageUrl, type VotBild } from '../hooks/useVotBilder';
import { BILD_KATEGORIEN } from './bild-kategorien';
import { sichtbarePflichtFotos, type FotoPraesenzContext } from './foto-praesenz';
import { pruefeFotoInhalt } from './ki-foto-check-client';
import {
  getFotoStatus,
  setFotoStatus,
  type FotoInhaltStatus,
} from '../state/foto-pruefung-store';

export interface InhaltPruefDeps {
  getStatus: (bildId: string) => FotoInhaltStatus | undefined;
  setStatus: (bildId: string, e: import('../state/foto-pruefung-store').FotoStatusEintrag | null) => void;
  /** Lädt die Bilddaten (Default: signierte URL → fetch → Blob). */
  ladeBlob: (bild: VotBild) => Promise<Blob | null>;
  pruefe: typeof pruefeFotoInhalt;
  /** Maximal gleichzeitige Prüfungen (Default 4). */
  parallel?: number;
}

/** Lädt die Bilddaten über eine signierte URL (geteilt mit dem Live-Check).
 *  Wirft NIE — jeder Fehler (auch in getSignedImageUrl) → null. */
export const ladeBildBlob = async (bild: VotBild): Promise<Blob | null> => {
  try {
    const url = await getSignedImageUrl(bild.storage_path);
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
};

function defaultDeps(): InhaltPruefDeps {
  return {
    getStatus: (id) => getFotoStatus(id)?.status,
    setStatus: setFotoStatus,
    ladeBlob: ladeBildBlob,
    pruefe: pruefeFotoInhalt,
  };
}

/** Bilder, deren Inhalt noch nicht positiv bestätigt ist (undefined/'ungeprueft'). */
function offeneFotos(bilder: VotBild[], ctx: FotoPraesenzContext, getStatus: InhaltPruefDeps['getStatus']): VotBild[] {
  const offen: VotBild[] = [];
  for (const slot of sichtbarePflichtFotos(ctx)) {
    for (const bild of filterBilderByKategorie(bilder, slot.kategorie)) {
      const s = getStatus(bild.id);
      if (s !== 'ok' && s !== 'passt_nicht') offen.push(bild); // undefined ODER 'ungeprueft'
    }
  }
  return offen;
}

/** Führt `fn` über `items` mit begrenzter Parallelität aus. */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  // Nicht-endliches/zu kleines limit (NaN, Infinity, 0, negativ) → seriell (1),
  // sonst liefe `Array.from({length: NaN})` leer und NICHTS würde verarbeitet.
  const n = Number.isFinite(limit) && limit >= 1 ? Math.floor(limit) : 1;
  let i = 0;
  const worker = async (): Promise<void> => {
    while (i < items.length) {
      const idx = i;
      i += 1;
      await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, () => worker()));
}

/**
 * Stellt sicher, dass jedes sichtbare Pflichtfoto einen Inhalts-Status hat:
 * prüft alle noch offenen Fotos nach und schreibt das Ergebnis in den Store.
 * Gibt die Anzahl der nachträglich geprüften Fotos zurück (für UI-Hinweise).
 */
export async function stelleFotoInhaltSicher(
  bilder: VotBild[],
  ctx: FotoPraesenzContext,
  deps: Partial<InhaltPruefDeps> = {},
): Promise<number> {
  const d: InhaltPruefDeps = { ...defaultDeps(), ...deps };
  const offen = offeneFotos(bilder, ctx, d.getStatus);
  if (offen.length === 0) return 0;

  await mapLimit(offen, d.parallel ?? 4, async (bild) => {
    const label = BILD_KATEGORIEN[bild.kategorie].label;
    const abzugEuro = BILD_KATEGORIEN[bild.kategorie].abzugEuro;
    // Jede Einzelprüfung kapselt ihren Fehler: ein Wurf darf NICHT den ganzen
    // Submit abbrechen. Im Fehlerfall bleibt das Foto 'ungeprueft' → blockt
    // beim Gate (fail-closed), statt unkontrolliert durchzurutschen.
    try {
      const blob = await d.ladeBlob(bild);
      if (!blob) {
        d.setStatus(bild.id, { status: 'ungeprueft', kategorieLabel: label, begruendung: 'Bild konnte nicht geladen werden' });
        return;
      }
      const erg = await d.pruefe(blob, bild.kategorie);
      if (erg?.geprueft) {
        d.setStatus(bild.id, {
          status: erg.passt ? 'ok' : 'passt_nicht',
          kategorieLabel: label,
          begruendung: erg.begruendung,
          abzugEuro,
        });
      } else {
        d.setStatus(bild.id, { status: 'ungeprueft', kategorieLabel: label, begruendung: 'KI-Prüfung nicht verfügbar' });
      }
    } catch {
      d.setStatus(bild.id, { status: 'ungeprueft', kategorieLabel: label, begruendung: 'Prüfung fehlgeschlagen' });
    }
  });

  return offen.length;
}
