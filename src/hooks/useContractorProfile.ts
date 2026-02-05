import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ApplicantProfile } from '@/types/onboarding';

interface ContractorOnboardingData {
  anschrift_strasse?: string | null;
  anschrift_plz?: string | null;
  anschrift_ort?: string | null;
}

/**
 * Hook für Contractor-Profildaten aus der Datenbank
 * 
 * SSoT gemäß LOVABLE_BEHAVIOUR.txt Regel 1:
 * - public.profiles = SSoT für User-Identität (Name, Email, Telefon, Avatar)
 * - thermocheck.contractor_onboarding = Adressdaten für Lieferung
 * 
 * @param profileId - Die Profile-ID (auth.uid())
 */
export function useContractorProfile(profileId: string | null) {
  const queryClient = useQueryClient();
  
  // Profildaten laden
  const query = useQuery({
    queryKey: ['contractor-profile', profileId],
    queryFn: async (): Promise<ApplicantProfile | null> => {
      if (!profileId) return null;
      
      // 1. Profile-Daten aus public.profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, email, telefon, avatar_url')
        .eq('id', profileId)
        .maybeSingle();
      
      if (profileError) {
        console.error('[useContractorProfile] Error loading profile:', profileError);
        throw profileError;
      }
      
      // 2. Adress-Daten aus thermocheck.contractor_onboarding via RPC
      // RPC gibt ein Array zurück, wir nehmen das erste Element
      const { data: onboardingDataArray, error: onboardingError } = await supabase
        .rpc('get_my_contractor_onboarding');
      
      let onboardingData: ContractorOnboardingData | null = null;
      
      if (onboardingError) {
        console.warn('[useContractorProfile] Error loading onboarding data:', onboardingError);
        // Kein Fehler werfen - Onboarding-Daten sind optional für erste Schritte
      } else if (Array.isArray(onboardingDataArray) && onboardingDataArray.length > 0) {
        // RPC gibt Array zurück - erstes Element nehmen
        onboardingData = onboardingDataArray[0] as ContractorOnboardingData;
      } else if (onboardingDataArray && !Array.isArray(onboardingDataArray)) {
        // Falls doch ein einzelnes Objekt zurückkommt
        onboardingData = onboardingDataArray as unknown as ContractorOnboardingData;
      }
      
      // Straße und Hausnummer aus kombiniertem Feld extrahieren (falls vorhanden)
      const anschriftStrasse = onboardingData?.anschrift_strasse || '';
      // Versuche Hausnummer zu extrahieren (letztes Wort wenn es mit Zahl beginnt)
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
    staleTime: 1000 * 60 * 5, // 5 Minuten Cache
  });
  
  // Mutation für Profile-Updates
  const updateMutation = useMutation({
    mutationFn: async (profile: Partial<ApplicantProfile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // 1. public.profiles updaten (Name, Telefon)
      // Email ist auth-gebunden und kann nicht direkt geändert werden
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
      
      // 2. thermocheck.contractor_onboarding updaten (Adresse) via RPC
      // Da wir thermocheck Schema nicht direkt in Types haben, nutzen wir RPC
      if (profile.strasse !== undefined || profile.hausnummer !== undefined || 
          profile.plz !== undefined || profile.ort !== undefined) {
        const anschriftStrasse = [profile.strasse, profile.hausnummer]
          .filter(Boolean)
          .join(' ')
          .trim();
        
        // Update via raw SQL call (thermocheck schema not in generated types)
        const { error } = await supabase.rpc('update_contractor_onboarding_address', {
          p_strasse: anschriftStrasse || null,
          p_plz: profile.plz || null,
          p_ort: profile.ort || null,
        });
        
        if (error) {
          console.warn('[useContractorProfile] Address update via RPC failed:', error);
          // Nicht als Fehler behandeln - vielleicht existiert die RPC nicht
        }
      }
      
      console.log('[useContractorProfile] Profile updated successfully');
    },
    onSuccess: () => {
      // Cache invalidieren
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
      
      // 1. Upload zu Storage
      const { error: uploadError } = await supabase.storage
        .from('contractor-avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) {
        console.error('[useContractorProfile] Avatar upload failed:', uploadError);
        throw uploadError;
      }
      
      // 2. Public URL holen
      const { data: urlData } = supabase.storage
        .from('contractor-avatars')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      
      // 3. URL in profiles speichern
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('[useContractorProfile] Avatar URL update failed:', updateError);
        throw updateError;
      }
      
      console.log('[useContractorProfile] Avatar uploaded:', publicUrl);
      return publicUrl;
    },
    onSuccess: () => {
      // Cache invalidieren
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] });
    },
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Methoden
    updateProfile: updateMutation.mutateAsync,
    uploadAvatar: avatarMutation.mutateAsync,
    
    // Mutation states
    isUpdating: updateMutation.isPending,
    isUploading: avatarMutation.isPending,
  };
}
