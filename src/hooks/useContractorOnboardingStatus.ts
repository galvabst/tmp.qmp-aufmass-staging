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

/**
 * Hook to fetch the contractor onboarding status from the database.
 * This is the Single Source of Truth for determining if a user has completed onboarding.
 * 
 * A user is considered "ready" (einsatzbereit) only if:
 * 1. They have a record in thermocheck.contractor_onboarding
 * 2. onboarding_substatus = 'einsatzbereit'
 * 3. trainer_freigabe = true
 */
export function useContractorOnboardingStatus(): UseContractorOnboardingStatusResult {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['contractor-onboarding-status'],
    queryFn: async (): Promise<ContractorOnboardingRecord | null> => {
      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[ContractorOnboardingStatus] No authenticated user');
        return null;
      }

      // Query contractor_onboarding using RPC or raw query
      // Since thermocheck schema is not in the generated types, we use rpc
      const { data: onboardingData, error: onboardingError } = await supabase
        .rpc('get_contractor_onboarding_status', { p_profile_id: user.id });

      if (onboardingError) {
        // If function doesn't exist, fall back to direct query
        if (onboardingError.code === 'PGRST202' || onboardingError.message.includes('function')) {
          console.log('[ContractorOnboardingStatus] RPC not found, trying direct query...');
          return await fetchDirectQuery(user.id);
        }
        console.error('[ContractorOnboardingStatus] Error fetching onboarding:', onboardingError);
        throw onboardingError;
      }

      if (!onboardingData || (Array.isArray(onboardingData) && onboardingData.length === 0)) {
        console.log('[ContractorOnboardingStatus] No contractor_onboarding record found for user:', user.id);
        return null;
      }

      const record = Array.isArray(onboardingData) ? onboardingData[0] : onboardingData;
      
      console.log('[ContractorOnboardingStatus] Loaded record:', {
        id: record.id,
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
  const isReady = !!(
    data &&
    data.onboarding_substatus === 'einsatzbereit' &&
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

/**
 * Fallback: Direct SQL query via PostgREST
 * Used if the RPC function doesn't exist yet
 */
async function fetchDirectQuery(userId: string): Promise<ContractorOnboardingRecord | null> {
  // Use a raw SQL query through the REST API
  const response = await fetch(
    `https://keplsvhudmfaagixttql.supabase.co/rest/v1/rpc/get_my_contractor_onboarding`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    }
  );

  if (!response.ok) {
    // Function doesn't exist - return null to trigger migration prompt
    console.warn('[ContractorOnboardingStatus] RPC function not found, migration needed');
    
    // For now, return a mock "not ready" state to force onboarding
    // This will be replaced once the migration is run
    return {
      id: 'pending-migration',
      profile_id: userId,
      onboarding_status: 'in_onboarding',
      onboarding_substatus: 'neu_angelegt',
      trainer_freigabe: false,
      trainer_freigabe_am: null,
      trainer_freigabe_von: null,
      ag_domain_email: null,
      lektionen_abgeschlossen: 0,
      bestellungen_bezahlt: 0,
    };
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    return null;
  }

  const record = data[0];
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
}
