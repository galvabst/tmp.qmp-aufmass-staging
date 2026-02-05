import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Screen für fehlende Zugriffsrechte
 * Zeigt eine freundliche Nachricht und bietet Navigation zurück
 */
export function AccessDeniedScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Zugriff verweigert
          </h1>
          <p className="text-muted-foreground">
            Du hast keine Berechtigung, auf diesen Bereich zuzugreifen. 
            Wende dich an einen Administrator, wenn du Zugang benötigst.
          </p>
        </div>

        {/* Action */}
        <Button 
          onClick={() => navigate('/')} 
          variant="outline"
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Startseite
        </Button>
      </div>
    </div>
  );
}
