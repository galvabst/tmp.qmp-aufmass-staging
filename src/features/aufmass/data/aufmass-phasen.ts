import { Building2, Flame, ListChecks, MapPin, PenLine, Sun, User, type LucideIcon } from 'lucide-react';

/**
 * Phasen-Gruppierung für den Aufmaß-Wizard (SAP-Fiori-/Material-Stil).
 *
 * Statt 15–23 flacher Schritte werden die Schritte in benannte Phasen geclustert.
 * Quelle der Wahrheit bleibt die Schritt-Liste in AufmassFormPage (BASE_STEPS …);
 * hier wird sie nur per Titel den Phasen zugeordnet. So bleibt PV/ohne-PV
 * automatisch korrekt (Phasen ohne Schritte fallen raus).
 */

export interface PhaseDef {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Schritt-Titel (müssen exakt zu StepConfig.title passen). */
  titles: string[];
}

export const PHASES: PhaseDef[] = [
  { key: 'start', label: 'Start', icon: User, titles: ['Techniker-Daten', 'Kundendaten'] },
  { key: 'gebaeude', label: 'Gebäude', icon: Building2, titles: ['Gebäudedaten'] },
  {
    key: 'heizung',
    label: 'Heizung',
    icon: Flame,
    titles: ['Treppenabgang', 'Eingang Heizungsraum', 'Heizungsraum', 'Heizungsart & Heizanlage', 'Heizkörper', 'Elektrik & Zähler'],
  },
  { key: 'aussen', label: 'Außen & Sanitär', icon: MapPin, titles: ['Aufstellort', 'Sanitär'] },
  { key: 'checks', label: 'Checkliste', icon: ListChecks, titles: ['Checkliste', 'Unbegehbare Räume'] },
  {
    key: 'pv',
    label: 'PV',
    icon: Sun,
    titles: ['PV-Anlage', 'PV: Allgemein', 'PV: Dach', 'PV: Dachziegel', 'PV: Gerüst', 'PV: DC-Kabelführung', 'PV: Unterkonstruktion', 'PV: Blitzschutz', 'PV: Abschluss'],
  },
  { key: 'abschluss', label: 'Abschluss', icon: PenLine, titles: ['Abschluss'] },
];

export interface PhaseInstance {
  def: PhaseDef;
  /** Indizes in der aktuellen steps-Liste, die zu dieser Phase gehören. */
  stepIndices: number[];
}

/** Ordnet die aktuelle steps-Liste den Phasen zu (leere Phasen fallen raus). */
export function computePhases(steps: { title: string }[]): PhaseInstance[] {
  const matched = new Set<number>();
  const result: PhaseInstance[] = [];

  for (const def of PHASES) {
    const stepIndices: number[] = [];
    steps.forEach((s, i) => {
      if (def.titles.includes(s.title)) {
        stepIndices.push(i);
        matched.add(i);
      }
    });
    if (stepIndices.length > 0) result.push({ def, stepIndices });
  }

  // Schema-Drift-Sicherung: nicht zugeordnete Schritte landen in einer Sammel-Phase.
  const rest = steps.map((_, i) => i).filter((i) => !matched.has(i));
  if (rest.length > 0) {
    result.push({ def: { key: 'weiteres', label: 'Weiteres', icon: ListChecks, titles: [] }, stepIndices: rest });
  }

  return result;
}

/** Index der Phase, zu der ein Schritt gehört (oder -1). */
export function phaseIndexForStep(phases: PhaseInstance[], step: number): number {
  return phases.findIndex((p) => p.stepIndices.includes(step));
}

/** Schritt-Titel, die einen Foto-Upload enthalten (für den KI-Assistent-Hinweis). */
export const FOTO_STEP_TITLES = new Set<string>([
  'Techniker-Daten', 'Treppenabgang', 'Eingang Heizungsraum', 'Heizungsraum', 'Heizungsart & Heizanlage',
  'Heizkörper', 'Elektrik & Zähler', 'Aufstellort', 'Unbegehbare Räume', 'Abschluss',
  'PV-Anlage', 'PV: Dach', 'PV: Dachziegel', 'PV: Gerüst', 'PV: Blitzschutz',
]);
