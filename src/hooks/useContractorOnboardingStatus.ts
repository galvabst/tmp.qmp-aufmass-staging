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
  erstellt_am: string | null;
  // Aggregated data
  lektionen_abgeschlossen: number;
  bestellungen_bezahlt: number;
}

interface UseContractorOnboardingStatusResult {
  /** True if user is fully onboarded (einsatzbereit + trainer_freigabe) */
  isReady: boolean;
  /** True while fetching data */
  isLoading: boolean;
  /** True if there was an error fetching (RPC issue, not "no record") */
  isError: boolean;
  /** Error message if isError is true */
  errorMessage: string | null;
  /** The contractor onboarding record, or null if not found */
  onboardingRecord: ContractorOnboardingRecord | null;
  /** Whether a contractor_onboarding record exists for this user */
  hasRecord: boolean;
  /** Refetch function */
  refetch: () => void;
}

/**
 * Hook to fetch the contractor onboarding status from the database.
 * This is the Single Source of Truth for determining if a user has completed onboarding.
 * 
 * Uses the public wrapper function `public.get_my_contractor_onboarding()` which
 * internally calls `thermocheck.get_my_contractor_onboarding()`.
 * 
 * A user is considered "ready" (einsatzbereit) only if:
 * 1. They have a record in thermocheck.contractor_onboarding
 * 2. onboarding_substatus = 'einsatzbereit' (via onboarding_status = 'ready')
 * 3. trainer_freigabe = true
 */
export function useContractorOnboardingStatus(): UseContractorOnboardingStatusResult {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contractor-onboarding-status'],
    queryFn: async (): Promise<{ record: ContractorOnboardingRecord | null; errorMessage: string | null }> => {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('[ContractorOnboardingStatus] No authenticated user');
        return { record: null, errorMessage: null };
      }

      // Call the public wrapper RPC function using Supabase client
      // This is cleaner than manual fetch and handles auth automatically
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_contractor_onboarding');

      if (rpcError) {
        console.error('[ContractorOnboardingStatus] RPC error:', rpcError);
        
        // PGRST202 = function not found (shouldn't happen with public wrapper)
        // But if it does, it's a technical error, not "no record"
        if (rpcError.code === 'PGRST202') {
          return { 
            record: null, 
            errorMessage: 'Die Onboarding-Funktion ist nicht erreichbar. Bitte kontaktiere den Support.' 
          };
        }
        
        // Other errors are also technical issues
        return { 
          record: null, 
          errorMessage: `Technischer Fehler: ${rpcError.message}` 
        };
      }

      // Check for empty result (legitimate "no record" case)
      if (!rpcData || (Array.isArray(rpcData) && rpcData.length === 0)) {
        console.log('[ContractorOnboardingStatus] No contractor_onboarding record found for user:', session.user.id);
        return { record: null, errorMessage: null };
      }

      const record = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      
      console.log('[ContractorOnboardingStatus] Loaded record:', {
        id: record.id,
        status: record.onboarding_status,
        substatus: record.onboarding_substatus,
        trainer_freigabe: record.trainer_freigabe,
        lektionen: record.lektionen_abgeschlossen,
        bestellungen: record.bestellungen_bezahlt,
      });

      return {
        record: {
          id: record.id,
          profile_id: record.profile_id,
          onboarding_status: record.onboarding_status,
          onboarding_substatus: record.onboarding_substatus,
          trainer_freigabe: record.trainer_freigabe,
          trainer_freigabe_am: record.trainer_freigabe_am,
          trainer_freigabe_von: record.trainer_freigabe_von,
          ag_domain_email: record.ag_domain_email,
          erstellt_am: record.erstellt_am,
          lektionen_abgeschlossen: record.lektionen_abgeschlossen || 0,
          bestellungen_bezahlt: record.bestellungen_bezahlt || 0,
        },
        errorMessage: null,
      };
    },
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Extract record and error message from query result
  const onboardingRecord = data?.record ?? null;
  const errorMessage = data?.errorMessage ?? (error ? String(error) : null);
  const isError = !!errorMessage;

  // Determine if user is fully ready
  // User must have onboarding_status = 'ready' AND trainer_freigabe = true
  const isReady = !!(
    onboardingRecord &&
    onboardingRecord.onboarding_status === 'ready' &&
    onboardingRecord.trainer_freigabe === true
  );

  return {
    isReady,
    isLoading,
    isError,
    errorMessage,
    onboardingRecord,
    hasRecord: !!onboardingRecord,
    refetch,
  };
}
