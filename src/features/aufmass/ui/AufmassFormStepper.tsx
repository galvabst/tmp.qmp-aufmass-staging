import { useState, useEffect, ReactElement, cloneElement, isValidElement } from 'react';
import { ArrowLeft, ArrowRight, Save, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
}: AufmassFormStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const totalSteps = steps.length;

  // Clamp step when steps count changes dynamically
  useEffect(() => {
    if (currentStep >= totalSteps) {
      setCurrentStep(totalSteps - 1);
    }
  }, [totalSteps, currentStep]);

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canGoBack = currentStep > 0;
  const canGoForward = currentStep < totalSteps - 1;
  const isLastStep = currentStep === totalSteps - 1;

  const goTo = (step: number) => {
    setCurrentStep(step);
    setVisitedSteps(prev => new Set([...prev, step]));
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-32">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground safe-area-top sticky top-0 z-10 shadow-lg">
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center backdrop-blur-sm active:bg-primary-foreground/25 transition-colors"
              aria-label="Zurück"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center text-xl backdrop-blur-sm">
              {steps[currentStep].icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-primary-foreground/60 font-medium tracking-wide uppercase">
                Schritt {currentStep + 1} / {totalSteps}
              </p>
              <h1 className="text-lg font-bold truncate">{steps[currentStep].title}</h1>
            </div>
            {visitedSteps.size > 1 && (
              <div className="flex items-center gap-1 bg-primary-foreground/10 rounded-full px-2.5 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{visitedSteps.size - 1}</span>
              </div>
            )}
          </div>
          <Progress value={progress} className="h-1 bg-primary-foreground/15" />
        </div>

        {/* Step dots */}
        <div className="px-4 pb-3 flex gap-1 overflow-x-auto scrollbar-hide">
          {steps.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`shrink-0 h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-6 bg-primary-foreground'
                  : visitedSteps.has(i)
                    ? 'w-2 bg-primary-foreground/50'
                    : 'w-2 bg-primary-foreground/20'
              }`}
              aria-label={`Schritt ${i + 1}: ${step.title}`}
            />
          ))}
        </div>
      </header>

      {/* Current section — only the active step is rendered */}
      <div className="p-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
          {renderStep(currentStep)}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom z-10">
        <div className="p-3 flex items-center gap-2 max-w-lg mx-auto">
          {/* Back */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => goTo(currentStep - 1)}
            disabled={!canGoBack}
            className="shrink-0 rounded-xl"
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
              className="flex-1 rounded-xl h-10"
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
              className="flex-1 rounded-xl h-10 bg-green-600 hover:bg-green-700 text-white shadow-md"
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
              className="flex-1 rounded-xl h-10 shadow-md"
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
