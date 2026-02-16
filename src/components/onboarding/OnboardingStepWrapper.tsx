import { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
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
import { GalvanekLogo } from '@/components/GalvanekLogo';

interface OnboardingStepWrapperProps {
  currentStep: OnboardingStepId;
  completedSteps: OnboardingStepId[];
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  onForward?: () => void;
  onStepClick?: (stepId: OnboardingStepId) => void;
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
  onForward,
  onStepClick,
  nextLabel = 'Weiter',
  nextDisabled = false,
  showBack = true,
  progress,
  erstelltAm,
}: OnboardingStepWrapperProps) {
  const currentIndex = getStepIndex(currentStep);
  const totalSteps = STEP_ORDER.length;
  const canGoForward = completedSteps.includes(currentStep) && currentIndex < totalSteps - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Countdown-Banner */}
      {erstelltAm && (
        <OnboardingCountdown erstelltAm={erstelltAm} />
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-b-2xl shadow-lg safe-area-top">
        <div className="p-4 pb-2">
          {/* Top row: Back + Step info + Logo */}
          <div className="flex items-center gap-3">
            {showBack && onBack && currentIndex > 0 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            ) : (
              <div className="w-10" />
            )}
            <div className="flex-1 text-center">
              <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wider">
                Schritt {currentIndex + 1} von {totalSteps}
              </span>
            </div>
            {canGoForward && onForward ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onForward}
                className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            ) : (
              <div className="w-10" />
            )}
            <GalvanekLogo size="sm" className="shrink-0 brightness-0 invert opacity-80" />
          </div>

          {/* Title */}
          <div className="mt-3 mb-2 text-center">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-primary-foreground/75 mt-1 text-sm">{description}</p>
            )}
          </div>
        </div>

        {/* Stepper dots */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-2">
            {STEP_ORDER.map((stepId, index) => {
              const isCompleted = isStepCompleted(stepId, completedSteps);
              const isCurrent = stepId === currentStep;
              
              const isClickable = (isCompleted || isCurrent) && onStepClick;
              
              return (
                <button
                  key={stepId}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick(stepId)}
                  className={cn(
                    'rounded-full transition-all duration-300 flex items-center justify-center',
                    isCompleted
                      ? 'h-6 w-6 bg-primary-foreground text-primary cursor-pointer hover:scale-110'
                      : isCurrent
                        ? 'h-6 w-6 bg-primary-foreground/30 border-2 border-primary-foreground animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]'
                        : 'h-2.5 w-2.5 bg-primary-foreground/25 cursor-default'
                  )}
                >
                  {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] bg-background safe-area-bottom">
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Gesamtfortschritt</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Button 
          onClick={onNext} 
          disabled={nextDisabled}
          className="w-full gap-2"
          size="lg"
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </footer>
    </div>
  );
}
