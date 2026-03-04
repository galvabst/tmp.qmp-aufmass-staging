import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface QuizAntwortData {
  text: string;
  korrekt: boolean;
}

interface QuizData {
  id?: string;
  modul_id: string;
  frage: string;
  antworten: QuizAntwortData[];
  reihenfolge?: number;
  ist_aktiv?: boolean;
}

export function useAdminMutateQuiz() {
  const queryClient = useQueryClient();

  const upsert = useMutation({
    mutationFn: async (data: QuizData) => {
      const { data: result, error } = await supabase.rpc('admin_upsert_akademie_quiz', {
        p_data: data as any,
      });
      if (error) throw error;
      const res = result as unknown as { success: boolean; error?: string; id?: string };
      if (!res.success) throw new Error(res.error || 'Unbekannter Fehler');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'akademie-module'] });
      toast({ title: 'Quiz-Frage gespeichert' });
    },
    onError: (err: Error) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase.rpc('admin_delete_akademie_quiz', {
        p_id: id,
      });
      if (error) throw error;
      const res = result as unknown as { success: boolean; error?: string };
      if (!res.success) throw new Error(res.error || 'Unbekannter Fehler');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'akademie-module'] });
      toast({ title: 'Quiz-Frage gelöscht' });
    },
    onError: (err: Error) => {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, modul_id, ist_aktiv }: { id: string; modul_id: string; ist_aktiv: boolean }) => {
      const { data: result, error } = await supabase.rpc('admin_upsert_akademie_quiz', {
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
    upsertQuiz: upsert.mutateAsync,
    deleteQuiz: remove.mutateAsync,
    toggleQuizActive: toggleActive.mutateAsync,
    isPending: upsert.isPending || remove.isPending || toggleActive.isPending,
  };
}
