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
        <div className="px-4 pt-3 pb-2">
          {/* Top row: Logo left + Step badge right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {showBack && onBack && currentIndex > 0 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0 -ml-2 h-8 w-8"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                </Button>
              ) : null}
              <GalvanekLogo size="sm" className="shrink-0 brightness-0 invert opacity-90 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-primary-foreground/60 uppercase tracking-widest">
                {currentIndex + 1}/{totalSteps}
              </span>
              {canGoForward && onForward && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onForward}
                  className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0 h-8 w-8"
                >
                  <ArrowRight className="w-4.5 h-4.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Title row – compact */}
          <div className="mt-2 mb-1.5">
            <h1 className="text-lg font-bold tracking-tight leading-tight">{title}</h1>
            {description && (
              <p className="text-primary-foreground/70 mt-0.5 text-[13px]">{description}</p>
            )}
          </div>
        </div>

        {/* Stepper dots – tighter */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-start gap-1.5">
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
                      ? 'h-5 w-5 bg-primary-foreground text-primary cursor-pointer hover:scale-110'
                      : isCurrent
                        ? 'h-5 w-5 bg-primary-foreground/30 border-[1.5px] border-primary-foreground animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]'
                        : 'h-2 w-2 bg-primary-foreground/25 cursor-default'
                  )}
                >
                  {isCompleted && <Check className="w-3 h-3" strokeWidth={3} />}
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
