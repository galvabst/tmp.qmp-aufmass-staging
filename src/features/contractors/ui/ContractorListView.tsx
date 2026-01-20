import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

// Placeholder data - wird später durch Supabase-Query ersetzt
const mockContractors = [
  { id: '1', name: 'Max Mustermann', status: 'active', phone: '+49 170 1234567' },
  { id: '2', name: 'Erika Musterfrau', status: 'onboarding', phone: '+49 171 9876543' },
  { id: '3', name: 'Hans Schmidt', status: 'suspended', phone: '+49 172 5555555' },
];

const statusConfig = {
  active: { label: 'Aktiv', variant: 'default' as const, icon: UserCheck },
  onboarding: { label: 'Onboarding', variant: 'secondary' as const, icon: Clock },
  suspended: { label: 'Gesperrt', variant: 'destructive' as const, icon: UserX },
  exit_mode: { label: 'Exit', variant: 'outline' as const, icon: UserX },
};

export function ContractorListView() {
  return (
    <AdminLayout 
      title="Auftragnehmer" 
      subtitle={`${mockContractors.length} Techniker`}
    >
      <div className="space-y-3">
        {mockContractors.map((contractor) => {
          const config = statusConfig[contractor.status as keyof typeof statusConfig];
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
                    {config?.label || contractor.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
