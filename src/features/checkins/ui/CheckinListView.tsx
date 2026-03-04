import { useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, User, Clock, MapPin } from 'lucide-react';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useAdminCheckins } from '../hooks/useAdminCheckins';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatTime(dateString: string) {
  return format(parseISO(dateString), 'HH:mm', { locale: de });
}

function calcDuration(start: string, end: string | null) {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const mins = Math.floor((e.getTime() - s.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const statusConfig = {
  vor_ort: { label: 'Vor Ort', variant: 'default' as const },
  nachbearbeitung: { label: 'Nachbearbeitung', variant: 'secondary' as const },
  completed: { label: 'Abgeschlossen', variant: 'outline' as const },
};

export function CheckinListView() {
  const { data: checkins, isLoading } = useAdminCheckins();
  const activeCount = useMemo(() => checkins?.filter(c => c.status !== 'completed').length ?? 0, [checkins]);

  return (
    <AdminLayout title="Check-in/out" subtitle={isLoading ? undefined : `${activeCount} aktuell aktiv`} count={isLoading ? undefined : checkins?.length}>
      {isLoading ? <ListSkeleton count={4} showAvatar showBadge /> : (
        <div className="space-y-3">
          {!checkins?.length ? (
            <div className="text-center py-8 text-muted-foreground">Keine Check-ins vorhanden</div>
          ) : checkins.map((c) => {
            const cfg = statusConfig[c.status];
            return (
              <Card key={c.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{c.customerName}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{c.address}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <LogIn className="w-3.5 h-3.5" />{formatTime(c.vorOrtCheckinAt)}
                    </span>
                    {c.vorOrtCheckoutAt ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <LogOut className="w-3.5 h-3.5" />{formatTime(c.vorOrtCheckoutAt)}
                      </span>
                    ) : c.status === 'vor_ort' ? (
                      <span className="flex items-center gap-1 text-primary">
                        <Clock className="w-3.5 h-3.5 animate-pulse" />Läuft...
                      </span>
                    ) : null}
                    <span className="ml-auto text-muted-foreground">
                      <Clock className="w-3.5 h-3.5 inline mr-0.5" />
                      {calcDuration(c.vorOrtCheckinAt, c.vorOrtCheckoutAt)}
                    </span>
                  </div>

                  {c.nachbearbeitungCheckinAt && (
                    <div className="flex items-center gap-4 text-xs mt-1.5 pt-1.5 border-t border-border">
                      <span className="text-muted-foreground text-[10px]">Nachbearbeitung:</span>
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <LogIn className="w-3 h-3" />{formatTime(c.nachbearbeitungCheckinAt)}
                      </span>
                      {c.nachbearbeitungCheckoutAt ? (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <LogOut className="w-3 h-3" />{formatTime(c.nachbearbeitungCheckoutAt)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-primary">
                          <Clock className="w-3 h-3 animate-pulse" />Läuft...
                        </span>
                      )}
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
