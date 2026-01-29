import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AkademieHauptmodul, AkademieUnterpunkt } from '@/types/onboarding';

// Database types from Supabase
interface DbHauptmodul {
  id: string;
  code: string;
  titel: string;
  beschreibung: string | null;
  reihenfolge: number;
  ist_aktiv: boolean;
  created_at: string;
  updated_at: string;
}

interface DbUnterpunkt {
  id: string;
  hauptmodul_id: string;
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
  created_at: string;
  updated_at: string;
}

interface DbHauptmodulWithUnterpunkte extends DbHauptmodul {
  onboarding_akademie_unterpunkte: DbUnterpunkt[];
}

// Transforms DB data to app types
function transformToAppTypes(dbData: DbHauptmodulWithUnterpunkte[]): AkademieHauptmodul[] {
  return dbData.map((hauptmodul, hmIndex) => ({
    id: hauptmodul.id,
    titel: hauptmodul.titel,
    beschreibung: hauptmodul.beschreibung || '',
    reihenfolge: hauptmodul.reihenfolge,
    unterpunkte: hauptmodul.onboarding_akademie_unterpunkte
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((unterpunkt): AkademieUnterpunkt => ({
        id: unterpunkt.id,
        titel: unterpunkt.titel,
        beschreibung: unterpunkt.beschreibung || '',
        videoUrl: unterpunkt.video_url || '',
        dauerMinuten: unterpunkt.video_dauer_minuten || 5,
        reihenfolge: unterpunkt.reihenfolge,
        abgeschlossen: false, // Will be merged with user progress
      })),
  }));
}

export interface AkademieUnterpunktDetails extends AkademieUnterpunkt {
  hauptmodulTitel: string;
  hauptmodulId: string;
  textInhalt: string | null;
  textZusammenfassung: string | null;
  zusatzmaterialUrls: string[];
}

/**
 * Hook to fetch all Akademie content from Supabase
 * Returns hierarchical structure of Hauptmodule with Unterpunkte
 */
export function useAkademieContent() {
  return useQuery({
    queryKey: ['akademie-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_akademie_hauptmodule')
        .select(`
          *,
          onboarding_akademie_unterpunkte(*)
        `)
        .eq('ist_aktiv', true)
        .order('reihenfolge');
      
      if (error) {
        console.error('Error fetching Akademie content:', error);
        throw error;
      }

      // Sort unterpunkte within each hauptmodul
      const sortedData = (data as DbHauptmodulWithUnterpunkte[]).map(hm => ({
        ...hm,
        onboarding_akademie_unterpunkte: hm.onboarding_akademie_unterpunkte
          .filter(up => up.ist_aktiv)
          .sort((a, b) => a.reihenfolge - b.reihenfolge)
      }));

      return transformToAppTypes(sortedData);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook to fetch a single Unterpunkt with full details (including text content)
 */
export function useAkademieUnterpunkt(unterpunktId: string | undefined) {
  return useQuery({
    queryKey: ['akademie-unterpunkt', unterpunktId],
    queryFn: async () => {
      if (!unterpunktId) return null;

      const { data, error } = await supabase
        .from('onboarding_akademie_unterpunkte')
        .select(`
          *,
          hauptmodul:onboarding_akademie_hauptmodule(id, titel)
        `)
        .eq('id', unterpunktId)
        .eq('ist_aktiv', true)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching Unterpunkt:', error);
        throw error;
      }

      if (!data) return null;

      const hauptmodul = data.hauptmodul as { id: string; titel: string } | null;

      return {
        id: data.id,
        titel: data.titel,
        beschreibung: data.beschreibung || '',
        videoUrl: data.video_url || '',
        dauerMinuten: data.video_dauer_minuten || 5,
        reihenfolge: data.reihenfolge,
        abgeschlossen: false,
        hauptmodulId: hauptmodul?.id || '',
        hauptmodulTitel: hauptmodul?.titel || '',
        textInhalt: data.text_inhalt,
        textZusammenfassung: data.text_zusammenfassung,
        zusatzmaterialUrls: (data.zusatzmaterial_urls as string[]) || [],
      } as AkademieUnterpunktDetails;
    },
    enabled: !!unterpunktId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Find Unterpunkt in local data (for navigation state handling)
 */
export function findUnterpunktInHauptmodule(
  unterpunktId: string,
  hauptmodule: AkademieHauptmodul[]
): { hauptmodul: AkademieHauptmodul; unterpunkt: AkademieUnterpunkt } | null {
  for (const hauptmodul of hauptmodule) {
    const unterpunkt = hauptmodul.unterpunkte.find(up => up.id === unterpunktId);
    if (unterpunkt) {
      return { hauptmodul, unterpunkt };
    }
  }
  return null;
}
