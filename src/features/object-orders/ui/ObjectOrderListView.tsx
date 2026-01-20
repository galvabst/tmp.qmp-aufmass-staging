import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MapPin, Euro, List, Map } from 'lucide-react';
import { PipelineCards, PipelineStat } from '@/components/PipelineCards';
import { FilterRow } from '@/components/FilterRow';
import { OrderMap, OrderMapItem } from '@/components/OrderMap';
import { OBJECT_ORDER_STATUS_CONFIG } from '@/lib/status-config';
import { 
  OBJECT_ORDER_STATUS_VALUES, 
  OBJECT_ORDER_STATUS_LABELS,
  AUFTRAGSTYP_VALUES,
  AUFTRAGSTYP_LABELS,
  ObjectOrderStatusEnum,
  AuftragstypEnum,
  enumToOptions,
} from '@/lib/enums';

// Mock data with coordinates for German cities
const mockOrders: OrderMapItem[] = [
  { 
    id: '1', 
    address: 'Musterstraße 123', 
    city: 'Berlin', 
    postalCode: '10115',
    lat: 52.5200,
    lng: 13.4050,
    type: 'thermocheck',
    status: 'published',
    amount: 180,
  },
  { 
    id: '2', 
    address: 'Beispielweg 45', 
    city: 'München', 
    postalCode: '80331',
    lat: 48.1351,
    lng: 11.5820,
    type: 'pv',
    status: 'booked',
    amount: 150,
  },
  { 
    id: '3', 
    address: 'Testgasse 7', 
    city: 'Hamburg', 
    postalCode: '20095',
    lat: 53.5511,
    lng: 9.9937,
    type: 'thermocheck',
    status: 'draft',
    amount: 160,
  },
  { 
    id: '4', 
    address: 'Hauptstraße 42', 
    city: 'Frankfurt', 
    postalCode: '60311',
    lat: 50.1109,
    lng: 8.6821,
    type: 'einweisung',
    status: 'in_progress',
    amount: 200,
  },
  { 
    id: '5', 
    address: 'Rheinufer 15', 
    city: 'Köln', 
    postalCode: '50667',
    lat: 50.9375,
    lng: 6.9603,
    type: 'thermocheck',
    status: 'submitted',
    amount: 175,
  },
  { 
    id: '6', 
    address: 'Schlossallee 1', 
    city: 'Stuttgart', 
    postalCode: '70173',
    lat: 48.7758,
    lng: 9.1829,
    type: 'pv',
    status: 'approved',
    amount: 220,
  },
  { 
    id: '7', 
    address: 'Marktplatz 8', 
    city: 'Düsseldorf', 
    postalCode: '40213',
    lat: 51.2277,
    lng: 6.7735,
    type: 'thermocheck',
    status: 'published',
    amount: 165,
  },
  { 
    id: '8', 
    address: 'Bahnhofstraße 22', 
    city: 'Leipzig', 
    postalCode: '04109',
    lat: 51.3397,
    lng: 12.3731,
    type: 'pv',
    status: 'booked',
    amount: 190,
  },
];

export function ObjectOrderListView() {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ObjectOrderStatusEnum | undefined>();
  const [typeFilter, setTypeFilter] = useState<AuftragstypEnum | undefined>();

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          order.address.toLowerCase().includes(query) ||
          order.city.toLowerCase().includes(query) ||
          order.postalCode.includes(query);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter && order.status !== statusFilter) return false;
      
      // Type filter
      if (typeFilter && order.type !== typeFilter) return false;
      
      return true;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  // Calculate pipeline stats
  const pipelineStats: PipelineStat[] = useMemo(() => {
    const total = mockOrders.length;
    return OBJECT_ORDER_STATUS_VALUES.map((status) => {
      const count = mockOrders.filter((o) => o.status === status).length;
      const config = OBJECT_ORDER_STATUS_CONFIG[status];
      return {
        key: status,
        label: OBJECT_ORDER_STATUS_LABELS[status],
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        icon: config?.icon,
        bgColor: config?.bgColor || 'bg-muted',
      };
    });
  }, []);

  const handleFilterChange = (status: ObjectOrderStatusEnum | undefined) => {
    setStatusFilter(status === statusFilter ? undefined : status);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter(undefined);
    setTypeFilter(undefined);
  };

  const statusOptions = enumToOptions(OBJECT_ORDER_STATUS_VALUES, OBJECT_ORDER_STATUS_LABELS);
  const typeOptions = enumToOptions(AUFTRAGSTYP_VALUES, AUFTRAGSTYP_LABELS);

  const addButton = (
    <Button size="sm" className="gap-1.5">
      <Plus className="w-4 h-4" />
      Neu
    </Button>
  );

  return (
    <AdminLayout 
      title="Objektaufträge" 
      subtitle="Pool-Verwaltung"
      count={filteredOrders.length}
      actionButton={addButton}
    >
      {/* Pipeline Stats */}
      <PipelineCards
        stats={pipelineStats}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
        className="mb-4"
      />

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <List className="w-4 h-4" />
            Liste
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-2">
            <Map className="w-4 h-4" />
            Karte
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Row */}
      <FilterRow
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Adresse, PLZ, Stadt..."
        statusOptions={statusOptions}
        statusValue={statusFilter}
        onStatusChange={(v) => setStatusFilter(v as ObjectOrderStatusEnum | undefined)}
        statusPlaceholder="Status"
        typeOptions={typeOptions}
        typeValue={typeFilter}
        onTypeChange={(v) => setTypeFilter(v as AuftragstypEnum | undefined)}
        typePlaceholder="Typ"
        onReset={handleReset}
        className="mb-4"
      />

      {/* Content: List or Map */}
      {viewMode === 'list' ? (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Keine Aufträge gefunden
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const statusConfig = OBJECT_ORDER_STATUS_CONFIG[order.status];
              
              return (
                <Card key={order.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{order.address}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.postalCode} {order.city}
                          </p>
                        </div>
                      </div>
                      <Badge variant={statusConfig?.variant || 'secondary'}>
                        {OBJECT_ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <Badge variant="outline">
                        {AUFTRAGSTYP_LABELS[order.type]}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <Euro className="w-3.5 h-3.5" />
                        {order.amount.toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <OrderMap
          orders={filteredOrders}
          onOrderClick={(id) => console.log('Order clicked:', id)}
          className="h-[60vh] rounded-lg overflow-hidden border border-border"
        />
      )}
    </AdminLayout>
  );
}
