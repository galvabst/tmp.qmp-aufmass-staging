import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ModulData {
  id?: string;
  code: string;
  titel: string;
  beschreibung?: string;
  reihenfolge?: number;
  ist_aktiv?: boolean;
}

export function useAdminMutateModul() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (data: ModulData) => {
      const { data: result, error } = await supabase.rpc('admin_upsert_akademie_modul', {
        p_data: data as any,
      });
      if (error) throw error;
      const res = result as unknown as { success: boolean; error?: string; id?: string };
      if (!res.success) throw new Error(res.error || 'Unbekannter Fehler');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'akademie-module'] });
      toast({ title: 'Modul gespeichert' });
    },
    onError: (err: Error) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  return { upsertModul: upsert.mutateAsync, isPending: upsert.isPending };
}
