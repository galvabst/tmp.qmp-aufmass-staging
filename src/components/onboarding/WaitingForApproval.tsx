import { Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function WaitingForApproval() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <Clock className="w-8 h-8 text-primary absolute -bottom-1 -right-1 animate-pulse" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Onboarding abgeschlossen!</h1>
          
          <p className="text-muted-foreground mb-6">
            Du hast alle Schritte erfolgreich absolviert. 
            Bitte warte auf die Freigabe durch deinen Trainer.
          </p>
          
          <div className="bg-muted/50 rounded-lg p-4 w-full">
            <p className="text-sm text-muted-foreground">
              <strong>Nächster Schritt:</strong><br />
              Nach deinem Coaching-Termin wird dein Trainer deine Freigabe erteilen.
              Du erhältst dann Zugang zur App.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
