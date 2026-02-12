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
 * 
 * BUG FIX: Changed .eq('onboarding_id', ...) to .eq('contractor_id', ...) 
 * to match the actual column name in the table.
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
 * Check if a specific lektion has already been completed.
 * Checks both localStorage (onboarding state) and DB progress (via useAkademieFortschritt).
 * 
 * Returns true if the lektion is marked as abgeschlossen in localStorage
 * OR if it exists in the DB fortschritt set.
 */
export function useIsLektionAlreadyCompleted(
  lektionId: string | undefined,
  dbCompletedIds?: Set<string>
): boolean {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!lektionId) {
      setIsCompleted(false);
      return;
    }

    // 1. Check DB fortschritt (passed in from parent)
    if (dbCompletedIds?.has(lektionId)) {
      setIsCompleted(true);
      return;
    }

    // 2. Check localStorage onboarding state
    try {
      // Try all possible storage keys (user-namespaced and legacy)
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
            // Check children (sub-lessons)
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
  }, [lektionId, dbCompletedIds]);

  return isCompleted;
}
