import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LektionData {
  id?: string;
  modul_id: string;
  code: string;
  titel: string;
  beschreibung?: string;
  reihenfolge?: number;
  video_url?: string;
  video_dauer_minuten?: number;
  text_inhalt?: string;
  text_zusammenfassung?: string;
  ist_aktiv?: boolean;
}

export function useAdminMutateLektion() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (data: LektionData) => {
      const { data: result, error } = await supabase.rpc('admin_upsert_akademie_lektion', {
        p_data: data as any,
      });
      if (error) throw error;
      const res = result as unknown as { success: boolean; error?: string; id?: string };
      if (!res.success) throw new Error(res.error || 'Unbekannter Fehler');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'akademie-module'] });
      toast({ title: 'Lektion gespeichert' });
    },
    onError: (err: Error) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, modul_id, ist_aktiv }: { id: string; modul_id: string; ist_aktiv: boolean }) => {
      const { data: result, error } = await supabase.rpc('admin_upsert_akademie_lektion', {
        p_data: { id, modul_id, ist_aktiv } as any,
      });
      if (error) throw error;
      const res = result as unknown as { success: boolean; error?: string };
      if (!res.success) throw new Error(res.error || 'Unbekannter Fehler');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'akademie-module'] });
    },
    onError: (err: Error) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  return {
    upsertLektion: upsert.mutateAsync,
    toggleLektionActive: toggleActive.mutateAsync,
    isPending: upsert.isPending || toggleActive.isPending,
  };
}
