import { AlertTriangle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalvanekLogo } from '@/components/GalvanekLogo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NoContractorAccessScreenProps {
  userEmail?: string;
}

export function NoContractorAccessScreen({ userEmail }: NoContractorAccessScreenProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info('Abgemeldet');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <GalvanekLogo className="h-12 w-auto mx-auto opacity-80" />
        
        <div className="bg-secondary border border-border rounded-lg p-6 space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-xl font-semibold text-foreground">
            Kein Contractor-Zugang
          </h1>
          
          <p className="text-sm text-muted-foreground">
            Für dieses Konto{userEmail ? ` (${userEmail})` : ''} wurde noch kein Contractor-Onboarding angelegt.
          </p>
          
          <p className="text-xs text-muted-foreground">
            Bitte wende dich an einen Administrator, um als Contractor freigeschaltet zu werden.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </div>
  );
}
