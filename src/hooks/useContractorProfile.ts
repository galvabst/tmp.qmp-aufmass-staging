import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApplicantProfile, OnboardingStepId } from '@/types/onboarding';

interface ContractorOnboardingData {
  anschrift_strasse?: string | null;
  anschrift_plz?: string | null;
  anschrift_ort?: string | null;
  gewerbeschein_url?: string | null;
  gewerbeschein_spaeter?: boolean | null;
  current_step?: string | null;
  completed_steps?: string[] | null;
}

export interface ContractorOnboardingState {
  gewerbescheinUrl?: string;
  gewerbescheinSpaeter: boolean;
  currentStep?: OnboardingStepId;
  completedSteps: OnboardingStepId[];
}

/**
 * Hook für Contractor-Profildaten aus der Datenbank
 */
export function useContractorProfile(profileId: string | null) {
  const queryClient = useQueryClient();
  
  // Profildaten laden
  const query = useQuery({
    queryKey: ['contractor-profile', profileId],
    queryFn: async (): Promise<ApplicantProfile | null> => {
      if (!profileId) return null;
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, email, telefon, avatar_url')
        .eq('id', profileId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[useContractorProfile] Error loading profile:', profileError);
        throw profileError;
      }
      
      // Adress- und Onboarding-Daten via neue RPC laden
      let onboardingData: ContractorOnboardingData | null = null;
      try {
        const { data, error } = await (supabase.rpc as unknown as (
          fn: string,
          params: { p_profile_id: string }
        ) => Promise<{ data: ContractorOnboardingData[] | null; error: Error | null }>)(
          'get_contractor_onboarding_state',
          { p_profile_id: profileId }
        );

        if (error) {
          console.warn('[useContractorProfile] get_contractor_onboarding_state RPC failed, falling back:', error);
          // Fallback to old RPC
          const { data: fallbackData, error: fallbackError } = await (supabase.rpc as unknown as (
            fn: string,
            params: { p_profile_id: string }
          ) => Promise<{ data: ContractorOnboardingData[] | null; error: Error | null }>)(
            'get_contractor_address',
            { p_profile_id: profileId }
          );
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            onboardingData = fallbackData[0];
          }
        } else if (data && data.length > 0) {
          onboardingData = data[0];
          console.log('[useContractorProfile] Onboarding state loaded via RPC:', onboardingData);
        }
      } catch (e) {
        console.warn('[useContractorProfile] Failed to call onboarding state RPC:', e);
      }
      
      const anschriftStrasse = onboardingData?.anschrift_strasse || '';
      const strasseMatch = anschriftStrasse.match(/^(.+?)\s+(\d+\s*\w*)$/);
      const strasse = strasseMatch ? strasseMatch[1] : anschriftStrasse;
      const hausnummer = strasseMatch ? strasseMatch[2] : '';
      
      return {
        id: profileData?.id || profileId,
        vorname: profileData?.vorname || '',
        nachname: profileData?.nachname || '',
        email: profileData?.email || '',
        telefon: profileData?.telefon || '',
        avatarUrl: profileData?.avatar_url || undefined,
        strasse,
        hausnummer,
        plz: onboardingData?.anschrift_plz || '',
        ort: onboardingData?.anschrift_ort || '',
      };
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5,
  });

  // Onboarding-State separat laden (Gewerbeschein + Fortschritt)
  const onboardingStateQuery = useQuery({
    queryKey: ['contractor-onboarding-state', profileId],
    queryFn: async (): Promise<ContractorOnboardingState | null> => {
      if (!profileId) return null;

      try {
        const { data, error } = await (supabase.rpc as unknown as (
          fn: string,
          params: { p_profile_id: string }
        ) => Promise<{ data: ContractorOnboardingData[] | null; error: Error | null }>)(
          'get_contractor_onboarding_state',
          { p_profile_id: profileId }
        );

        if (error || !data || data.length === 0) return null;

        const row = data[0];
        return {
          gewerbescheinUrl: row.gewerbeschein_url || undefined,
          gewerbescheinSpaeter: row.gewerbeschein_spaeter || false,
          currentStep: (row.current_step as OnboardingStepId) || undefined,
          completedSteps: (row.completed_steps as OnboardingStepId[]) || [],
        };
      } catch {
        return null;
      }
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 2,
  });
  
  // Mutation für Profile-Updates
  const updateMutation = useMutation({
    mutationFn: async (profile: Partial<ApplicantProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      if (profile.vorname !== undefined || profile.nachname !== undefined || profile.telefon !== undefined) {
        const { error } = await supabase
          .from('profiles')
          .update({
            vorname: profile.vorname,
            nachname: profile.nachname,
            telefon: profile.telefon,
          })
          .eq('id', user.id);
        
        if (error) throw error;
      }
      
      if (profile.strasse !== undefined || profile.hausnummer !== undefined || 
          profile.plz !== undefined || profile.ort !== undefined) {
        const anschriftStrasse = [profile.strasse, profile.hausnummer]
          .filter(Boolean)
          .join(' ')
          .trim();
        
        const { error } = await (supabase.rpc as unknown as (
          fn: string, 
          params: Record<string, string | null>
        ) => Promise<{ error: Error | null }>)('update_contractor_onboarding_address', {
          p_strasse: anschriftStrasse || null,
          p_plz: profile.plz || null,
          p_ort: profile.ort || null,
        });
        
        if (error) {
          console.warn('[useContractorProfile] Address update via RPC failed:', error);
        }
      }
      
      console.log('[useContractorProfile] Profile updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] });
    },
    onError: (error) => {
      console.error('[useContractorProfile] Update failed:', error);
    },
  });
  
  // Mutation für Avatar-Upload
  const avatarMutation = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contractor-avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('contractor-avatars')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] });
    },
  });

  // Gewerbeschein Upload
  const gewerbescheinMutation = useMutation({
    mutationFn: async (file: File): Promise<string> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${user.id}/gewerbeschein-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contractor-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('contractor-documents')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
  });

  // Gewerbeschein-Daten in DB speichern
  const saveGewerbescheinMutation = useMutation({
    mutationFn: async (params: { url?: string; spaeter: boolean }) => {
      await (supabase.rpc as unknown as (
        fn: string,
        params: Record<string, unknown>
      ) => Promise<{ error: Error | null }>)('update_contractor_gewerbeschein', {
        p_gewerbeschein_url: params.url || null,
        p_gewerbeschein_spaeter: params.spaeter,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-state'] });
    },
  });

  // Fortschritt in DB speichern
  const saveProgressMutation = useMutation({
    mutationFn: async (params: { currentStep: string; completedSteps: string[] }) => {
      await (supabase.rpc as unknown as (
        fn: string,
        params: Record<string, unknown>
      ) => Promise<{ error: Error | null }>)('update_contractor_onboarding_progress', {
        p_current_step: params.currentStep,
        p_completed_steps: params.completedSteps,
      });
    },
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Onboarding state (Gewerbeschein + Fortschritt)
    onboardingState: onboardingStateQuery.data,
    isOnboardingStateLoaded: onboardingStateQuery.isSuccess,
    
    // Methoden
    updateProfile: updateMutation.mutateAsync,
    uploadAvatar: avatarMutation.mutateAsync,
    uploadGewerbeschein: gewerbescheinMutation.mutateAsync,
    saveGewerbeschein: saveGewerbescheinMutation.mutateAsync,
    saveProgress: saveProgressMutation.mutateAsync,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    isUploading: avatarMutation.isPending,
  };
}
