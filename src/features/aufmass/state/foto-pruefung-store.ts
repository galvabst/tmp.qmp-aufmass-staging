/**
 * Geteilter Store für die KI-Foto-Inhaltsprüfung.
 *
 * Die Foto-Felder (PhotoUploadField) stehen über viele Schritte verteilt und
 * mounten/unmounten beim Navigieren. Dieser Modul-Store hält den KI-Prüfstatus
 * pro Bild zentral, damit der Submit-Pfad (AufmassFormPage.handleSubmit)
 * blockieren kann — auch wenn man den betroffenen Schritt längst verlassen hat
 * oder ein Foto in einer früheren Sitzung hochgeladen wurde.
 *
 * Fail-closed (bewusste Nutzer-Entscheidung): Ein Pflichtfoto gilt nur dann als
 * unbedenklich, wenn die KI es positiv als korrektes Motiv bestätigt hat
 * (`status: 'ok'`). „passt_nicht" (falsches Motiv) und „ungeprueft" (KI nicht
 * erreichbar / noch nicht geprüft) blockieren beide das Einreichen. Die
 * Submit-Bewertung selbst liegt in `foto-inhalt-gate.ts` (rein) — dieser Store
 * hält nur den Zustand.
 */

/** Inhalts-Prüfstatus eines Fotos. `ok` = KI bestätigt das geforderte Motiv. */
export type FotoInhaltStatus = 'ok' | 'passt_nicht' | 'ungeprueft';

export interface FotoStatusEintrag {
  status: FotoInhaltStatus;
  /** Anzeigename der Kategorie (z. B. „Galvanek-Hausschuhe") für Meldungen. */
  kategorieLabel: string;
  /** KI-Begründung (z. B. „zeigt Füße statt einer Treppe"). */
  begruendung?: string;
  /** Vertragsstrafe in € bei Verstoß (z. B. Hausschuhe = 10). */
  abzugEuro?: number;
}

const eintraege = new Map<string, FotoStatusEintrag>();
const listeners = new Set<() => void>();
/** Monoton steigender Zähler für useSyncExternalStore (stabile Snapshot-Identität). */
let version = 0;

function emit(): void {
  version += 1;
  listeners.forEach((l) => l());
}

/** Status setzen (e) oder entfernen (null, z. B. nach Löschen des Fotos). */
export function setFotoStatus(bildId: string, e: FotoStatusEintrag | null): void {
  if (e === null) {
    if (!eintraege.delete(bildId)) return;
  } else {
    eintraege.set(bildId, e);
  }
  emit();
}

/** Status eines Fotos (undefined = noch nie geprüft). */
export function getFotoStatus(bildId: string): FotoStatusEintrag | undefined {
  return eintraege.get(bildId);
}

// ---------------------------------------------------------------------------
// Rückwärtskompatible Verdict-API (passt true/false). Intern auf FotoInhaltStatus
// abgebildet. Bestehende Aufrufer/Tests bleiben gültig.
// ---------------------------------------------------------------------------

export interface FotoVerdict {
  /** false = KI sieht nicht das geforderte Motiv → blockiert das Einreichen. */
  passt: boolean;
  kategorieLabel: string;
  begruendung?: string;
  abzugEuro?: number;
}

/** Verdict setzen (v) oder entfernen (null). `passt` → 'ok', sonst 'passt_nicht'. */
export function setFotoVerdict(bildId: string, v: FotoVerdict | null): void {
  if (v === null) {
    setFotoStatus(bildId, null);
    return;
  }
  setFotoStatus(bildId, {
    status: v.passt ? 'ok' : 'passt_nicht',
    kategorieLabel: v.kategorieLabel,
    begruendung: v.begruendung,
    abzugEuro: v.abzugEuro,
  });
}

/** Alle Fotos, die als „passt nicht" (falsches Motiv) erkannt wurden. */
export function getBlockierendeFotos(): FotoVerdict[] {
  return [...eintraege.values()]
    .filter((e) => e.status === 'passt_nicht')
    .map((e) => ({ passt: false, kategorieLabel: e.kategorieLabel, begruendung: e.begruendung, abzugEuro: e.abzugEuro }));
}

export function getBlockierendeAnzahl(): number {
  return getBlockierendeFotos().length;
}

/** Beim Öffnen/Verlassen eines Formulars leeren (kein Cross-Auftrag-Leak). */
export function resetFotoPruefung(): void {
  if (eintraege.size === 0) return;
  eintraege.clear();
  emit();
}

/** Für useSyncExternalStore (Live-Anzeige). */
export function subscribeFotoPruefung(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot-Wert für useSyncExternalStore (ändert sich bei jeder Mutation). */
export function getFotoPruefVersion(): number {
  return version;
}
