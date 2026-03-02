import { useQuery } from '@tanstack/react-query';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

export interface AdminLektion {
  id: string;
  modul_id: string;
  code: string;
  titel: string;
  beschreibung: string | null;
  reihenfolge: number;
  video_url: string | null;
  video_dauer_minuten: number | null;
  text_inhalt: string | null;
  text_zusammenfassung: string | null;
  zusatzmaterial_urls: string[] | null;
  ist_aktiv: boolean;
  content_version: number;
  created_at: string;
  updated_at: string;
}

export interface AdminModul {
  id: string;
  code: string;
  titel: string;
  beschreibung: string | null;
  reihenfolge: number;
  ist_aktiv: boolean;
  created_at: string;
  updated_at: string;
  lektionen: AdminLektion[];
}

/**
 * Lädt alle Akademie-Module inkl. Lektionen für Admin-Ansicht.
 * Admins sehen auch inaktive Module/Lektionen dank der neuen RLS-Policies.
 */
export function useAdminAkademieModule() {
  return useQuery<AdminModul[]>({
    queryKey: ['admin', 'akademie-module'],
    queryFn: async () => {
      // Load all modules (admin sees inactive too via RLS)
      const { data: module, error: modErr } = await supabaseTC
        .from('contractor_akademie_module')
        .select('*')
        .order('reihenfolge', { ascending: true });

      if (modErr) throw modErr;

      // Load all lektionen
      const { data: lektionen, error: lekErr } = await supabaseTC
        .from('contractor_akademie_lektionen')
        .select('*')
        .order('reihenfolge', { ascending: true });

      if (lekErr) throw lekErr;

      // Group lektionen by modul_id
      const lektionenMap = new Map<string, AdminLektion[]>();
      for (const l of (lektionen || [])) {
        const list = lektionenMap.get(l.modul_id) || [];
        list.push(l as AdminLektion);
        lektionenMap.set(l.modul_id, list);
      }

      return (module || []).map((m) => ({
        ...m,
        lektionen: lektionenMap.get(m.id) || [],
      })) as AdminModul[];
    },
    staleTime: 30_000,
  });
}
