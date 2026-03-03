import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ForumThread {
  id: string;
  autor_profile_id: string;
  titel: string;
  inhalt: string;
  erstellt_am: string;
  aktualisiert_am: string;
  ist_geloest: boolean;
  akzeptierte_antwort_id: string | null;
  kategorie: string | null;
  // Joined data
  autor_name: string;
  antworten_count: number;
  hat_trainer_antwort: boolean;
}

export function useForumThreads(filter: 'alle' | 'unbeantwortet' = 'alle', kategorie?: string | null) {
  return useQuery({
    queryKey: ['forum-threads', filter, kategorie],
    queryFn: async (): Promise<ForumThread[]> => {
      const { data: threads, error } = await supabase
        .schema('thermocheck' as any)
        .from('contractor_forum_threads')
        .select('*')
        .order('erstellt_am', { ascending: false });

      if (error) throw error;
      if (!threads || threads.length === 0) return [];

      const profileIds = [...new Set(threads.map((t: any) => t.autor_profile_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, vorname, nachname')
        .in('id', profileIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.vorname || ''} ${p.nachname || ''}`.trim() || 'Anonym'])
      );

      const threadIds = threads.map((t: any) => t.id);
      const { data: antworten } = await supabase
        .schema('thermocheck' as any)
        .from('contractor_forum_antworten')
        .select('thread_id, ist_trainer_antwort')
        .in('thread_id', threadIds);

      const countMap = new Map<string, { count: number; hatTrainer: boolean }>();
      (antworten || []).forEach((a: any) => {
        const entry = countMap.get(a.thread_id) || { count: 0, hatTrainer: false };
        entry.count++;
        if (a.ist_trainer_antwort) entry.hatTrainer = true;
        countMap.set(a.thread_id, entry);
      });

      let result: ForumThread[] = threads.map((t: any) => {
        const stats = countMap.get(t.id) || { count: 0, hatTrainer: false };
        return {
          id: t.id,
          autor_profile_id: t.autor_profile_id,
          titel: t.titel,
          inhalt: t.inhalt,
          erstellt_am: t.erstellt_am,
          aktualisiert_am: t.aktualisiert_am,
          ist_geloest: t.ist_geloest,
          akzeptierte_antwort_id: t.akzeptierte_antwort_id,
          kategorie: t.kategorie || null,
          autor_name: profileMap.get(t.autor_profile_id) || 'Anonym',
          antworten_count: stats.count,
          hat_trainer_antwort: stats.hatTrainer,
        };
      });

      if (filter === 'unbeantwortet') {
        result = result.filter(t => !t.hat_trainer_antwort && !t.ist_geloest);
      }

      if (kategorie) {
        result = result.filter(t => t.kategorie === kategorie);
      }

      return result;
    },
    staleTime: 30_000,
  });
}
