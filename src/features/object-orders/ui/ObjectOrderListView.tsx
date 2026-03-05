import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, List, Map } from 'lucide-react';
import { FilterRow } from '@/components/FilterRow';
import { OrderMap } from '@/components/OrderMap';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useAdminPoolTermine } from '../hooks/useAdminObjectOrders';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function ObjectOrderListView() {
  const { data: termine, isLoading } = useAdminPoolTermine();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!termine) return [];
    if (!searchQuery) return termine;
    const q = searchQuery.toLowerCase();
    return termine.filter(t =>
      t.address.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.postalCode.includes(q) ||
      t.customerName.toLowerCase().includes(q)
    );
  }, [termine, searchQuery]);

  // Count unique orders
  const uniqueOrders = useMemo(() => new Set(filtered.map(t => t.auftragId)).size, [filtered]);

  return (
    <AdminLayout
      title="Pool-Terminvorschläge"
      subtitle={isLoading ? undefined : `${filtered.length} Termine · ${uniqueOrders} Aufträge`}
      count={isLoading ? undefined : filtered.length}
    >
      {isLoading ? <ListSkeleton count={5} showAvatar={false} showBadge /> : (
        <>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')} className="mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="gap-2"><List className="w-4 h-4" />Liste</TabsTrigger>
              <TabsTrigger value="map" className="gap-2"><Map className="w-4 h-4" />Karte</TabsTrigger>
            </TabsList>
          </Tabs>

          <FilterRow
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Adresse, PLZ, Stadt, Name..."
            onReset={() => setSearchQuery('')}
            className="mb-4"
          />

          {viewMode === 'list' ? (
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <Card><CardContent className="p-6 text-center text-muted-foreground">Keine offenen Terminvorschläge</CardContent></Card>
              ) : filtered.map((t) => {
                const timeStr = t.ganztaegig ? 'Ganztägig' : `${t.zeitVon?.slice(0, 5) || ''} – ${t.zeitBis?.slice(0, 5) || ''}`;
                return (
                  <Card key={t.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm text-foreground">{t.customerName}</p>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-foreground text-xs">{t.address}, {t.postalCode} {t.city}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-foreground text-xs">
                            {format(parseISO(t.datum), 'EEE, d. MMM yyyy', { locale: de })} · {timeStr}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <OrderMap orders={[]} onOrderClick={(id) => console.log('Termin:', id)} className="h-[60vh] rounded-lg overflow-hidden border border-border" />
          )}
        </>
      )}
    </AdminLayout>
  );
}
