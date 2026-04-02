import { useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, Clock, CheckCircle2, User, MapPin, Video, Link as LinkIcon, Loader2, Receipt, Search, Banknote, ArrowRight } from 'lucide-react';
import { ListSkeleton } from '@/components/ListSkeleton';
import { useAdminQGQueue, useAdminQGPraxistests, useApprovePraxistest } from '../hooks/useAdminQGQueue';
import { useAdminAbrechnungen, useUpdateAbrechnungStatus } from '@/hooks/useAdminAbrechnung';
import { AUFTRAGSTYP_LABELS } from '@/lib/enums';
import { ABRECHNUNG_STATUS_LABELS, AbrechnungStatusEnum } from '@/hooks/useAbrechnungStatus';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const NEXT_STATUS: Partial<Record<AbrechnungStatusEnum, AbrechnungStatusEnum>> = {
  rechnung_eingegangen: 'in_pruefung',
  in_pruefung: 'bezahlt',
};

const STATUS_ICON: Record<AbrechnungStatusEnum, React.ReactNode> = {
  offen: <Clock className="w-3.5 h-3.5" />,
  rechnung_eingegangen: <Receipt className="w-3.5 h-3.5" />,
  in_pruefung: <Search className="w-3.5 h-3.5" />,
  bezahlt: <Banknote className="w-3.5 h-3.5" />,
};

const STATUS_BADGE_VARIANT: Record<AbrechnungStatusEnum, 'secondary' | 'default' | 'destructive' | 'outline'> = {
  offen: 'secondary',
  rechnung_eingegangen: 'outline',
  in_pruefung: 'default',
  bezahlt: 'default',
};

export function QGQueueView() {
  const { data: items, isLoading } = useAdminQGQueue();
  const { data: praxistests, isLoading: praxisLoading } = useAdminQGPraxistests();
  const { data: abrechnungen, isLoading: abrLoading } = useAdminAbrechnungen();
  const approveMutation = useApprovePraxistest();
  const updateAbrStatus = useUpdateAbrechnungStatus();
  
  const pendingCount = useMemo(() => items?.filter(i => !i.hasBewertung).length ?? 0, [items]);
  const praxisCount = praxistests?.length ?? 0;
  const abrPendingCount = useMemo(() => abrechnungen?.filter(a => a.status !== 'offen' && a.status !== 'bezahlt').length ?? 0, [abrechnungen]);

  const handleApprove = async (onboardingId: string, name: string) => {
    try {
      await approveMutation.mutateAsync(onboardingId);
      toast.success(`Praxistest von ${name} freigegeben`);
    } catch {
      toast.error('Fehler beim Freigeben');
    }
  };

  return (
    <AdminLayout title="Quality Gate" subtitle={isLoading ? undefined : `${pendingCount} zur Prüfung`} count={isLoading ? undefined : (items?.length ?? 0) + praxisCount}>
      <Tabs defaultValue="auftraege" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="auftraege" className="flex-1">
            Aufträge {pendingCount > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px]">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="praxistests" className="flex-1">
            Praxistests {praxisCount > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px]">{praxisCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auftraege">
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
        </TabsContent>

        <TabsContent value="praxistests">
          {praxisLoading ? <ListSkeleton count={3} showAvatar showBadge /> : (
            <div className="space-y-3">
              {!praxistests?.length ? (
                <div className="text-center py-8 text-muted-foreground">Keine ausstehenden Praxistests</div>
              ) : praxistests.map((pt) => (
                <Card key={pt.onboardingId} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={pt.avatarUrl || undefined} />
                        <AvatarFallback>{pt.contractorName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{pt.contractorName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Eingereicht: {format(parseISO(pt.eingereichtAm), 'd. MMM yyyy HH:mm', { locale: de })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        <Clock className="w-3 h-3 mr-0.5" />Prüfen
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <a
                        href={pt.scanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                      >
                        <LinkIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-primary underline truncate">{pt.scanUrl}</span>
                      </a>

                      <a
                        href={pt.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
                      >
                        <Video className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-foreground">Drohnenflug-Video ansehen</span>
                      </a>
                    </div>

                    <Button
                      size="sm"
                      className="w-full mt-3 gap-1.5"
                      onClick={() => handleApprove(pt.onboardingId, pt.contractorName)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Freigeben
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
