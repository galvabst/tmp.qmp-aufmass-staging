import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { AkademieHauptmodul, AkademieUnterpunkt } from '@/types/onboarding';

// Create a separate client for thermocheck schema access
const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);
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
    queryKey: ['akademie-content-v3'],
    queryFn: async () => {
      // Primary: Fetch from thermocheck schema (Module + Lektionen)
      try {
        // Fetch modules from thermocheck schema
        const { data: module, error: modError } = await thermocheckClient
          .from('techniker_akademie_module')
          .select('*')
          .eq('ist_aktiv', true)
          .order('reihenfolge');

        if (modError) {
          console.warn('[Akademie] Error fetching thermocheck modules:', modError);
          throw modError;
        }

        if (!module || module.length === 0) {
          console.log('[Akademie] No modules found in thermocheck schema');
          throw new Error('No modules found');
        }

        // Fetch all lektionen from thermocheck schema
        const { data: lektionen, error: lekError } = await thermocheckClient
          .from('techniker_akademie_lektionen')
          .select('*')
          .eq('ist_aktiv', true)
          .order('reihenfolge');

        if (lekError) {
          console.warn('[Akademie] Error fetching thermocheck lektionen:', lekError);
          throw lekError;
        }

        // Transform to app types
        const result: AkademieHauptmodul[] = module.map((mod: any) => ({
          id: mod.id,
          titel: mod.titel,
          beschreibung: mod.beschreibung || '',
          reihenfolge: mod.reihenfolge,
          unterpunkte: (lektionen || [])
            .filter((lek: any) => lek.modul_id === mod.id)
            .sort((a: any, b: any) => a.reihenfolge - b.reihenfolge)
            .map((lek: any): AkademieUnterpunkt => ({
              id: lek.id,
              titel: lek.titel,
              beschreibung: lek.beschreibung || '',
              videoUrl: lek.video_url || '',
              dauerMinuten: lek.video_dauer_minuten || 5,
              reihenfolge: lek.reihenfolge,
              abgeschlossen: false,
            })),
        }));

        console.log(`[Akademie] Loaded ${result.length} modules from thermocheck schema`);
        return result;
      } catch (error) {
        console.warn('[Akademie] Thermocheck schema query failed:', error);
        // No legacy fallback - thermocheck is SSOT
        console.warn('[Akademie] No data found in thermocheck schema');
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch a single Lektion with full details
 */
export function useAkademieUnterpunkt(lektionId: string | undefined) {
  return useQuery({
    queryKey: ['akademie-lektion-v2', lektionId],
    queryFn: async () => {
      if (!lektionId) return null;

      // Primary: Try thermocheck schema
      try {
        const { data: lektion, error: lekError } = await thermocheckClient
          .from('techniker_akademie_lektionen')
          .select('*')
          .eq('id', lektionId)
          .eq('ist_aktiv', true)
          .maybeSingle();

        if (!lekError && lektion) {
          // Fetch the parent module
          const { data: modul } = await thermocheckClient
            .from('techniker_akademie_module')
            .select('id, titel')
            .eq('id', lektion.modul_id)
            .maybeSingle();

          return {
            id: lektion.id,
            titel: lektion.titel,
            beschreibung: lektion.beschreibung || '',
            videoUrl: lektion.video_url || '',
            dauerMinuten: lektion.video_dauer_minuten || 5,
            reihenfolge: lektion.reihenfolge,
            abgeschlossen: false,
            hauptmodulId: modul?.id || '',
            hauptmodulTitel: modul?.titel || '',
            textInhalt: lektion.text_inhalt,
            textZusammenfassung: lektion.text_zusammenfassung,
            zusatzmaterialUrls: (lektion.zusatzmaterial_urls as string[]) || [],
          } as AkademieUnterpunktDetails;
        }
      } catch (error) {
        console.warn('[Akademie] Thermocheck lektion query failed:', error);
      }

      // No legacy fallback - thermocheck is SSOT
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
