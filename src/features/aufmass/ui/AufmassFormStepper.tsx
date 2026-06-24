import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { computePhases, phaseIndexForStep, FOTO_STEP_TITLES, type PhaseInstance } from '../data/aufmass-phasen';
import type { PlausibilityIssue } from '../data/aufmass-plausibility';
import { KiAssistent } from './shell/KiAssistent';
import { GalvanekLogo } from '@/components/GalvanekLogo';

export interface StepConfig {
  title: string;
  icon: string;
}

interface AufmassFormStepperProps {
  children: React.ReactNode[];
  steps: StepConfig[];
  renderStep: (index: number) => React.ReactNode;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
  isReadOnly: boolean;
  /** Optional controlled current step. When provided, parent owns the navigation state. */
  currentStep?: number;
  onStepChange?: (step: number) => void;
  /** Per-step: true if required fields are still missing there. Drives status colors. */
  stepHasError?: boolean[];
  /** Total number of missing required fields across all steps. */
  openCount?: number;
  /** Jump to the first step that still has missing required fields. */
  onJumpToFirstError?: () => void;
  /** Live-Plausibilität (beratend) für den KI-Assistenten. Blockt nie. */
  liveWarnings?: PlausibilityIssue[];
  /** Optionaler Banner über dem Schritt-Inhalt (z. B. Geo-Status). */
  topBanner?: React.ReactNode;
}

export function AufmassFormStepper({
  children,
  steps,
  renderStep,
  onBack,
  onSaveDraft,
  onSubmit,
  isSaving,
  isSubmitting,
  isReadOnly,
  currentStep: controlledStep,
  onStepChange,
  stepHasError,
  openCount,
  onJumpToFirstError,
  liveWarnings,
  topBanner,
}: AufmassFormStepperProps) {
  const [internalStep, setInternalStep] = useState(0);
  const isControlled = controlledStep != null;
  const currentStep = isControlled ? controlledStep! : internalStep;
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const totalSteps = steps.length;

  // Clamp step when steps count changes dynamically
  useEffect(() => {
    if (currentStep >= totalSteps) {
      const clamped = totalSteps - 1;
      if (isControlled) onStepChange?.(clamped);
      else setInternalStep(clamped);
    }
  }, [totalSteps, currentStep, isControlled, onStepChange]);

  // Track visited steps from controlled changes too
  useEffect(() => {
    setVisitedSteps(prev => (prev.has(currentStep) ? prev : new Set([...prev, currentStep])));
  }, [currentStep]);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canGoBack = currentStep > 0;
  const canGoForward = currentStep < totalSteps - 1;
  const isLastStep = currentStep === totalSteps - 1;
  const doneCount = [...visitedSteps].filter(i => i !== currentStep && !stepHasError?.[i]).length;
  const hasOpen = openCount != null && openCount > 0;

  const goTo = (step: number) => {
    if (step < 0 || step >= totalSteps) return;
    if (isControlled) onStepChange?.(step);
    else setInternalStep(step);
    setVisitedSteps(prev => new Set([...prev, step]));
  };

  // --- Phasen-Gruppierung (statt 23 flacher Punkte) ---
  const phases = useMemo(() => computePhases(steps), [steps]);
  const currentPhaseIdx = phaseIndexForStep(phases, currentStep);
  const currentPhase = phases[currentPhaseIdx];
  const PhaseIcon = currentPhase?.def.icon;

  type PhaseStatus = 'current' | 'error' | 'done' | 'idle';
  const phaseStatus = (p: PhaseInstance): PhaseStatus => {
    if (p.stepIndices.some(i => stepHasError?.[i])) return 'error';
    if (p.stepIndices.includes(currentStep)) return 'current';
    if (p.stepIndices.every(i => visitedSteps.has(i))) return 'done';
    return 'idle';
  };

  const goToPhase = (p: PhaseInstance) => {
    const target = p.stepIndices.find(i => stepHasError?.[i]) ?? p.stepIndices[0];
    goTo(target);
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-40">
      {/* Header — clean & hell (Galvanek, Orange nur als Akzent · laut Board 6) */}
      <header className="sticky top-0 z-20 safe-area-top bg-white/85 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-6xl mx-auto px-4 pt-3">
          {/* Markenzeile */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 w-9 h-9 -ml-1 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Zurück"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <GalvanekLogo size="sm" />
            <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
              ThermoCheck Aufmaß
            </span>
            <div className="flex-1" />
            {doneCount > 0 && (
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{doneCount}</span>
              </div>
            )}
          </div>

          {/* Schritt-Titel */}
          <div className="flex items-center gap-3 mt-3">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary" aria-hidden="true">
              {PhaseIcon ? <PhaseIcon className="w-5 h-5" /> : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-zinc-400 font-semibold tracking-wide uppercase truncate">
                {currentPhase ? `${currentPhase.def.label} · ` : ''}Schritt {currentStep + 1} / {totalSteps}
              </p>
              <h1 className="text-xl font-bold text-zinc-900 truncate">{steps[currentStep].title}</h1>
            </div>
          </div>

          <Progress value={progress} className="h-1.5 mt-3 bg-zinc-100" />
        </div>

        {/* Phasen-Rail (benannte Cluster statt 23 flacher Punkte) */}
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {phases.map((p, idx) => {
            const st = phaseStatus(p);
            const isCur = idx === currentPhaseIdx;
            const Icon = p.def.icon;
            return (
              <button
                key={p.def.key}
                type="button"
                onClick={() => goToPhase(p)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 min-h-9 text-xs font-semibold transition-colors',
                  isCur && 'border-primary/30 bg-primary/10 text-primary',
                  !isCur && st === 'error' && 'border-amber-200 bg-amber-50 text-amber-700',
                  !isCur && st === 'done' && 'border-transparent text-emerald-600 hover:bg-emerald-50',
                  !isCur && st === 'idle' && 'border-transparent text-zinc-500 hover:bg-zinc-100',
                )}
                aria-current={isCur ? 'step' : undefined}
                aria-label={`Phase ${p.def.label}${st === 'error' ? ' – Pflichtfelder offen' : st === 'done' ? ' – vollständig' : ''}`}
              >
                {st === 'done' && !isCur ? <CheckCircle2 className="w-3.5 h-3.5" />
                  : st === 'error' && !isCur ? <AlertTriangle className="w-3.5 h-3.5" />
                  : <Icon className="w-3.5 h-3.5" />}
                {p.def.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Body: Section + KI-Assistent (Desktop: zweispaltig, Handy: untereinander) */}
      <div className="max-w-6xl mx-auto lg:flex lg:gap-5 lg:items-start lg:p-5">
        <div className="p-4 lg:p-0 lg:flex-1 min-w-0">
          {topBanner && <div className="mb-3">{topBanner}</div>}
          <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 sm:p-6">
            {renderStep(currentStep)}
          </div>
        </div>

        {!isReadOnly && (
          <div className="px-4 pb-4 lg:px-0 lg:w-80 lg:shrink-0">
            <KiAssistent
              stepTitle={steps[currentStep].title}
              phaseLabel={currentPhase?.def.label ?? ''}
              warnings={liveWarnings ?? []}
              hasPhotos={FOTO_STEP_TITLES.has(steps[currentStep].title)}
            />
          </div>
        )}
      </div>

      {/* Bottom: message bar (Fiori-style) + navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom z-20">
        {/* Pflichtfeld-Status (immer sichtbar, nicht erst beim Absenden) */}
        {!isReadOnly && (hasOpen ? (
          <button
            type="button"
            onClick={onJumpToFirstError}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-700 border-b border-amber-500/20 active:bg-amber-500/15 transition-colors"
            role="alert"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium flex-1 text-left">
              {openCount} Pflichtfeld{openCount === 1 ? '' : 'er'} offen
            </span>
            <span className="text-xs font-semibold underline underline-offset-2">Anzeigen</span>
          </button>
        ) : openCount === 0 ? (
          <div className="w-full flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-700 border-b border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">Alle Pflichtfelder vollständig</span>
          </div>
        ) : null)}

        <div className="p-3 flex items-center gap-2 max-w-2xl mx-auto">
          {/* Back */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => goTo(currentStep - 1)}
            disabled={!canGoBack}
            className="shrink-0 rounded-xl h-12 w-12"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          {/* Save Draft */}
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="flex-1 rounded-xl h-12"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Speichern
            </Button>
          )}

          {/* Forward or Submit */}
          {isLastStep && !isReadOnly ? (
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 rounded-xl h-12 bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Einreichen
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => goTo(currentStep + 1)}
              disabled={!canGoForward}
              className="flex-1 rounded-xl h-12 shadow-md"
            >
              Weiter
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
