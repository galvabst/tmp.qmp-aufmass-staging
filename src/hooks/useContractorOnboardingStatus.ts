import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContractorOnboardingRecord {
  id: string;
  profile_id: string | null;
  onboarding_status: string;
  onboarding_substatus: string | null;
  trainer_freigabe: boolean | null;
  trainer_freigabe_am: string | null;
  trainer_freigabe_von: string | null;
  ag_domain_email: string | null;
  // Aggregated data
  lektionen_abgeschlossen: number;
  bestellungen_bezahlt: number;
}

interface UseContractorOnboardingStatusResult {
  /** True if user is fully onboarded (einsatzbereit + trainer_freigabe) */
  isReady: boolean;
  /** True while fetching data */
  isLoading: boolean;
  /** True if there was an error fetching */
  isError: boolean;
  /** The contractor onboarding record, or null if not found */
  onboardingRecord: ContractorOnboardingRecord | null;
  /** Whether a contractor_onboarding record exists for this user */
  hasRecord: boolean;
  /** Refetch function */
  refetch: () => void;
}

const SUPABASE_URL = 'https://keplsvhudmfaagixttql.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY';

/**
 * Hook to fetch the contractor onboarding status from the database.
 * This is the Single Source of Truth for determining if a user has completed onboarding.
 * 
 * A user is considered "ready" (einsatzbereit) only if:
 * 1. They have a record in thermocheck.contractor_onboarding
 * 2. onboarding_substatus = 'einsatzbereit' (via onboarding_status = 'ready')
 * 3. trainer_freigabe = true
 */
export function useContractorOnboardingStatus(): UseContractorOnboardingStatusResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contractor-onboarding-status'],
    queryFn: async (): Promise<ContractorOnboardingRecord | null> => {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[ContractorOnboardingStatus] No authenticated user');
        return null;
      }

      // Call the RPC function via fetch since it's in thermocheck schema
      // and not in the generated TypeScript types
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/get_my_contractor_onboarding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ContractorOnboardingStatus] RPC error:', response.status, errorText);
        
        // If function doesn't exist (404) or permission denied, return null
        if (response.status === 404 || response.status === 403) {
          console.warn('[ContractorOnboardingStatus] RPC function not found or access denied');
          return null;
        }
        
        throw new Error(`RPC call failed: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData || (Array.isArray(responseData) && responseData.length === 0)) {
        console.log('[ContractorOnboardingStatus] No contractor_onboarding record found for user:', session.user.id);
        return null;
      }

      const record = Array.isArray(responseData) ? responseData[0] : responseData;
      
      console.log('[ContractorOnboardingStatus] Loaded record:', {
        id: record.id,
        status: record.onboarding_status,
        substatus: record.onboarding_substatus,
        trainer_freigabe: record.trainer_freigabe,
        lektionen: record.lektionen_abgeschlossen,
        bestellungen: record.bestellungen_bezahlt,
      });

      return {
        id: record.id,
        profile_id: record.profile_id,
        onboarding_status: record.onboarding_status,
        onboarding_substatus: record.onboarding_substatus,
        trainer_freigabe: record.trainer_freigabe,
        trainer_freigabe_am: record.trainer_freigabe_am,
        trainer_freigabe_von: record.trainer_freigabe_von,
        ag_domain_email: record.ag_domain_email,
        lektionen_abgeschlossen: record.lektionen_abgeschlossen || 0,
        bestellungen_bezahlt: record.bestellungen_bezahlt || 0,
      };
    },
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Determine if user is fully ready
  // User must have onboarding_status = 'ready' AND trainer_freigabe = true
  const isReady = !!(
    data &&
    data.onboarding_status === 'ready' &&
    data.trainer_freigabe === true
  );

  return {
    isReady,
    isLoading,
    isError,
    onboardingRecord: data ?? null,
    hasRecord: !!data,
    refetch,
  };
}
