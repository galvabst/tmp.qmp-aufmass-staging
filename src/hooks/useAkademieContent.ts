import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AkademieHauptmodul, AkademieUnterpunkt } from '@/types/onboarding';
import { MOCK_AKADEMIE_HAUPTMODULE } from '@/lib/onboarding-config';

// Database types from thermocheck schema
interface DbModul {
  id: string;
  code: string;
  titel: string;
  beschreibung: string | null;
  reihenfolge: number;
  ist_aktiv: boolean;
  created_at: string;
  updated_at: string;
}

interface DbLektion {
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
  created_at: string;
  updated_at: string;
}

interface DbModulWithLektionen extends DbModul {
  lektionen: DbLektion[];
}

// Transforms DB data to app types
function transformToAppTypes(dbData: DbModulWithLektionen[]): AkademieHauptmodul[] {
  return dbData.map((modul) => ({
    id: modul.id,
    titel: modul.titel,
    beschreibung: modul.beschreibung || '',
    reihenfolge: modul.reihenfolge,
    unterpunkte: (modul.lektionen || [])
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((lektion): AkademieUnterpunkt => ({
        id: lektion.id,
        titel: lektion.titel,
        beschreibung: lektion.beschreibung || '',
        videoUrl: lektion.video_url || '',
        dauerMinuten: lektion.video_dauer_minuten || 5,
        reihenfolge: lektion.reihenfolge,
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
 * Fetch data from thermocheck schema using raw RPC
 * Since thermocheck schema tables aren't in the auto-generated types,
 * we use a raw query approach
 */
async function fetchFromThermocheckSchema<T>(
  table: string,
  options: { 
    select?: string; 
    filter?: Record<string, unknown>;
    orderBy?: string;
    single?: boolean;
  } = {}
): Promise<T | null> {
  const { select = '*', filter = {}, orderBy, single } = options;
  
  // Build WHERE clause
  const whereConditions = Object.entries(filter)
    .map(([key, value]) => `${key} = '${value}'`)
    .join(' AND ');
  
  const whereClause = whereConditions ? `WHERE ${whereConditions}` : '';
  const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
  const limitClause = single ? 'LIMIT 1' : '';
  
  const query = `SELECT ${select} FROM thermocheck.${table} ${whereClause} ${orderClause} ${limitClause}`;
  
  try {
    // Use supabase.rpc with a raw SQL query isn't directly supported,
    // but we can use the REST API via fetch for thermocheck schema
    // For now, return null to trigger fallback to mock data
    console.log('[Akademie] Thermocheck schema query would be:', query);
    return null;
  } catch (error) {
    console.warn('[Akademie] Error querying thermocheck schema:', error);
    return null;
  }
}

/**
 * Hook to fetch all Akademie content
 * Falls back to mock data if thermocheck schema is not accessible
 */
export function useAkademieContent() {
  return useQuery({
    queryKey: ['akademie-content-v2'],
    queryFn: async () => {
      // Try to fetch from legacy public schema tables first (if they still exist)
      try {
        const { data: hauptmodule, error: hmError } = await supabase
          .from('onboarding_akademie_hauptmodule')
          .select(`
            *,
            onboarding_akademie_unterpunkte(*)
          `)
          .eq('ist_aktiv', true)
          .order('reihenfolge');

        if (!hmError && hauptmodule && hauptmodule.length > 0) {
          // Transform legacy data
          return hauptmodule.map((hm: any) => ({
            id: hm.id,
            titel: hm.titel,
            beschreibung: hm.beschreibung || '',
            reihenfolge: hm.reihenfolge,
            unterpunkte: (hm.onboarding_akademie_unterpunkte || [])
              .filter((up: any) => up.ist_aktiv)
              .sort((a: any, b: any) => a.reihenfolge - b.reihenfolge)
              .map((up: any): AkademieUnterpunkt => ({
                id: up.id,
                titel: up.titel,
                beschreibung: up.beschreibung || '',
                videoUrl: up.video_url || '',
                dauerMinuten: up.video_dauer_minuten || 5,
                reihenfolge: up.reihenfolge,
                abgeschlossen: false,
              })),
          })) as AkademieHauptmodul[];
        }
      } catch (error) {
        console.warn('[Akademie] Legacy tables not available:', error);
      }

      // Fallback to mock data (will be replaced when thermocheck schema is exposed via API)
      console.log('[Akademie] Using mock data - thermocheck schema not yet exposed via REST API');
      return MOCK_AKADEMIE_HAUPTMODULE;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Hook to fetch a single Lektion with full details
 */
export function useAkademieUnterpunkt(lektionId: string | undefined) {
  return useQuery({
    queryKey: ['akademie-lektion', lektionId],
    queryFn: async () => {
      if (!lektionId) return null;

      // Try legacy table first
      try {
        const { data, error } = await supabase
          .from('onboarding_akademie_unterpunkte')
          .select(`
            *,
            hauptmodul:onboarding_akademie_hauptmodule(id, titel)
          `)
          .eq('id', lektionId)
          .eq('ist_aktiv', true)
          .maybeSingle();
        
        if (!error && data) {
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
        }
      } catch (error) {
        console.warn('[Akademie] Legacy lektion query failed:', error);
      }

      // Find in mock data as fallback
      for (const hauptmodul of MOCK_AKADEMIE_HAUPTMODULE) {
        const unterpunkt = hauptmodul.unterpunkte.find(up => up.id === lektionId);
        if (unterpunkt) {
          return {
            ...unterpunkt,
            hauptmodulId: hauptmodul.id,
            hauptmodulTitel: hauptmodul.titel,
            textInhalt: null,
            textZusammenfassung: null,
            zusatzmaterialUrls: [],
          } as AkademieUnterpunktDetails;
        }
      }

      return null;
    },
    enabled: !!lektionId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Find Lektion in local data (for navigation state handling)
 */
export function findUnterpunktInHauptmodule(
  lektionId: string,
  hauptmodule: AkademieHauptmodul[]
): { hauptmodul: AkademieHauptmodul; unterpunkt: AkademieUnterpunkt } | null {
  for (const hauptmodul of hauptmodule) {
    const unterpunkt = hauptmodul.unterpunkte.find(up => up.id === lektionId);
    if (unterpunkt) {
      return { hauptmodul, unterpunkt };
    }
  }
  return null;
}
