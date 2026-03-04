import { useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Clock, CheckCircle2, User, MapPin } from 'lucide-react';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useAdminQGQueue } from '../hooks/useAdminQGQueue';
import { AUFTRAGSTYP_LABELS } from '@/lib/enums';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function QGQueueView() {
  const { data: items, isLoading } = useAdminQGQueue();
  const pendingCount = useMemo(() => items?.filter(i => !i.hasBewertung).length ?? 0, [items]);

  return (
    <AdminLayout title="Quality Gate" subtitle={isLoading ? undefined : `${pendingCount} zur Prüfung`} count={isLoading ? undefined : items?.length}>
      {isLoading ? <ListSkeleton count={4} showAvatar showBadge /> : (
        <div className="space-y-3">
          {!items?.length ? (
            <div className="text-center py-8 text-muted-foreground">Keine eingereichten Aufträge</div>
          ) : items.map((item) => (
            <Card key={item.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{item.customerName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{item.address}
                      </p>
                    </div>
                  </div>
                  {item.hasBewertung ? (
                    <Badge variant="default" className="text-[10px]"><CheckCircle2 className="w-3 h-3 mr-0.5" />Bewertet</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]"><Clock className="w-3 h-3 mr-0.5" />Zur Prüfung</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                  <span>Eingereicht: {format(parseISO(item.eingereichtAm), 'd. MMM yyyy', { locale: de })}</span>
                  <Badge variant="outline" className="text-[10px]">{AUFTRAGSTYP_LABELS[item.auftragstyp as keyof typeof AUFTRAGSTYP_LABELS] ?? item.auftragstyp}</Badge>
                </div>

                {!item.hasBewertung && (
                  <div className="mt-3">
                    <Button size="sm" className="w-full gap-1.5">
                      <FileCheck className="w-4 h-4" />Prüfen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
