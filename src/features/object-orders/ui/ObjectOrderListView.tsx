import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Map as MapIcon, CalendarX, Clock, AlertTriangle, Briefcase, UserCheck, Inbox } from 'lucide-react';
import { FilterRow } from '@/components/FilterRow';
import { OrderMap } from '@/components/OrderMap';
import { ListSkeleton } from '@/components/ListSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdminPoolTermine, type PoolKategorie, type AdminAuftrag } from '../hooks/useAdminObjectOrders';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

type AgingFilter = 'alle' | 'gt2' | 'gt5';
type TypFilter = 'alle' | 'thermocheck' | 'einweisung' | 'pv';
type ZeitFilter = 'alle' | 'zukunft' | 'vergangen';

const PIPELINE_LABELS: Record<string, string> = {
  termin_abwarten: 'Termin abwarten',
  termin_neubuchung: 'Neubuchung',
  wc1_durchfuehren: 'WC1 durchführen',
  termin_bestaetigt: 'Bestätigt',
};

const TYP_LABELS: Record<string, string> = {
  thermocheck: 'Thermocheck',
  einweisung: 'Einweisung',
  pv: 'PV',
};

function getInitials(name: string | null) {
  if (!name) return '–';
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() || '').join('');
}

function getAgeColor(days: number | null): string {
  if (days == null) return 'text-muted-foreground';
  if (days >= 5) return 'text-red-600';
  if (days >= 2) return 'text-amber-600';
  return 'text-emerald-600';
}

function getBorderClass(a: AdminAuftrag): string {
  if (a.kategorie === 'neubuchung') return 'border-l-orange-400';
  if (a.kategorie === 'angenommen') return 'border-l-blue-400';
  return 'border-l-muted';
}

export function ObjectOrderListView() {
  const { data: auftraege, isLoading } = useAdminPoolTermine();
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState<PoolKategorie>('frei');
  const [typFilter, setTypFilter] = useState<TypFilter>('alle');
  const [technikerFilter, setTechnikerFilter] = useState<string>('alle');
  const [agingFilter, setAgingFilter] = useState<AgingFilter>('alle');
  const [zeitFilter, setZeitFilter] = useState<ZeitFilter>('alle');

  // Frei = Pool-Aufträge ohne Techniker UND mit mindestens einem Terminvorschlag.
  // Aufträge ohne Vorschlag (z. B. wc1_durchfuehren ohne Termin) sind Orphans und
  // gehören nicht in die Kommandozentrale → werden ausgeblendet.
  const visible = useMemo(() => {
    if (!auftraege) return [];
    return auftraege.filter(a => {
      if (a.kategorie === 'frei') return a.hasVorschlag;
      return true;
    });
  }, [auftraege]);

  // KPIs
  const kpis = useMemo(() => {
    const frei = visible.filter(a => a.kategorie === 'frei');
    const oldestDays = frei.reduce((max, a) => Math.max(max, a.ageDays ?? 0), 0);
    return {
      frei: frei.length,
      angenommen: visible.filter(a => a.kategorie === 'angenommen').length,
      neubuchung: visible.filter(a => a.kategorie === 'neubuchung').length,
      oldestDays,
    };
  }, [visible]);

  const counts = useMemo(() => ({
    alle: visible.length,
    frei: visible.filter(a => a.kategorie === 'frei').length,
    angenommen: visible.filter(a => a.kategorie === 'angenommen').length,
    neubuchung: visible.filter(a => a.kategorie === 'neubuchung').length,
  }), [visible]);

  // Techniker-Dropdown source (alle eindeutig)
  const technikerOptions = useMemo(() => {
    const map = new Map<string, string>();
    visible.forEach(a => {
      if (a.technikerId && a.technikerName) map.set(a.technikerId, a.technikerName);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((x, y) => x.name.localeCompare(y.name));
  }, [visible]);

  const filtered = useMemo(() => {
    let result = visible;
    if (kategorieFilter !== 'alle') {
      result = result.filter(a => a.kategorie === kategorieFilter);
    }
    if (typFilter !== 'alle') {
      result = result.filter(a => a.auftragstyp === typFilter);
    }
    if (technikerFilter !== 'alle') {
      result = result.filter(a => a.technikerId === technikerFilter);
    }
    if (agingFilter === 'gt2') result = result.filter(a => (a.ageDays ?? 0) >= 2);
    if (agingFilter === 'gt5') result = result.filter(a => (a.ageDays ?? 0) >= 5);

    // Zeit-Filter (nur sinnvoll für Angenommen-Tab)
    if (kategorieFilter === 'angenommen' && zeitFilter !== 'alle') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      result = result.filter(a => {
        if (!a.naechsterTermin) return false;
        const d = new Date(a.naechsterTermin);
        return zeitFilter === 'zukunft' ? d >= today : d < today;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.address.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.postalCode.includes(q) ||
        a.customerName.toLowerCase().includes(q) ||
        (a.technikerName?.toLowerCase().includes(q) ?? false)
      );
    }
    // Älteste Frei-Aufträge zuerst; Angenommene nach Termin
    if (kategorieFilter === 'angenommen') {
      return [...result].sort((x, y) => (x.naechsterTermin || '').localeCompare(y.naechsterTermin || ''));
    }
    return [...result].sort((x, y) => (y.ageDays ?? 0) - (x.ageDays ?? 0));
  }, [visible, searchQuery, kategorieFilter, typFilter, technikerFilter, agingFilter, zeitFilter]);

  const showTechnikerFilter = kategorieFilter === 'angenommen' || kategorieFilter === 'alle';

  return (
    <AdminLayout
      title="Pool – Kommandozentrale"
      subtitle={isLoading ? undefined : `${filtered.length} von ${counts.alle} Aufträgen`}
      count={isLoading ? undefined : filtered.length}
    >
      {isLoading ? <ListSkeleton count={5} showAvatar={false} showBadge /> : (
        <>
          {/* KPI Cockpit */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Inbox className="w-3.5 h-3.5" /> Frei im Pool
                </div>
                <div className="text-2xl font-semibold tabular-nums">{kpis.frei}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Mit Terminvorschlag</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <UserCheck className="w-3.5 h-3.5" /> Angenommen
                </div>
                <div className="text-2xl font-semibold tabular-nums">{kpis.angenommen}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Termin steht</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Neubuchung
                </div>
                <div className="text-2xl font-semibold tabular-nums">{kpis.neubuchung}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Aktion nötig</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" /> Älteste offen
                </div>
                <div className={`text-2xl font-semibold tabular-nums ${getAgeColor(kpis.oldestDays)}`}>
                  {kpis.oldestDays}d
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {kpis.oldestDays >= 5 ? 'Kritisch' : kpis.oldestDays >= 2 ? 'Beobachten' : 'Im Plan'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kategorie Tabs */}
          <Tabs value={kategorieFilter} onValueChange={(v) => setKategorieFilter(v as PoolKategorie)} className="mb-3">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="frei">Frei ({counts.frei})</TabsTrigger>
              <TabsTrigger value="angenommen">Angenommen ({counts.angenommen})</TabsTrigger>
              <TabsTrigger value="neubuchung">Neubuchung ({counts.neubuchung})</TabsTrigger>
              <TabsTrigger value="alle">Alle ({counts.alle})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filter-Zeile */}
          <div className="flex flex-col gap-2 mb-3">
            <FilterRow
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Name, Adresse, PLZ, Stadt, Techniker..."
              onReset={() => { setSearchQuery(''); setTypFilter('alle'); setTechnikerFilter('alle'); setAgingFilter('alle'); setZeitFilter('alle'); }}
            />
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={typFilter} onValueChange={(v) => setTypFilter(v as TypFilter)}>
                <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue placeholder="Auftragstyp" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Typen</SelectItem>
                  <SelectItem value="thermocheck">Thermocheck</SelectItem>
                  <SelectItem value="einweisung">Einweisung</SelectItem>
                  <SelectItem value="pv">PV</SelectItem>
                </SelectContent>
              </Select>

              {showTechnikerFilter && (
                <Select value={technikerFilter} onValueChange={setTechnikerFilter}>
                  <SelectTrigger className="h-8 text-xs w-[200px]"><SelectValue placeholder="Techniker" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Techniker</SelectItem>
                    {technikerOptions.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={agingFilter} onValueChange={(v) => setAgingFilter(v as AgingFilter)}>
                <SelectTrigger className="h-8 text-xs w-[160px]"><SelectValue placeholder="Aging" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Jedes Alter</SelectItem>
                  <SelectItem value="gt2">≥ 2 Tage offen</SelectItem>
                  <SelectItem value="gt5">≥ 5 Tage offen</SelectItem>
                </SelectContent>
              </Select>

              {kategorieFilter === 'angenommen' && (
                <Select value={zeitFilter} onValueChange={(v) => setZeitFilter(v as ZeitFilter)}>
                  <SelectTrigger className="h-8 text-xs w-[150px]"><SelectValue placeholder="Zeitraum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Termine</SelectItem>
                    <SelectItem value="zukunft">Zukünftig</SelectItem>
                    <SelectItem value="vergangen">Vergangen</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                variant={showMap ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs ml-auto gap-1.5"
                onClick={() => setShowMap(s => !s)}
              >
                <MapIcon className="w-3.5 h-3.5" /> Karte
              </Button>
            </div>
          </div>

          {showMap && (
            <div className="mb-4">
              <OrderMap orders={[]} onOrderClick={(id) => console.log('Auftrag:', id)} className="h-[50vh] rounded-lg overflow-hidden border border-border" />
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Karte zeigt nur geocodierte Aufträge
              </p>
            </div>
          )}

          {/* Liste */}
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Keine Aufträge gefunden</CardContent></Card>
            ) : filtered.map((a) => (
              <Card key={a.id} className={`shadow-sm border-l-4 ${getBorderClass(a)}`}>
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-foreground truncate">{a.customerName}</p>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1">
                          <Briefcase className="w-2.5 h-2.5" />
                          {TYP_LABELS[a.auftragstyp] || a.auftragstyp}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {PIPELINE_LABELS[a.pipelineStatus] || a.pipelineStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className={`text-[10px] font-medium tabular-nums shrink-0 ${getAgeColor(a.ageDays)}`}>
                      {a.ageDays != null ? `${a.ageDays}d offen` : ''}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{a.address}, {a.postalCode} {a.city}</span>
                    </div>
                    {a.hasVorschlag && a.naechsterTermin ? (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>
                          {format(parseISO(a.naechsterTermin), 'EEE, d. MMM', { locale: de })} · {a.naechsteZeit}
                          {a.terminCount > 1 && <span className="text-muted-foreground"> (+{a.terminCount - 1})</span>}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground italic">
                        <CalendarX className="w-3 h-3 shrink-0" /> Kein Terminvorschlag
                      </div>
                    )}
                  </div>

                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                    {a.technikerName ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="w-5 h-5">
                          {a.technikerAvatar && <AvatarImage src={a.technikerAvatar} />}
                          <AvatarFallback className="text-[8px]">{getInitials(a.technikerName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-foreground">{a.technikerName}</span>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">Frei</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
