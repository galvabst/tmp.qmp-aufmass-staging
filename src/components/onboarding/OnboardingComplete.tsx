import { CheckCircle2, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingCompleteProps {
  onContinue: () => void;
}

export function OnboardingComplete({ onContinue }: OnboardingCompleteProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Success Animation */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-status-accepted/20 flex items-center justify-center animate-pulse">
          <div className="w-24 h-24 rounded-full bg-status-accepted/40 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-status-accepted flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
        <Rocket className="absolute -top-2 -right-2 w-10 h-10 text-primary animate-bounce" />
      </div>

      {/* Text */}
      <h1 className="text-3xl font-bold text-foreground text-center mb-4">
        Du bist einsatzbereit! 🎉
      </h1>
      
      <p className="text-lg text-muted-foreground text-center max-w-md mb-8">
        Herzlichen Glückwunsch! Du hast das Onboarding erfolgreich abgeschlossen 
        und kannst ab sofort Aufträge aus dem Pool annehmen.
      </p>

      {/* Stats */}
      <div className="bg-card rounded-xl p-6 shadow-card w-full max-w-md mb-8">
        <h3 className="font-semibold text-foreground mb-4 text-center">Dein Status</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-sm text-muted-foreground">Profil</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-sm text-muted-foreground">Schulung</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">✓</div>
            <div className="text-sm text-muted-foreground">Coaching</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onContinue} size="lg" className="w-full max-w-md">
        Zum Auftrags-Pool
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Hinweis */}
      <p className="text-sm text-muted-foreground text-center mt-6 max-w-md">
        Dein Quartal-Kontingent beginnt jetzt. Achte darauf, mindestens 24 Aufträge 
        pro Quartal abzuschließen.
      </p>
    </div>
  );
}
