import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, User, MapPin, Check, Clock, Users, CalendarCheck } from 'lucide-react';
import { ListSkeleton } from '@/components/ListSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminBookings } from '../hooks/useAdminBookings';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: React.ElementType; accent?: string }) {
  return (
    <div className={`flex-1 min-w-[70px] rounded-lg p-3 ${accent || 'bg-muted/50'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold text-foreground">{value}</span>
    </div>
  );
}

export function BookingListView() {
  const { data: bookings, isLoading } = useAdminBookings();
  const [technikerFilter, setTechnikerFilter] = useState<string | undefined>();

  // Stats
  const stats = useMemo(() => {
    if (!bookings?.length) return { total: 0, confirmed: 0, pending: 0, technikere: 0 };
    const confirmed = bookings.filter(b => b.buchungBestaetigtAm).length;
    const uniqueTech = new Set(bookings.map(b => b.technikerId).filter(Boolean)).size;
    return { total: bookings.length, confirmed, pending: bookings.length - confirmed, technikere: uniqueTech };
  }, [bookings]);

  // Techniker options for filter
  const technikerOptions = useMemo(() => {
    if (!bookings?.length) return [];
    const map = new Map<string, { name: string; count: number }>();
    bookings.forEach(b => {
      if (b.technikerId && b.technikerName !== '–') {
        const existing = map.get(b.technikerId);
        if (existing) existing.count++;
        else map.set(b.technikerId, { name: b.technikerName, count: 1 });
      }
    });
    return Array.from(map.entries())
      .map(([id, { name, count }]) => ({ value: id, label: `${name} (${count})` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [bookings]);

  // Filtered
  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (!technikerFilter) return bookings;
    return bookings.filter(b => b.technikerId === technikerFilter);
  }, [bookings, technikerFilter]);

  // Techniker summary (sorted by count desc)
  const technikerSummary = useMemo(() => {
    if (!bookings?.length) return [];
    const map = new Map<string, { name: string; avatarUrl: string | null; count: number }>();
    bookings.forEach(b => {
      if (b.technikerId && b.technikerName !== '–') {
        const key = b.technikerId;
        const existing = map.get(key);
        if (existing) existing.count++;
        else map.set(key, { name: b.technikerName, avatarUrl: b.technikerAvatarUrl, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bookings]);

  return (
    <AdminLayout title="Buchungen" subtitle={isLoading ? undefined : `${filtered.length} Termine`} count={isLoading ? undefined : filtered.length}>
      {isLoading ? <ListSkeleton count={4} showAvatar showBadge /> : (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <KpiCard label="Gesamt" value={stats.total} icon={Calendar} />
            <KpiCard label="Bestätigt" value={stats.confirmed} icon={CalendarCheck} accent="bg-emerald-50 dark:bg-emerald-950/30" />
            <KpiCard label="Ausstehend" value={stats.pending} icon={Clock} accent="bg-amber-50 dark:bg-amber-950/30" />
            <KpiCard label="Techniker" value={stats.technikere} icon={Users} accent="bg-blue-50 dark:bg-blue-950/30" />
          </div>

          {/* Techniker Summary */}
          {technikerSummary.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {technikerSummary.map(ts => (
                <button
                  key={ts.name}
                  onClick={() => {
                    const match = technikerOptions.find(o => o.label.startsWith(ts.name));
                    if (match) setTechnikerFilter(technikerFilter === match.value ? undefined : match.value);
                  }}
                  className="flex items-center gap-2 flex-shrink-0 rounded-lg border border-border bg-card p-2 pr-3 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={ts.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">
                      {ts.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">{ts.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{ts.count}</Badge>
                </button>
              ))}
            </div>
          )}

          {/* Techniker Filter */}
          {technikerOptions.length > 0 && (
            <div className="flex gap-2">
              <Select value={technikerFilter || 'all'} onValueChange={(v) => setTechnikerFilter(v === 'all' ? undefined : v)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Techniker filtern..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Techniker</SelectItem>
                  {technikerOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Booking Cards */}
          <div className="space-y-3">
            {!filtered.length ? (
              <div className="text-center py-8 text-muted-foreground">Keine Buchungen vorhanden</div>
            ) : filtered.map((b) => {
              const isConfirmed = !!b.buchungBestaetigtAm;
              const isVortagDone = !!b.vortagBestaetigtAm;
              const timeStr = b.ganztaegig ? 'Ganztägig' : `${b.zeitVon?.slice(0, 5) || ''} – ${b.zeitBis?.slice(0, 5) || ''}`;

              return (
                <Card key={b.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{b.customerName}</p>
                          {b.angenommenAm && (
                            <p className="text-[11px] text-muted-foreground">
                              Angenommen {format(parseISO(b.angenommenAm), 'd. MMM', { locale: de })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isConfirmed ? (
                          <Badge variant="default" className="text-[10px]"><Check className="w-3 h-3 mr-0.5" />Bestätigt</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />Ausstehend</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-foreground text-xs">{b.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground text-xs">
                          {format(parseISO(b.datum), 'EEE, d. MMM yyyy', { locale: de })} · {timeStr}
                        </span>
                      </div>
                    </div>

                    {/* Techniker */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={b.technikerAvatarUrl ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[8px] font-semibold">
                          {b.technikerName !== '–' ? b.technikerName.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{b.technikerName}</span>
                      {isConfirmed && (
                        <Badge variant={isVortagDone ? 'default' : 'outline'} className="text-[10px] ml-auto">
                          Vortag {isVortagDone ? '✓' : 'offen'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
