import { ReactNode } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  OnboardingStepId, 
  STEP_ORDER, 
  getStepIndex,
  isStepCompleted,
} from '@/types/onboarding';
import { ONBOARDING_STEPS } from '@/lib/onboarding-config';
import { OnboardingCountdown } from './OnboardingCountdown';

interface OnboardingStepWrapperProps {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  progress: number;
  erstelltAm?: string;
}

export function OnboardingStepWrapper({
  currentStep,
  completedSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = 'Weiter',
  nextDisabled = false,
  showBack = true,
  progress,
  erstelltAm,
}: OnboardingStepWrapperProps) {
  const currentIndex = getStepIndex(currentStep);
  const totalSteps = STEP_ORDER.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Countdown-Banner */}
      {erstelltAm && (
        <OnboardingCountdown erstelltAm={erstelltAm} />
      )}

      {/* Header mit Schritt-Indikator */}
      <header className="bg-primary text-primary-foreground safe-area-top">
        <div className="p-4">
          {/* Zurück-Button und Schritt-Nummer */}
          <div className="flex items-center gap-3 mb-4">
            {showBack && onBack && currentIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="flex-1">
              <span className="text-sm text-primary-foreground/70">
                Schritt {currentIndex + 1} von {totalSteps}
              </span>
            </div>
          </div>

          {/* Schritt-Titel */}
          <h1 className="text-xl font-bold">{title}</h1>
          {description && (
            <p className="text-primary-foreground/80 mt-1 text-sm">{description}</p>
          )}
        </div>

        {/* Mini-Stepper */}
        <div className="px-4 pb-4">
          <div className="flex gap-1">
            {STEP_ORDER.map((stepId, index) => {
              const isCompleted = isStepCompleted(stepId, completedSteps);
              const isCurrent = stepId === currentStep;
              
              return (
                <div
                  key={stepId}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    isCompleted ? 'bg-primary-foreground' :
                    isCurrent ? 'bg-primary-foreground/70' :
                    'bg-primary-foreground/20'
                  )}
                />
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>

      {/* Footer mit Weiter-Button */}
      <footer className="p-4 border-t bg-background safe-area-bottom">
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
            <span>Gesamtfortschritt</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Button 
          onClick={onNext} 
          disabled={nextDisabled}
          className="w-full"
          size="lg"
        >
          {nextLabel}
        </Button>
      </footer>
    </div>
  );
}
