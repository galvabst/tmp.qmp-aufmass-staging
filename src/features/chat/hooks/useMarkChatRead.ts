import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns a function that marks a chat as read by upserting gelesen_am = now().
 * Also invalidates unread-chat-counts to update badges.
 */
export function useMarkChatRead() {
  const queryClient = useQueryClient();

  return useCallback(async (auftragId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !auftragId) return;

    const { error } = await supabaseTC
      .from('auftrag_chat_gelesen')
      .upsert(
        {
          auftrag_id: auftragId,
          user_id: user.id,
          gelesen_am: new Date().toISOString(),
        },
        { onConflict: 'auftrag_id,user_id' }
      );

    if (error) {
      console.error('[useMarkChatRead] upsert error:', error);
      return;
    }

    // Invalidate unread counts so badges update
    queryClient.invalidateQueries({ queryKey: ['unread-chat-counts'] });
  }, [queryClient]);
}
