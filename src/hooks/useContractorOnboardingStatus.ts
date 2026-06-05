import { useQuery } from '@tanstack/react-query';

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
  // Internal admin checks
  vertrag_geprueft_intern: boolean | null;
  kleidung_bestellt_intern: boolean | null;
  lizenzen_bereitgestellt_intern: boolean | null;
  // Trainer flag
  is_trainer: boolean;
  // Step tracking
  completed_steps: string[];
  current_step: string | null;
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
  /** Whether the query has completed at least once */
  isFetched: boolean;
  /** Refetch function */
  refetch: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://keplsvhudmfaagixttql.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY';

interface RpcErrorLike {
  code?: string;
  message: string;
}

function buildAuthHeaders(accessToken: string, profile?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(profile ? { 'Accept-Profile': profile } : {}),
  };
}

async function fetchRpcOnboarding(accessToken: string): Promise<{ data: any; error: RpcErrorLike | null }> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_my_contractor_onboarding`, {
    method: 'POST',
    headers: buildAuthHeaders(accessToken),
    body: '{}',
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.message || payload?.error || message;
    } catch {
      // ignore JSON parse errors for empty error bodies
    }

    return {
      data: null,
      error: {
        code: `HTTP_${response.status}`,
        message,
      },
    };
  }

  return {
    data: await response.json(),
    error: null,
  };
}

async function fetchDirectOnboarding(userId: string, accessToken: string): Promise<Partial<ContractorOnboardingRecord> | null> {
  const params = new URLSearchParams({
    profile_id: `eq.${userId}`,
    select: [
      'id',
      'profile_id',
      'onboarding_status',
      'onboarding_substatus',
      'trainer_freigabe',
      'trainer_freigabe_am',
      'trainer_freigabe_von',
      'ag_domain_email',
      'erstellt_am',
      'vertrag_geprueft_intern',
      'kleidung_bestellt_intern',
      'lizenzen_bereitgestellt_intern',
      'is_trainer',
      'completed_steps',
      'current_step',
    ].join(','),
    limit: '1',
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/contractor_onboarding?${params.toString()}`, {
    headers: buildAuthHeaders(accessToken, 'thermocheck'),
  });

  if (!response.ok) {
    throw new Error(`Direkter Onboarding-Fetch fehlgeschlagen (${response.status})`);
  }

  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function mapOnboardingRecord(record: any): ContractorOnboardingRecord {
  return {
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
    vertrag_geprueft_intern: record.vertrag_geprueft_intern ?? null,
    kleidung_bestellt_intern: record.kleidung_bestellt_intern ?? null,
    lizenzen_bereitgestellt_intern: record.lizenzen_bereitgestellt_intern ?? null,
    is_trainer: record.is_trainer ?? false,
    completed_steps: Array.isArray(record.completed_steps) ? record.completed_steps : [],
    current_step: record.current_step ?? null,
  };
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
export function useContractorOnboardingStatus(
  userId?: string | null,
  accessToken?: string | null,
): UseContractorOnboardingStatusResult {
  const { data, isLoading, error, refetch, isFetched } = useQuery({
    queryKey: ['contractor-onboarding-status', userId, !!accessToken],
    enabled: !!userId && !!accessToken,
    queryFn: async (): Promise<{ record: ContractorOnboardingRecord | null; errorMessage: string | null }> => {
      if (!userId || !accessToken) {
        return { record: null, errorMessage: null };
      }

      const { data: rpcData, error: rpcError } = await fetchRpcOnboarding(accessToken);

      if (rpcError) {
        console.error('[ContractorOnboardingStatus] RPC error:', rpcError);
      }

      let record = Array.isArray(rpcData) ? rpcData[0] : rpcData;

      if (!record) {
        try {
          record = await fetchDirectOnboarding(userId, accessToken);
        } catch (fallbackError) {
          console.error('[ContractorOnboardingStatus] Direct fallback failed:', fallbackError);
          if (rpcError) {
            return {
              record: null,
              errorMessage: `Technischer Fehler: ${rpcError.message}`,
            };
          }
          return {
            record: null,
            errorMessage: fallbackError instanceof Error ? fallbackError.message : 'Technischer Fehler beim Laden des Onboardings.',
          };
        }
      }

      if (!record) {
        return { record: null, errorMessage: null };
      }

      return {
        record: mapOnboardingRecord(record),
        errorMessage: null,
      };
    },
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: true,
    retry: 1,
    retryDelay: 1000,
  });

  // Extract record and error message from query result
  const onboardingRecord = data?.record ?? null;
  const errorMessage = data?.errorMessage ?? (error ? String(error) : null);
  const isError = !!errorMessage;

  // Determine if user is fully ready
  // User is ready when onboarding_status = 'ready' (set by DB trigger when all 7 steps completed)
  // Internal admin flags (vertrag_geprueft, kleidung_bestellt, lizenzen_bereitgestellt) are
  // for backoffice tracking only and should NOT block the technician from working.
  const isReady = !!(
    onboardingRecord &&
    onboardingRecord.onboarding_status === 'ready'
  );

  return {
    isReady,
    isLoading,
    isError,
    errorMessage,
    onboardingRecord,
    hasRecord: !!onboardingRecord,
    isFetched,
    refetch,
  };
}
