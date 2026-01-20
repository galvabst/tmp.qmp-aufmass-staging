import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook für IAM-basierte Berechtigungsprüfung
 * Lädt die System-Rollen des aktuellen Users
 * 
 * HINWEIS: Aktuell vereinfacht - später durch IAM-Schema erweitern
 */
export function useIAM() {
  const { data: systemRoles, isLoading, error } = useQuery({
    queryKey: ['iam', 'system-roles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Prüfe ob User in profiles existiert
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return [];
      }

      // Basis-Rolle: authenticated user
      // TODO: Später durch IAM-Schema (iam.access_groups) erweitern
      return profile ? ['authenticated'] : [];
    },
    staleTime: 5 * 60 * 1000, // 5 Minuten Cache
  });

  return {
    systemRoles: systemRoles || [],
    loading: isLoading,
    error
  };
}

/**
 * Prüft ob der aktuelle User Admin ist
 * @returns undefined während Loading, boolean danach
 * 
 * TODO: Später durch is_admin() RPC-Funktion ersetzen
 */
export function useIsAdmin(): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  // Temporär: Alle authentifizierten User als "Admin" für Entwicklung
  // Später: systemRoles.includes('admin') || systemRoles.includes('superadmin')
  return systemRoles.includes('authenticated');
}

/**
 * Prüft ob der User Schreibzugriff auf ein Modul hat
 * @param _modulCode - Der Code des Moduls (z.B. 'contractors', 'orders')
 */
export function useHasWriteAccess(_modulCode: string): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  // Temporär: Alle authentifizierten User haben Schreibzugriff
  // Später: Über IAM-Tabellen prüfen
  return systemRoles.includes('authenticated');
}

/**
 * Prüft ob der User Lesezugriff auf ein Modul hat
 * @param _modulCode - Der Code des Moduls
 */
export function useHasReadAccess(_modulCode: string): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  // Alle authentifizierten User haben Lesezugriff
  return systemRoles.includes('authenticated');
}
