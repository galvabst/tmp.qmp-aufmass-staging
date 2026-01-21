import { useState, useMemo } from 'react';
import { List, Map, Calendar } from 'lucide-react';
import { TechnicianOrder } from '@/types/technician';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoolMap } from './PoolMap';
import { TechnicianOrderCard } from './TechnicianOrderCard';
import { FilterRow } from './FilterRow';
import { AUFTRAGSTYP_VALUES, AUFTRAGSTYP_LABELS, enumToOptions } from '@/lib/enums';
import { format, parseISO, isToday, isTomorrow, isThisWeek, isAfter, startOfDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PoolViewProps {
  orders: TechnicianOrder[];
  onOrderClick: (order: TechnicianOrder) => void;
}

type SortOption = 'date' | 'amount';

export function PoolView({ orders, onOrderClick }: PoolViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [plzFilter, setPlzFilter] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>('date');
  
  const allPoolOrders = orders.filter(order => order.status === 'published');
  
  // Unique PLZ prefixes for filter
  const plzOptions = useMemo(() => {
    const prefixes = new Set<string>();
    allPoolOrders.forEach(order => {
      const prefix = order.postalCode.substring(0, 2) + 'xxx';
      prefixes.add(prefix);
    });
    return Array.from(prefixes).sort().map(prefix => ({
      value: prefix.substring(0, 2),
      label: prefix,
    }));
  }, [allPoolOrders]);
  
  // Apply filters and sorting
  const poolOrders = useMemo(() => {
    let filtered = allPoolOrders.filter(order => {
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
      
      // PLZ filter
      if (plzFilter && !order.postalCode.startsWith(plzFilter)) {
        return false;
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      } else {
        return (b.billableAmount || 0) - (a.billableAmount || 0);
      }
    });
    
    return filtered;
  }, [allPoolOrders, searchValue, typeFilter, plzFilter, sortBy]);
  
  // Group orders by date category
  const groupedOrders = useMemo(() => {
    const groups: { label: string; orders: TechnicianOrder[] }[] = [];
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(addDays(today, 1));
    const endOfWeek = startOfDay(addDays(today, 7));
    
    const todayOrders: TechnicianOrder[] = [];
    const tomorrowOrders: TechnicianOrder[] = [];
    const thisWeekOrders: TechnicianOrder[] = [];
    const laterOrders: TechnicianOrder[] = [];
    
    poolOrders.forEach(order => {
      const orderDate = parseISO(order.scheduledDate);
      if (isToday(orderDate)) {
        todayOrders.push(order);
      } else if (isTomorrow(orderDate)) {
        tomorrowOrders.push(order);
      } else if (isAfter(orderDate, tomorrow) && !isAfter(orderDate, endOfWeek)) {
        thisWeekOrders.push(order);
      } else {
        laterOrders.push(order);
      }
    });
    
    if (todayOrders.length > 0) groups.push({ label: 'Heute', orders: todayOrders });
    if (tomorrowOrders.length > 0) groups.push({ label: 'Morgen', orders: tomorrowOrders });
    if (thisWeekOrders.length > 0) groups.push({ label: 'Diese Woche', orders: thisWeekOrders });
    if (laterOrders.length > 0) groups.push({ label: 'Später', orders: laterOrders });
    
    return groups;
  }, [poolOrders]);
  
  const typeOptions = enumToOptions(AUFTRAGSTYP_VALUES, AUFTRAGSTYP_LABELS);
  
  const handleReset = () => {
    setSearchValue('');
    setTypeFilter(undefined);
    setPlzFilter(undefined);
    setSortBy('date');
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

  const hasActiveFilters = searchValue || typeFilter || plzFilter || sortBy !== 'date';

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

      {/* Filters */}
      <div className="px-4 pt-4 space-y-3">
        <FilterRow
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          searchPlaceholder="Kunde, Stadt, PLZ..."
          typeOptions={typeOptions}
          typeValue={typeFilter}
          onTypeChange={setTypeFilter}
          typePlaceholder="Auftragstyp"
          onReset={hasActiveFilters ? handleReset : undefined}
        />
        
        {/* Additional Filters Row */}
        <div className="flex gap-2">
          {plzOptions.length > 0 && (
            <Select value={plzFilter} onValueChange={setPlzFilter}>
              <SelectTrigger className="w-[120px] h-9 bg-card">
                <SelectValue placeholder="PLZ" />
              </SelectTrigger>
              <SelectContent>
                {plzOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[140px] h-9 bg-card">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Nach Datum</SelectItem>
              <SelectItem value="amount">Nach Vergütung</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="p-4 pt-3 space-y-4">
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
            groupedOrders.map(group => (
              <div key={group.label}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {group.label}
                </h3>
                <div className="space-y-3">
                  {group.orders.map(order => (
                    <TechnicianOrderCard 
                      key={order.id} 
                      order={order} 
                      onClick={() => onOrderClick(order)}
                      showFullDetails={false} // Pool zeigt nur PLZ + Stadt
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)]">
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
