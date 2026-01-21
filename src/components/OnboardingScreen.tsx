import { CheckCircle2, Circle, Loader2, FileText, GraduationCap, Wrench, Plane, Shirt } from 'lucide-react';
import { OnboardingProgress, OnboardingStepStatus } from '@/types/technician';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingScreenProps {
  progress: OnboardingProgress;
  onBookTraining?: (stepId: string) => void;
}

const stepIcons: Record<string, React.ElementType> = {
  gewerbeschein: FileText,
  pflichtutensilien: Wrench,
  drohne: Plane,
  kleidung: Shirt,
  akademie_zertifikat: GraduationCap,
};

function StepIcon({ status }: { status: OnboardingStepStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="w-6 h-6 text-status-accepted" />;
  }
  if (status === 'in_progress') {
    return <Loader2 className="w-6 h-6 text-primary animate-spin" />;
  }
  return <Circle className="w-6 h-6 text-muted-foreground" />;
}

export function OnboardingScreen({ progress, onBookTraining }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top">
        <div className="p-6 pt-8 text-center">
          <h1 className="text-2xl font-bold">Willkommen bei Thermocheck</h1>
          <p className="text-primary-foreground/80 mt-2">
            Schließe dein Onboarding ab, um Aufträge anzunehmen
          </p>
        </div>
      </header>

      {/* Progress */}
      <div className="p-6">
        <div className="bg-card rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Fortschritt</span>
            <span className="text-sm font-bold text-foreground">{progress.progressPercent}%</span>
          </div>
          <Progress value={progress.progressPercent} className="h-3" />
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 p-6 pt-0">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Deine Schritte</h2>
        <div className="space-y-3">
          {progress.steps.map((step, index) => {
            const StepTypeIcon = stepIcons[step.id] || Circle;
            const isCurrentStep = step.status === 'in_progress';
            
            return (
              <div
                key={step.id}
                className={cn(
                  'bg-card rounded-xl p-4 shadow-card transition-all',
                  isCurrentStep && 'ring-2 ring-primary'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center',
                    step.status === 'completed' ? 'bg-status-accepted/10' :
                    step.status === 'in_progress' ? 'bg-primary/10' :
                    'bg-muted'
                  )}>
                    <StepTypeIcon className={cn(
                      'w-6 h-6',
                      step.status === 'completed' ? 'text-status-accepted' :
                      step.status === 'in_progress' ? 'text-primary' :
                      'text-muted-foreground'
                    )} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Schritt {index + 1}</span>
                      <StepIcon status={step.status} />
                    </div>
                    <p className={cn(
                      'font-medium',
                      step.status === 'pending' && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </p>
                    {step.completedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Abgeschlossen am {new Date(step.completedAt).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>

                  {step.status === 'in_progress' && onBookTraining && (
                    <Button 
                      size="sm" 
                      onClick={() => onBookTraining(step.id)}
                    >
                      Termin buchen
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-6 pt-0">
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Nach Abschluss des Onboardings kannst du sofort Aufträge aus dem Pool annehmen.
          </p>
        </div>
      </div>
    </div>
  );
}
