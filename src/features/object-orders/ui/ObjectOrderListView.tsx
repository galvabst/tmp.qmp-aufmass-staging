import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, List, Map, Clock } from 'lucide-react';
import { FilterRow } from '@/components/FilterRow';
import { OrderMap } from '@/components/OrderMap';
import { ListSkeleton } from '@/components/ListSkeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminPoolTermine } from '../hooks/useAdminObjectOrders';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

type KategorieFilter = 'alle' | 'terminiert' | 'nicht_terminiert';

export function ObjectOrderListView() {
  const { data: termine, isLoading } = useAdminPoolTermine();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState<KategorieFilter>('alle');

  const filtered = useMemo(() => {
    if (!termine) return [];
    let result = termine;
    if (kategorieFilter !== 'alle') {
      result = result.filter(t => t.kategorie === kategorieFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.address.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.postalCode.includes(q) ||
        t.customerName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [termine, searchQuery, kategorieFilter]);

  const counts = useMemo(() => {
    if (!termine) return { alle: 0, terminiert: 0, nicht_terminiert: 0 };
    return {
      alle: termine.length,
      terminiert: termine.filter(t => t.kategorie === 'terminiert').length,
      nicht_terminiert: termine.filter(t => t.kategorie === 'nicht_terminiert').length,
    };
  }, [termine]);

  const uniqueOrders = useMemo(() => new Set(filtered.map(t => t.auftragId)).size, [filtered]);

  return (
    <AdminLayout
      title="Pool-Terminvorschläge"
      subtitle={isLoading ? undefined : `${filtered.length} Einträge · ${uniqueOrders} Aufträge`}
      count={isLoading ? undefined : filtered.length}
    >
      {isLoading ? <ListSkeleton count={5} showAvatar={false} showBadge /> : (
        <>
          {/* Kategorie Filter */}
          <Tabs value={kategorieFilter} onValueChange={(v) => setKategorieFilter(v as KategorieFilter)} className="mb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alle">Alle ({counts.alle})</TabsTrigger>
              <TabsTrigger value="terminiert">Terminiert ({counts.terminiert})</TabsTrigger>
              <TabsTrigger value="nicht_terminiert">Offen ({counts.nicht_terminiert})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Mode */}
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
                <Card><CardContent className="p-6 text-center text-muted-foreground">Keine Einträge gefunden</CardContent></Card>
              ) : filtered.map((t) => {
                const isScheduled = t.kategorie === 'terminiert';
                const timeStr = t.ganztaegig ? 'Ganztägig' : `${t.zeitVon?.slice(0, 5) || ''} – ${t.zeitBis?.slice(0, 5) || ''}`;
                return (
                  <Card key={t.id} className={`shadow-sm ${isScheduled ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-muted'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm text-foreground">{t.customerName}</p>
                        <div className="flex gap-1.5 items-center">
                          {t.pipelineStatus && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono text-muted-foreground">
                              {t.pipelineStatus}
                            </Badge>
                          )}
                          <Badge variant={isScheduled ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                            {isScheduled ? 'Terminiert' : 'Offen'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-foreground text-xs">{t.address}, {t.postalCode} {t.city}</span>
                        </div>
                        {isScheduled && t.datum ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground text-xs">
                              {format(parseISO(t.datum), 'EEE, d. MMM yyyy', { locale: de })} · {timeStr}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground text-xs italic">Noch kein Termin vorgeschlagen</span>
                          </div>
                        )}
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
