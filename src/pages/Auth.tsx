import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingLoadingScreen } from '@/components/ui/OnboardingLoadingScreen';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalvanekLogo } from '@/components/GalvanekLogo';

type AuthState = 'processing' | 'success' | 'error' | 'no-tokens';

/**
 * Auth page that handles session transfer from Sales OS.
 * 
 * Expected URL format:
 * /auth#access_token=xxx&refresh_token=yyy&type=session_transfer
 */
export default function Auth() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processSessionTransfer = async () => {
      // Parse the hash fragment
      const hash = window.location.hash.substring(1); // Remove the leading #
      if (!hash) {
        console.log('[Auth] No hash fragment found');
        setState('no-tokens');
        return;
      }

      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const transferType = hashParams.get('type');

      console.log('[Auth] Processing session transfer:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: transferType,
      });

      if (!accessToken || !refreshToken) {
        console.warn('[Auth] Missing tokens in URL');
        setState('no-tokens');
        return;
      }

      try {
        // Set the session using the tokens from the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('[Auth] Session transfer failed:', error);
          setErrorMessage(error.message);
          setState('error');
          return;
        }

        console.log('[Auth] Session transfer successful:', data.user?.email);
        setState('success');

        // Clear the hash from URL for security
        window.history.replaceState(null, '', '/auth');

        // Redirect to home page
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } catch (err) {
        console.error('[Auth] Unexpected error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler');
        setState('error');
      }
    };

    processSessionTransfer();
  }, [navigate]);

  // Processing state
  if (state === 'processing') {
    return <OnboardingLoadingScreen message="Session wird übertragen..." />;
  }

  // Success state (brief)
  if (state === 'success') {
    return <OnboardingLoadingScreen message="Anmeldung erfolgreich! Weiterleitung..." />;
  }

  // Error or no tokens state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <GalvanekLogo className="h-12 w-auto mx-auto opacity-80" />
        
        <div className="bg-secondary border border-border rounded-lg p-6 space-y-4">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          
          <h1 className="text-xl font-semibold text-foreground">
            {state === 'error' ? 'Anmeldung fehlgeschlagen' : 'Keine Anmeldedaten'}
          </h1>
          
          <p className="text-sm text-muted-foreground">
            {state === 'error' 
              ? `Die Session konnte nicht übertragen werden: ${errorMessage}`
              : 'Diese Seite erwartet Anmeldedaten aus Sales OS. Bitte logge dich über Sales OS ein.'
            }
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => window.location.href = 'https://salesos.lovable.app'}
            className="w-full"
          >
            Zu Sales OS
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/', { replace: true })}
          >
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  );
}
