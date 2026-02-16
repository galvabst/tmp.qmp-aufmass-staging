import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Thermocheck schema client
const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

export interface DbCoachingSlot {
  id: string;
  trainer_profile_id: string;
  datum: string;
  region: string;
  preis: number;
  status: string;
  gebuchter_onboarder_id: string | null;
  gebucht_am: string | null;
  notizen: string | null;
  // Joined from profiles
  trainer_vorname?: string;
  trainer_nachname?: string;
  trainer_avatar_url?: string;
}

/**
 * Lädt verfügbare Coaching-Slots (status = 'available') + Trainer-Info
 */
export function useAvailableCoachingSlots() {
  return useQuery({
    queryKey: ['coaching-slots', 'available'],
    queryFn: async (): Promise<DbCoachingSlot[]> => {
      // Sync auth session from main client
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await thermocheckClient.auth.setSession(session);
      }

      const { data, error } = await thermocheckClient
        .from('contractor_coaching_slots')
        .select('*')
        .eq('status', 'available')
        .order('datum', { ascending: true });

      if (error) {
        console.warn('[CoachingSlots] Error loading available slots:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Load trainer profiles
      const trainerIds = [...new Set(data.map(s => s.trainer_profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .in('id', trainerIds);

      const profileMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      return data.map(slot => {
        const trainer = profileMap.get(slot.trainer_profile_id);
        return {
          ...slot,
          trainer_vorname: trainer?.vorname || '',
          trainer_nachname: trainer?.nachname || '',
          trainer_avatar_url: trainer?.avatar_url || undefined,
        };
      });
    },
    staleTime: 30 * 1000, // 30s cache
  });
}

/**
 * Lädt den gebuchten Slot des aktuellen Users
 */
export function useMyBookedSlot(profileId: string | null) {
  return useQuery({
    queryKey: ['coaching-slots', 'my-booked', profileId],
    queryFn: async (): Promise<DbCoachingSlot | null> => {
      if (!profileId) return null;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await thermocheckClient.auth.setSession(session);
      }

      const { data, error } = await thermocheckClient
        .from('contractor_coaching_slots')
        .select('*')
        .eq('gebuchter_onboarder_id', profileId)
        .eq('status', 'booked')
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      // Load trainer profile
      const { data: trainer } = await supabase
        .from('profiles')
        .select('id, vorname, nachname, avatar_url')
        .eq('id', data.trainer_profile_id)
        .maybeSingle();

      return {
        ...data,
        trainer_vorname: trainer?.vorname || '',
        trainer_nachname: trainer?.nachname || '',
        trainer_avatar_url: trainer?.avatar_url || undefined,
      };
    },
    enabled: !!profileId,
    staleTime: 60 * 1000,
  });
}

/**
 * Bucht einen Coaching-Slot via RPC (atomar)
 */
export function useBookCoachingSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slotId: string) => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        params: { p_slot_id: string }
      ) => Promise<{ data: { success: boolean; error?: string; coach_name?: string; datum?: string } | null; error: Error | null }>)(
        'book_coaching_slot',
        { p_slot_id: slotId }
      );

      if (error) throw error;
      if (!data || !data.success) {
        throw new Error(data?.error || 'Buchung fehlgeschlagen');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coaching-slots'] });
      queryClient.invalidateQueries({ queryKey: ['contractor-onboarding-state'] });
    },
  });
}
