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
import { ListSkeleton } from '@/components/ListSkeleton';
import {
  OBJECT_ORDER_STATUS_VALUES,
  OBJECT_ORDER_STATUS_LABELS,
  AUFTRAGSTYP_VALUES,
  AUFTRAGSTYP_LABELS,
  ObjectOrderStatusEnum,
  AuftragstypEnum,
  enumToOptions,
} from '@/lib/enums';
import { useAdminObjectOrders } from '../hooks/useAdminObjectOrders';

export function ObjectOrderListView() {
  const { data: orders, isLoading } = useAdminObjectOrders();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ObjectOrderStatusEnum | undefined>();
  const [typeFilter, setTypeFilter] = useState<AuftragstypEnum | undefined>();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!order.address.toLowerCase().includes(q) && !order.city.toLowerCase().includes(q) && !order.postalCode.includes(q) && !order.customerName.toLowerCase().includes(q)) return false;
      }
      if (statusFilter && order.status !== statusFilter) return false;
      if (typeFilter && order.type !== typeFilter) return false;
      return true;
    });
  }, [orders, searchQuery, statusFilter, typeFilter]);

  const pipelineStats: PipelineStat[] = useMemo(() => {
    if (!orders?.length) return [];
    const total = orders.length;
    return OBJECT_ORDER_STATUS_VALUES
      .map((status) => {
        const count = orders.filter((o) => o.status === status).length;
        if (count === 0) return null;
        const config = OBJECT_ORDER_STATUS_CONFIG[status];
        return { key: status, label: OBJECT_ORDER_STATUS_LABELS[status], count, percent: Math.round((count / total) * 100), icon: config?.icon, bgColor: config?.bgColor || 'bg-muted' };
      })
      .filter(Boolean) as PipelineStat[];
  }, [orders]);

  const handleReset = () => { setSearchQuery(''); setStatusFilter(undefined); setTypeFilter(undefined); };
  const statusOptions = enumToOptions(OBJECT_ORDER_STATUS_VALUES, OBJECT_ORDER_STATUS_LABELS);
  const typeOptions = enumToOptions(AUFTRAGSTYP_VALUES, AUFTRAGSTYP_LABELS);

  return (
    <AdminLayout title="Objektaufträge" subtitle="Pool-Verwaltung" count={isLoading ? undefined : filteredOrders.length}
      actionButton={<Button size="sm" className="gap-1.5"><Plus className="w-4 h-4" />Neu</Button>}
    >
      {isLoading ? <ListSkeleton count={5} showAvatar={false} showBadge /> : (
        <>
          <PipelineCards stats={pipelineStats} activeFilter={statusFilter} onFilterChange={(k) => setStatusFilter(k === statusFilter ? undefined : k as ObjectOrderStatusEnum)} className="mb-4" />
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />Liste</TabsTrigger>
              <TabsTrigger value="map" className="gap-2"><Map className="w-4 h-4" />Karte</TabsTrigger>
            </TabsList>
          </Tabs>
          <FilterRow searchValue={searchQuery} onSearchChange={setSearchQuery} searchPlaceholder="Adresse, PLZ, Stadt, Name..." statusOptions={statusOptions} statusValue={statusFilter} onStatusChange={(v) => setStatusFilter(v as ObjectOrderStatusEnum | undefined)} statusPlaceholder="Status" typeOptions={typeOptions} typeValue={typeFilter} onTypeChange={(v) => setTypeFilter(v as AuftragstypEnum | undefined)} typePlaceholder="Typ" onReset={handleReset} className="mb-4" />

          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">Keine Aufträge gefunden</CardContent></Card>
              ) : filteredOrders.map((order) => {
                const statusConfig = OBJECT_ORDER_STATUS_CONFIG[order.status];
                return (
                  <Card key={order.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{order.address}</p>
                            <p className="text-sm text-muted-foreground">{order.postalCode} {order.city}</p>
                          </div>
                        </div>
                        <Badge variant={statusConfig?.variant || 'secondary'}>{OBJECT_ORDER_STATUS_LABELS[order.status]}</Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <Badge variant="outline">{AUFTRAGSTYP_LABELS[order.type] ?? order.type}</Badge>
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Euro className="w-3.5 h-3.5" />
                          {order.amount.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <OrderMap orders={[]} onOrderClick={(id) => console.log('Order:', id)} className="h-[60vh] rounded-lg overflow-hidden border border-border" />
          )}
        </>
      )}
    </AdminLayout>
  );
}
