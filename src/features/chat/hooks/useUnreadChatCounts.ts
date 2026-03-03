import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

/**
 * Batch-loads unread chat message counts for a list of auftrag IDs.
 * Returns a Map<auftragId, unreadCount>.
 * 
 * Logic: Count messages in auftrag_nachrichten WHERE
 *   - autor_id != current user (own messages don't count)
 *   - erstellt_am > gelesen_am (or all if no gelesen record exists)
 */
export function useUnreadChatCounts(auftragIds: string[]) {
  return useQuery({
    queryKey: ['unread-chat-counts', ...auftragIds.sort()],
    queryFn: async (): Promise<Map<string, number>> => {
      if (auftragIds.length === 0) return new Map();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map();

      // 1. Get all gelesen timestamps for this user
      const { data: gelesenRows } = await supabaseTC
        .from('auftrag_chat_gelesen')
        .select('auftrag_id, gelesen_am')
        .eq('user_id', user.id)
        .in('auftrag_id', auftragIds);

      const gelesenMap = new Map<string, string>(
        (gelesenRows || []).map(r => [r.auftrag_id, r.gelesen_am])
      );

      // 2. Get all messages for these auftraege that are NOT from current user
      const { data: messages } = await supabaseTC
        .from('auftrag_nachrichten')
        .select('auftrag_id, erstellt_am')
        .in('auftrag_id', auftragIds)
        .neq('autor_id', user.id);

      if (!messages || messages.length === 0) return new Map();

      // 3. Count unread per auftrag
      const counts = new Map<string, number>();
      for (const msg of messages) {
        const gelesenAm = gelesenMap.get(msg.auftrag_id);
        // If no gelesen record or message is newer than last read
        if (!gelesenAm || new Date(msg.erstellt_am) > new Date(gelesenAm)) {
          counts.set(msg.auftrag_id, (counts.get(msg.auftrag_id) || 0) + 1);
        }
      }

      return counts;
    },
    enabled: auftragIds.length > 0,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
