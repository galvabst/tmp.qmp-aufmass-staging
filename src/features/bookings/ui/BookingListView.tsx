import { useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, Check, Clock } from 'lucide-react';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useAdminBookings } from '../hooks/useAdminBookings';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function BookingListView() {
  const { data: bookings, isLoading } = useAdminBookings();

  const confirmedCount = useMemo(() => bookings?.filter(b => b.buchungBestaetigtAm).length ?? 0, [bookings]);

  return (
    <AdminLayout title="Buchungen" subtitle={isLoading ? undefined : `${bookings?.length ?? 0} Termine`} count={isLoading ? undefined : bookings?.length}>
      {isLoading ? <ListSkeleton count={4} showAvatar showBadge /> : (
        <div className="space-y-3">
          {!bookings?.length ? (
            <div className="text-center py-8 text-muted-foreground">Keine Buchungen vorhanden</div>
          ) : bookings.map((b) => {
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

                  {isConfirmed && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-border">
                      <Badge variant={isVortagDone ? 'default' : 'outline'} className="text-[10px]">
                        Vortag {isVortagDone ? '✓' : 'offen'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
