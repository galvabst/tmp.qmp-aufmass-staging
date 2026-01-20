import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { 
  ContractorStatusEnum, 
  CONTRACTOR_STATUS_VALUES,
  CONTRACTOR_STATUS_LABELS,
  enumToOptions,
} from '@/lib/enums';
import { CONTRACTOR_STATUS_CONFIG } from '@/lib/status-config';
import { ListSkeleton } from '@/components/ListSkeleton';
import { PipelineCards, PipelineStat } from '@/components/PipelineCards';
import { FilterRow } from '@/components/FilterRow';

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
  { id: '4', name: 'Anna Weber', status: 'active', phone: '+49 173 1111111' },
  { id: '5', name: 'Thomas Müller', status: 'active', phone: '+49 174 2222222' },
  { id: '6', name: 'Lisa Fischer', status: 'exit_mode', phone: '+49 175 3333333' },
];

export function ContractorListView() {
  const [isLoading, setIsLoading] = useState(true);
  const [contractors, setContractors] = useState<typeof mockContractors>([]);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Simuliere Daten-Laden (später durch useQuery ersetzen)
  useEffect(() => {
    const timer = setTimeout(() => {
      setContractors(mockContractors);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Pipeline Stats berechnen
  const pipelineStats: PipelineStat[] = useMemo(() => {
    const total = contractors.length;
    return CONTRACTOR_STATUS_VALUES.map((status) => {
      const count = contractors.filter((c) => c.status === status).length;
      const config = CONTRACTOR_STATUS_CONFIG[status];
      return {
        key: status,
        label: CONTRACTOR_STATUS_LABELS[status],
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        icon: config.icon,
        bgColor: config.bgColor,
      };
    });
  }, [contractors]);

  // Gefilterte Daten
  const filteredContractors = useMemo(() => {
    return contractors.filter((c) => {
      // Status Filter
      if (statusFilter && c.status !== statusFilter) return false;
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [contractors, statusFilter, searchQuery]);

  // Status Options für Select
  const statusOptions = enumToOptions(CONTRACTOR_STATUS_VALUES, CONTRACTOR_STATUS_LABELS);

  // Reset Handler
  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter(null);
  };

  return (
    <AdminLayout 
      title="Auftragnehmer" 
      subtitle="Techniker"
      count={isLoading ? undefined : filteredContractors.length}
      actionButton={
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Neu
        </Button>
      }
    >
      {/* Loading State */}
      {isLoading ? (
        <ListSkeleton count={3} showAvatar showBadge />
      ) : (
        <div className="space-y-4">
          {/* Pipeline Cards */}
          <PipelineCards
            stats={pipelineStats}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
          />

          {/* Filter Row */}
          <FilterRow
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Techniker suchen..."
            statusOptions={statusOptions}
            statusValue={statusFilter || undefined}
            onStatusChange={(v) => setStatusFilter(v || null)}
            statusPlaceholder="Status"
            onReset={handleReset}
          />

          {/* Contractor List */}
          <div className="space-y-3">
            {filteredContractors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Techniker gefunden
              </div>
            ) : (
              filteredContractors.map((contractor) => {
                const config = CONTRACTOR_STATUS_CONFIG[contractor.status];
                const StatusIcon = config.icon;
                
                return (
                  <Card key={contractor.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
                            <StatusIcon className="w-5 h-5 text-foreground/70" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{contractor.name}</p>
                            <p className="text-sm text-muted-foreground">{contractor.phone}</p>
                          </div>
                        </div>
                        <Badge variant={config.variant}>
                          {CONTRACTOR_STATUS_LABELS[contractor.status]}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
