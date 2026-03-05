import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, List, Map, Clock, CalendarX } from 'lucide-react';
import { FilterRow } from '@/components/FilterRow';
import { OrderMap } from '@/components/OrderMap';
import { ListSkeleton } from '@/components/ListSkeleton';
import { Badge } from '@/components/ui/badge';
import { useAdminPoolTermine } from '../hooks/useAdminObjectOrders';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

type KategorieFilter = 'alle' | 'mit_termin' | 'ohne_termin';

export function ObjectOrderListView() {
  const { data: auftraege, isLoading } = useAdminPoolTermine();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState<KategorieFilter>('alle');

  const filtered = useMemo(() => {
    if (!auftraege) return [];
    let result = auftraege;
    if (kategorieFilter !== 'alle') {
      result = result.filter(a => a.kategorie === kategorieFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.address.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.postalCode.includes(q) ||
        a.customerName.toLowerCase().includes(q)
      );
    }
    return result;
  }, [auftraege, searchQuery, kategorieFilter]);

  const counts = useMemo(() => {
    if (!auftraege) return { alle: 0, mit_termin: 0, ohne_termin: 0 };
    return {
      alle: auftraege.length,
      mit_termin: auftraege.filter(a => a.kategorie === 'mit_termin').length,
      ohne_termin: auftraege.filter(a => a.kategorie === 'ohne_termin').length,
    };
  }, [auftraege]);

  return (
    <AdminLayout
      title="Pool – Offene Aufträge"
      subtitle={isLoading ? undefined : `${filtered.length} unzugewiesene Aufträge`}
      count={isLoading ? undefined : filtered.length}
    >
      {isLoading ? <ListSkeleton count={5} showAvatar={false} showBadge /> : (
        <>
          <Tabs value={kategorieFilter} onValueChange={(v) => setKategorieFilter(v as KategorieFilter)} className="mb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alle">Alle ({counts.alle})</TabsTrigger>
              <TabsTrigger value="ohne_termin">Ohne Vorschlag ({counts.ohne_termin})</TabsTrigger>
              <TabsTrigger value="mit_termin">Mit Vorschlag ({counts.mit_termin})</TabsTrigger>
            </TabsList>
          </Tabs>

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
                <Card><CardContent className="p-6 text-center text-muted-foreground">Keine Aufträge gefunden</CardContent></Card>
              ) : filtered.map((a) => {
                const hasTermin = a.kategorie === 'mit_termin';
                return (
                  <Card key={a.id} className={`shadow-sm ${hasTermin ? 'border-l-4 border-l-orange-400' : 'border-l-4 border-l-muted'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-sm text-foreground">{a.customerName}</p>
                        <div className="flex gap-1.5 items-center">
                          {a.pipelineStatus && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono text-muted-foreground">
                              {a.pipelineStatus}
                            </Badge>
                          )}
                          <Badge variant={hasTermin ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0.5">
                            {hasTermin ? `${a.terminCount} Termin${a.terminCount > 1 ? 'e' : ''}` : 'Offen'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-foreground text-xs">{a.address}, {a.postalCode} {a.city}</span>
                        </div>
                        {hasTermin && a.naechsterTermin ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-foreground text-xs">
                              {format(parseISO(a.naechsterTermin), 'EEE, d. MMM yyyy', { locale: de })} · {a.naechsteZeit}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CalendarX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground text-xs italic">Kein Terminvorschlag</span>
                          </div>
                        )}
                        {a.technikerId && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">Techniker zugewiesen</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <OrderMap orders={[]} onOrderClick={(id) => console.log('Auftrag:', id)} className="h-[60vh] rounded-lg overflow-hidden border border-border" />
          )}
        </>
      )}
    </AdminLayout>
  );
}
