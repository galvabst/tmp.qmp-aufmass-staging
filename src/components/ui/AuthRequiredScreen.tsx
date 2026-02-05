import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GalvanekLogo } from '@/components/GalvanekLogo';

interface AuthRequiredScreenProps {
  message?: string;
}

/**
 * Screen shown when user is not authenticated.
 * Prompts them to log in via the app's login page.
 */
export function AuthRequiredScreen({ message }: AuthRequiredScreenProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <GalvanekLogo className="h-12 w-auto mx-auto opacity-80" />
        
        <div className="bg-secondary border border-border rounded-lg p-6 space-y-4">
          <div className="flex justify-center">
            <LogIn className="h-12 w-12 text-muted-foreground" />
          </div>
          
          <h1 className="text-xl font-semibold text-foreground">
            Anmeldung erforderlich
          </h1>
          
          <p className="text-sm text-muted-foreground">
            {message || 'Du bist in dieser App nicht angemeldet. Bitte logge dich ein, um fortzufahren.'}
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/login')}
          className="w-full gap-2"
        >
          <LogIn className="h-4 w-4" />
          Einloggen
        </Button>

        {/* Optional: Sales OS fallback for internal users */}
        <div className="pt-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = 'https://salesos.lovable.app'}
            className="text-xs text-muted-foreground"
          >
            Interner Mitarbeiter? Mit Sales OS anmelden
          </Button>
        </div>
      </div>
    </div>
  );
}
