import { useState, useMemo } from 'react';
import { List, Map } from 'lucide-react';
import { TechnicianOrder } from '@/types/technician';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoolMap } from './PoolMap';
import { TechnicianOrderCard } from './TechnicianOrderCard';
import { FilterRow } from './FilterRow';
import { AUFTRAGSTYP_VALUES, AUFTRAGSTYP_LABELS, enumToOptions } from '@/lib/enums';

interface PoolViewProps {
  orders: TechnicianOrder[];
  onOrderClick: (order: TechnicianOrder) => void;
}

export function PoolView({ orders, onOrderClick }: PoolViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  
  const allPoolOrders = orders.filter(order => order.status === 'published');
  
  // Apply filters
  const poolOrders = useMemo(() => {
    return allPoolOrders.filter(order => {
      // Search filter
      if (searchValue) {
        const searchLower = searchValue.toLowerCase();
        const matchesSearch = 
          order.customerName.toLowerCase().includes(searchLower) ||
          order.city.toLowerCase().includes(searchLower) ||
          order.postalCode.includes(searchValue);
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (typeFilter && order.auftragstyp !== typeFilter) {
        return false;
      }
      
      return true;
    });
  }, [allPoolOrders, searchValue, typeFilter]);
  
  const typeOptions = enumToOptions(AUFTRAGSTYP_VALUES, AUFTRAGSTYP_LABELS);
  
  const handleReset = () => {
    setSearchValue('');
    setTypeFilter(undefined);
  };

  // Convert to format PoolMap expects
  const mapOrders = poolOrders.map(o => ({
    id: o.id,
    customerName: o.customerName,
    address: o.address,
    city: o.city,
    postalCode: o.postalCode,
    scheduledDate: o.scheduledDate,
    scheduledTime: o.scheduledTime,
    description: o.description,
    status: o.status as 'published',
    createdAt: o.createdAt,
    projectType: o.auftragstyp,
    lat: o.lat,
    lng: o.lng,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Verfügbare Aufträge</h1>
              <p className="text-primary-foreground/80 text-sm">
                {poolOrders.length} in deiner Region
              </p>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')}>
              <TabsList className="bg-primary-foreground/10">
                <TabsTrigger 
                  value="list" 
                  className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary"
                >
                  <List className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger 
                  value="map"
                  className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary"
                >
                  <Map className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="px-4 pt-4">
        <FilterRow
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Kunde, Stadt, PLZ..."
          typeOptions={typeOptions}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
          typePlaceholder="Auftragstyp"
          onReset={handleReset}
        />
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="p-4 pt-3 space-y-3">
          {poolOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center mt-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Map className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Keine verfügbaren Aufträge</h3>
              <p className="text-sm text-muted-foreground">
                Aktuell gibt es keine neuen Aufträge in deiner Region.
              </p>
            </div>
          ) : (
            poolOrders.map(order => (
              <TechnicianOrderCard 
                key={order.id} 
                order={order} 
                onClick={() => onOrderClick(order)} 
              />
            ))
          )}
        </div>
      ) : (
        <div className="h-[calc(100vh-140px)]">
          <PoolMap 
            orders={mapOrders} 
            onOrderClick={(orderId) => {
              const order = poolOrders.find(o => o.id === orderId);
              if (order) onOrderClick(order);
            }} 
          />
        </div>
      )}
    </div>
  );
}
