import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { ONBOARDING_STORAGE_KEY_PREFIX } from '@/lib/onboarding-storage';

// Same thermocheck client as useAkademieContent
const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

/**
 * Hook to fetch completed lektion IDs from contractor_akademie_lektions_fortschritt.
 * Returns a Set<string> of lektion_ids with status 'completed'.
 */
export function useAkademieFortschritt(contractorId: string | null) {
  return useQuery({
    queryKey: ['akademie-fortschritt', contractorId],
    queryFn: async (): Promise<Set<string>> => {
      if (!contractorId) return new Set();

      const { data, error } = await thermocheckClient
        .from('contractor_akademie_lektions_fortschritt')
        .select('lektion_id')
        .eq('contractor_id', contractorId)
        .eq('status', 'completed');

      if (error) {
        console.warn('[AkademieFortschritt] Error fetching progress:', error);
        return new Set();
      }

      const ids = new Set((data || []).map((row: { lektion_id: string }) => row.lektion_id));
      console.log(`[AkademieFortschritt] Loaded ${ids.size} completed lektionen`);
      return ids;
    },
    enabled: !!contractorId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Fetch video_progress_seconds for a specific lektion from DB.
 * Used to restore video position after page reload.
 */
export function useLektionVideoProgress(contractorId: string | null, lektionId: string | undefined) {
  return useQuery({
    queryKey: ['lektion-video-progress', contractorId, lektionId],
    queryFn: async (): Promise<number> => {
      if (!contractorId || !lektionId) return 0;

      const { data, error } = await thermocheckClient
        .from('contractor_akademie_lektions_fortschritt')
        .select('video_progress_seconds')
        .eq('contractor_id', contractorId)
        .eq('lektion_id', lektionId)
        .maybeSingle();

      if (error) {
        console.warn('[LektionVideoProgress] Error:', error);
        return 0;
      }

      return data?.video_progress_seconds ?? 0;
    },
    enabled: !!contractorId && !!lektionId,
    staleTime: 0, // Always fresh on mount
  });
}

/**
 * Fetch the contractor's onboarding ID for the current auth user.
 * Uses get_my_contractor_onboarding RPC which returns the onboarding record.
 */
export function useMyContractorOnboardingId() {
  return useQuery({
    queryKey: ['my-contractor-onboarding-id'],
    queryFn: async (): Promise<string | null> => {
      // Try thermocheck schema first
      const { data, error } = await thermocheckClient.rpc('get_my_contractor_onboarding');

      if (error) {
        console.warn('[useMyContractorOnboardingId] RPC failed:', error);
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        return data[0].id || null;
      }
      return null;
    },
    staleTime: 10 * 60 * 1000, // Cache 10 min
  });
}

/**
 * Check if a specific lektion has already been completed.
 * Checks DB progress first (always — across devices/sessions), then localStorage as fallback.
 * If `dbCompletedIds` is not provided, the hook fetches the current user's progress itself.
 */
export function useIsLektionAlreadyCompleted(
  lektionId: string | undefined,
  dbCompletedIds?: Set<string>
): boolean {
  // Auto-fetch DB completion set when caller didn't pass one in
  const { data: onboardingId } = useMyContractorOnboardingId();
  const shouldAutoFetch = dbCompletedIds === undefined;
  const { data: autoFetchedIds } = useAkademieFortschritt(
    shouldAutoFetch ? (onboardingId ?? null) : null
  );
  const effectiveDbIds = dbCompletedIds ?? autoFetchedIds;

  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!lektionId) {
      setIsCompleted(false);
      return;
    }

    // 1. DB fortschritt — authoritative source, works across devices
    if (effectiveDbIds?.has(lektionId)) {
      setIsCompleted(true);
      return;
    }

    // 2. localStorage onboarding state (legacy fallback)
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(ONBOARDING_STORAGE_KEY_PREFIX));

      for (const key of keys) {
        const saved = localStorage.getItem(key);
        if (!saved) continue;

        const state = JSON.parse(saved);
        const hauptmodule = state?.akademieHauptmodule;
        if (!Array.isArray(hauptmodule)) continue;

        for (const hm of hauptmodule) {
          for (const up of (hm.unterpunkte || [])) {
            if (up.id === lektionId && up.abgeschlossen) {
              setIsCompleted(true);
              return;
            }
            for (const child of (up.children || [])) {
              if (child.id === lektionId && child.abgeschlossen) {
                setIsCompleted(true);
                return;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[useIsLektionAlreadyCompleted] Error reading localStorage:', e);
    }

    setIsCompleted(false);
  }, [lektionId, effectiveDbIds]);

  return isCompleted;
}

