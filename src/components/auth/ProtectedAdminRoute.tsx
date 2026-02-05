import { ReactNode } from 'react';
import { useIsAdmin } from '@/hooks/useIAM';
import { AccessDeniedScreen } from '@/components/ui/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

/**
 * Wrapper-Komponente für Admin-Routen
 * Prüft ob der User Admin-Rechte hat und zeigt entsprechend:
 * - Loading-State während der Prüfung
 * - AccessDenied wenn keine Berechtigung
 * - Children wenn berechtigt
 */
export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const isAdmin = useIsAdmin();

  // Loading State
  if (isAdmin === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Berechtigungen werden geprüft...</p>
        </div>
      </div>
    );
  }

  // Access Denied
  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  // Authorized
  return <>{children}</>;
}
