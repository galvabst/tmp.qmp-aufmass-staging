import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type SystemRole = 'superadmin' | 'admin' | 'manager' | 'user';

/**
 * Hook für IAM-basierte Berechtigungsprüfung
 * Lädt die System-Rollen des aktuellen Users aus iam.user_system_roles
 */
export function useIAM() {
  const { data: systemRoles, isLoading, error } = useQuery({
    queryKey: ['iam', 'system-roles'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Lade echte Rollen aus IAM-Schema via RPC
      const { data, error } = await supabase.rpc('get_user_iam_roles');
      
      if (error) {
        console.error('Error fetching IAM roles:', error);
        return [];
      }

      return (data as SystemRole[]) || [];
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
 * Prüft ob der aktuelle User Admin-Rechte hat
 * @returns undefined während Loading, boolean danach
 * 
 * Admin-Rollen: superadmin, admin, manager
 */
export function useIsAdmin(): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  return ['superadmin', 'admin', 'manager'].some(role => 
    systemRoles.includes(role as SystemRole)
  );
}

/**
 * Prüft ob der User eine bestimmte Rolle hat
 * @param role - Die zu prüfende Rolle
 */
export function useHasRole(role: SystemRole): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  return systemRoles.includes(role);
}

/**
 * Prüft ob der User Schreibzugriff auf ein Modul hat
 * @param _modulCode - Der Code des Moduls (z.B. 'contractors', 'orders')
 */
export function useHasWriteAccess(_modulCode: string): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  // Admins haben immer Schreibzugriff
  if (['superadmin', 'admin', 'manager'].some(r => systemRoles.includes(r as SystemRole))) {
    return true;
  }
  
  // Standard-User haben Schreibzugriff auf eigene Daten
  return systemRoles.includes('user');
}

/**
 * Prüft ob der User Lesezugriff auf ein Modul hat
 * @param _modulCode - Der Code des Moduls
 */
export function useHasReadAccess(_modulCode: string): boolean | undefined {
  const { systemRoles, loading } = useIAM();
  
  if (loading) return undefined;
  
  // Alle authentifizierten User mit einer Rolle haben Lesezugriff
  return systemRoles.length > 0;
}
