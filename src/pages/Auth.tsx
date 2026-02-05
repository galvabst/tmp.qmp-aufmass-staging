import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingLoadingScreen } from '@/components/ui/OnboardingLoadingScreen';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalvanekLogo } from '@/components/GalvanekLogo';

type AuthState = 'processing' | 'success' | 'error' | 'no-tokens';

/**
 * Auth page that handles multiple authentication callback scenarios:
 * 
 * 1. Session transfer from Sales OS:
 *    /auth#access_token=xxx&refresh_token=yyy&type=session_transfer
 * 
 * 2. PKCE code flow (Supabase email links):
 *    /auth?code=xxx
 * 
 * 3. Recovery/Invite links:
 *    /auth#access_token=xxx&refresh_token=yyy&type=recovery
 *    /auth#access_token=xxx&refresh_token=yyy&type=invite
 *    → These redirect to /set-password
 */
export default function Auth() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processAuth = async () => {
      // Check for PKCE code in query params first
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      
      // Parse hash fragment
      const hash = window.location.hash.substring(1);
      const hashParams = hash ? new URLSearchParams(hash) : null;
      
      // Get tokens from hash
      const accessToken = hashParams?.get('access_token');
      const refreshToken = hashParams?.get('refresh_token');
      const authType = hashParams?.get('type') || searchParams.get('type');

      console.log('[Auth] Processing auth callback:', {
        hasCode: !!code,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        type: authType,
      });

      // Case 1: PKCE code flow
      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('[Auth] Code exchange failed:', error);
            setErrorMessage(error.message);
            setState('error');
            return;
          }

          console.log('[Auth] Code exchange successful:', data.user?.email);
          
          // Clear URL params for security
          window.history.replaceState(null, '', '/auth');
          
          // Check if this is a recovery/invite flow
          if (authType === 'recovery' || authType === 'invite') {
            console.log('[Auth] Recovery/Invite flow, redirecting to /set-password');
            navigate('/set-password', { replace: true });
          } else {
            setState('success');
            setTimeout(() => navigate('/', { replace: true }), 500);
          }
          return;
        } catch (err) {
          console.error('[Auth] Unexpected code exchange error:', err);
          setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler');
          setState('error');
          return;
        }
      }

      // Case 2: Hash tokens (Sales OS transfer or email links)
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[Auth] Session set failed:', error);
            setErrorMessage(error.message);
            setState('error');
            return;
          }

          console.log('[Auth] Session set successful:', data.user?.email);
          
          // Clear the hash from URL for security
          window.history.replaceState(null, '', '/auth');

          // Check if this is a recovery/invite flow
          if (authType === 'recovery' || authType === 'invite') {
            console.log('[Auth] Recovery/Invite flow, redirecting to /set-password');
            navigate('/set-password', { replace: true });
          } else {
            setState('success');
            setTimeout(() => navigate('/', { replace: true }), 500);
          }
          return;
        } catch (err) {
          console.error('[Auth] Unexpected session error:', err);
          setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler');
          setState('error');
          return;
        }
      }

      // Case 3: No tokens/code - show login prompt
      console.log('[Auth] No auth data found in URL');
      setState('no-tokens');
    };

    processAuth();
  }, [navigate]);

  // Processing state
  if (state === 'processing') {
    return <OnboardingLoadingScreen message="Anmeldung wird verarbeitet..." />;
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
              ? `Die Anmeldung ist fehlgeschlagen: ${errorMessage}`
              : 'Diese Seite erwartet Anmeldedaten. Bitte logge dich über die Login-Seite ein.'
            }
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => navigate('/login', { replace: true })}
            className="w-full"
          >
            Zum Login
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
