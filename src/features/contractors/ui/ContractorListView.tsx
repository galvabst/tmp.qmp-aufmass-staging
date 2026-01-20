import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Clock, Users } from 'lucide-react';
import { 
  ContractorStatusEnum, 
  CONTRACTOR_STATUS_LABELS 
} from '@/lib/enums';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useState, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';

// Status-Konfiguration mit Icons und Variants
const STATUS_CONFIG: Record<ContractorStatusEnum, { 
  icon: LucideIcon; 
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}> = {
  active: { icon: UserCheck, variant: 'default' },
  onboarding: { icon: Clock, variant: 'secondary' },
  suspended: { icon: UserX, variant: 'destructive' },
  exit_mode: { icon: UserX, variant: 'outline' },
};

// Mock-Daten - wird später durch Supabase-Query ersetzt
const mockContractors: Array<{
  id: string;
  name: string;
  status: ContractorStatusEnum;
  phone: string;
}> = [
  { id: '1', name: 'Max Mustermann', status: 'active', phone: '+49 170 1234567' },
  { id: '2', name: 'Erika Musterfrau', status: 'onboarding', phone: '+49 171 9876543' },
  { id: '3', name: 'Hans Schmidt', status: 'suspended', phone: '+49 172 5555555' },
];

export function ContractorListView() {
  const [isLoading, setIsLoading] = useState(true);
  const [contractors, setContractors] = useState<typeof mockContractors>([]);

  // Simuliere Daten-Laden (später durch useQuery ersetzen)
  useEffect(() => {
    const timer = setTimeout(() => {
      setContractors(mockContractors);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AdminLayout 
      title="Auftragnehmer" 
      subtitle={isLoading ? 'Lade...' : `${contractors.length} Techniker`}
    >
      {/* Loading State */}
      {isLoading ? (
        <ListSkeleton count={3} showAvatar showBadge />
      ) : (
        <div className="space-y-3">
          {contractors.map((contractor) => {
            const config = STATUS_CONFIG[contractor.status];
            const StatusIcon = config?.icon || Users;
            
            return (
              <Card key={contractor.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <StatusIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{contractor.name}</p>
                        <p className="text-sm text-muted-foreground">{contractor.phone}</p>
                      </div>
                    </div>
                    <Badge variant={config?.variant || 'secondary'}>
                      {CONTRACTOR_STATUS_LABELS[contractor.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
