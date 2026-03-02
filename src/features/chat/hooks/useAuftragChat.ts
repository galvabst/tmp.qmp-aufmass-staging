import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

export interface AuftragNachricht {
  id: string;
  auftrag_id: string;
  autor_id: string;
  inhalt: string;
  erstellt_am: string;
  autor_name: string | null;
}

/**
 * Hook für den Auftragschat.
 * Lädt Nachrichten für einen Auftrag und bietet eine Mutation zum Senden.
 */
export function useAuftragChat(auftragId: string | undefined) {
  const queryClient = useQueryClient();

  const queryKey = ['auftrag-chat', auftragId];

  const { data: nachrichten = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!auftragId) return [];

      // 1. Fetch messages from thermocheck schema
      const { data: messages, error: msgError } = await supabaseTC
        .from('auftrag_nachrichten')
        .select('id, auftrag_id, autor_id, inhalt, erstellt_am')
        .eq('auftrag_id', auftragId)
        .order('erstellt_am', { ascending: true });

      if (msgError) throw msgError;
      if (!messages || messages.length === 0) return [];

      // 2. Resolve author names from profiles (public schema)
      const autorIds = [...new Set(messages.map(m => m.autor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname')
        .in('id', autorIds);

      const profileMap = new Map(
        (profiles || []).map(p => [
          p.id,
          [p.vorname, p.nachname].filter(Boolean).join(' ') || null,
        ])
      );

      return messages.map(m => ({
        ...m,
        autor_name: profileMap.get(m.autor_id) ?? 'Ehemaliger Nutzer',
      })) as AuftragNachricht[];
    },
    enabled: !!auftragId,
    refetchInterval: 30_000, // Poll every 30s for new messages
  });

  const sendNachricht = useMutation({
    mutationFn: async (inhalt: string) => {
      if (!auftragId) throw new Error('Keine Auftrags-ID');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht eingeloggt');

      const { error } = await supabaseTC
        .from('auftrag_nachrichten')
        .insert({
          auftrag_id: auftragId,
          autor_id: user.id,
          inhalt: inhalt.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    nachrichten,
    isLoading,
    error,
    sendNachricht: sendNachricht.mutate,
    isSending: sendNachricht.isPending,
  };
}
