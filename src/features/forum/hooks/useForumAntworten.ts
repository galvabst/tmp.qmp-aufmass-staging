import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ForumAntwort {
  id: string;
  thread_id: string;
  autor_profile_id: string;
  inhalt: string;
  ist_trainer_antwort: boolean;
  erstellt_am: string;
  aktualisiert_am: string;
  autor_name: string;
  ist_akzeptiert: boolean;
}

export function useForumAntworten(threadId: string | null, akzeptierteAntwortId: string | null) {
  return useQuery({
    queryKey: ['forum-antworten', threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<ForumAntwort[]> => {
      if (!threadId) return [];

      const { data: antworten, error } = await supabase
        .schema('thermocheck' as any)
        .from('contractor_forum_antworten')
        .select('*')
        .eq('thread_id', threadId)
        .order('erstellt_am', { ascending: true });

      if (error) throw error;
      if (!antworten || antworten.length === 0) return [];

      const profileIds = [...new Set(antworten.map((a: any) => a.autor_profile_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname')
        .in('id', profileIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.vorname || ''} ${p.nachname || ''}`.trim() || 'Anonym'])
      );

      const result: ForumAntwort[] = antworten.map((a: any) => ({
        id: a.id,
        thread_id: a.thread_id,
        autor_profile_id: a.autor_profile_id,
        inhalt: a.inhalt,
        ist_trainer_antwort: a.ist_trainer_antwort,
        erstellt_am: a.erstellt_am,
        aktualisiert_am: a.aktualisiert_am,
        autor_name: profileMap.get(a.autor_profile_id) || 'Anonym',
        ist_akzeptiert: a.id === akzeptierteAntwortId,
      }));

      // Sort: accepted answer first, then trainer answers, then chronological
      return result.sort((a, b) => {
        if (a.ist_akzeptiert && !b.ist_akzeptiert) return -1;
        if (!a.ist_akzeptiert && b.ist_akzeptiert) return 1;
        if (a.ist_trainer_antwort && !b.ist_trainer_antwort) return -1;
        if (!a.ist_trainer_antwort && b.ist_trainer_antwort) return 1;
        return new Date(a.erstellt_am).getTime() - new Date(b.erstellt_am).getTime();
      });
    },
    staleTime: 15_000,
  });
}
