import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { supabase } from '@/integrations/supabase/client';

export interface InboxItem {
  auftragId: string;
  kundenName: string;
  letzteNachricht: string;
  letzteNachrichtAm: string;
  autorName: string;
  istEigeneNachricht: boolean;
}

/**
 * Loads the latest chat message per assigned auftrag for the inbox view.
 * Only returns auftraege that have at least one message.
 */
export function useAuftragChatInbox(auftragIds: string[]) {
  return useQuery({
    queryKey: ['auftrag-chat-inbox', ...auftragIds.sort()],
    queryFn: async (): Promise<InboxItem[]> => {
      if (auftragIds.length === 0) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // 1. Fetch all messages for assigned auftraege, ordered newest first
      const { data: messages, error: msgErr } = await supabaseTC
        .from('auftrag_nachrichten')
        .select('auftrag_id, autor_id, inhalt, erstellt_am')
        .in('auftrag_id', auftragIds)
        .order('erstellt_am', { ascending: false });

      if (msgErr) throw msgErr;
      if (!messages || messages.length === 0) return [];

      // 2. Group by auftrag_id, keep only the latest message per auftrag
      const latestPerAuftrag = new Map<string, typeof messages[0]>();
      for (const msg of messages) {
        if (!latestPerAuftrag.has(msg.auftrag_id)) {
          latestPerAuftrag.set(msg.auftrag_id, msg);
        }
      }

      // 3. Resolve author names from profiles
      const autorIds = [...new Set([...latestPerAuftrag.values()].map(m => m.autor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname')
        .in('id', autorIds);

      const profileMap = new Map(
        (profiles || []).map(p => [
          p.id,
          [p.vorname, p.nachname].filter(Boolean).join(' ') || 'Unbekannt',
        ])
      );

      // 4. Fetch customer names from auftraege view
      const auftragIdsWithMessages = [...latestPerAuftrag.keys()];
      const kundenRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://keplsvhudmfaagixttql.supabase.co'}/rest/v1/v_thermocheck_auftraege?id=in.(${auftragIdsWithMessages.join(',')})&select=id,kunde_vorname,kunde_nachname`,
        {
          headers: {
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
            'Accept-Profile': 'thermocheck',
          },
        }
      );

      const kundenRows: { id: string; kunde_vorname: string | null; kunde_nachname: string | null }[] = 
        kundenRes.ok ? await kundenRes.json() : [];
      const kundenMap = new Map(
        kundenRows.map(k => [k.id, `${k.kunde_vorname || ''} ${k.kunde_nachname || ''}`.trim() || '–'])
      );

      // 5. Build inbox items
      const items: InboxItem[] = [...latestPerAuftrag.entries()].map(([auftragId, msg]) => ({
        auftragId,
        kundenName: kundenMap.get(auftragId) || '–',
        letzteNachricht: msg.inhalt.length > 80 ? msg.inhalt.slice(0, 80) + '…' : msg.inhalt,
        letzteNachrichtAm: msg.erstellt_am,
        autorName: profileMap.get(msg.autor_id) || 'Unbekannt',
        istEigeneNachricht: msg.autor_id === user.id,
      }));

      // Sort by time descending (newest first)
      items.sort((a, b) => new Date(b.letzteNachrichtAm).getTime() - new Date(a.letzteNachrichtAm).getTime());

      return items;
    },
    enabled: auftragIds.length > 0,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
