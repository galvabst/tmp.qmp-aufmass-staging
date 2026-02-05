import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseSupabaseSessionResult {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
}

/**
 * Reactive hook for Supabase session management.
 * Uses onAuthStateChange to stay in sync with session changes.
 * Invalidates auth-dependent queries when session changes.
 */
export function useSupabaseSession(): UseSupabaseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up listener BEFORE getting initial session (per Supabase best practices)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('[useSupabaseSession] Auth state changed:', event, newSession?.user?.email);
        setSession(newSession);
        setIsLoading(false);
        
        // Invalidate all auth-dependent queries when session changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-status'] });
          queryClient.invalidateQueries({ queryKey: ['iam'] });
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[useSupabaseSession] Initial session:', initialSession?.user?.email ?? 'none');
      setSession(initialSession);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    session,
    user: session?.user ?? null,
    isLoading,
  };
}
