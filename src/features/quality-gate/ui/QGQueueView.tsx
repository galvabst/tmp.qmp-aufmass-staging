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
  const { data: praxistests, isLoading: praxisLoading } = useAdminQGPraxistests();
  const { data: abrechnungen, isLoading: abrLoading } = useAdminAbrechnungen();
  const approveMutation = useApprovePraxistest();
  const updateAbrStatus = useUpdateAbrechnungStatus();

  const praxisCount = praxistests?.length ?? 0;
  const abrPendingCount = useMemo(
    () => abrechnungen?.filter(a => a.status !== 'bezahlt').length ?? 0,
    [abrechnungen]
  );

  const handleApprove = async (onboardingId: string, name: string) => {
    try {
      await approveMutation.mutateAsync(onboardingId);
      toast.success(`Praxistest von ${name} freigegeben`);
    } catch {
      toast.error('Fehler beim Freigeben');
    }
  };

  const handleAdvanceStatus = async (auftragId: string, currentStatus: AbrechnungStatusEnum) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await updateAbrStatus.mutateAsync({ auftragId, newStatus: next });
      toast.success(`Status auf "${ABRECHNUNG_STATUS_LABELS[next]}" gesetzt`);
    } catch {
      toast.error('Fehler beim Status-Update');
    }
  };

  return (
    <AdminLayout
      title="Abnahme"
      subtitle={`${praxisCount} Praxistests · ${abrPendingCount} offene Abrechnungen`}
      count={praxisCount + abrPendingCount}
    >
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="border-l-4 border-l-accent shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileCheck className="w-3.5 h-3.5" /> Praxistests
            </div>
            <div className="text-3xl font-bold tabular-nums text-foreground">{praxisCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Ausstehend</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Receipt className="w-3.5 h-3.5" /> Abrechnungen
            </div>
            <div className="text-3xl font-bold tabular-nums text-foreground">{abrPendingCount}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Offen</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="praxistests" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="praxistests" className="flex-1 text-xs">
            Praxistests {praxisCount > 0 && <Badge variant="destructive" className="ml-1 text-[10px]">{praxisCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="abrechnung" className="flex-1 text-xs">
            Abrechnung {abrPendingCount > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{abrPendingCount}</Badge>}
          </TabsTrigger>
        </TabsList>


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

        {/* Abrechnung Tab */}
        <TabsContent value="abrechnung">
          {abrLoading ? <ListSkeleton count={4} showAvatar showBadge /> : (
            <div className="space-y-3">
              {!abrechnungen?.length ? (
                <div className="text-center py-8 text-muted-foreground">Keine abgenommenen Aufträge</div>
              ) : abrechnungen.map((item) => {
                const next = NEXT_STATUS[item.status];
                return (
                  <Card key={item.auftragId} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm text-foreground">{item.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">{item.technikerName}</p>
                        </div>
                        <Badge variant={STATUS_BADGE_VARIANT[item.status]} className="text-[10px] gap-1">
                          {STATUS_ICON[item.status]}
                          {ABRECHNUNG_STATUS_LABELS[item.status]}
                        </Badge>
                      </div>

                      {item.betrag != null && (
                        <p className="text-sm font-bold text-foreground mb-2">{item.betrag.toFixed(0)} €</p>
                      )}

                      {item.rechnungEingegangenAm && (
                        <p className="text-[11px] text-muted-foreground">
                          Rechnung: {format(parseISO(item.rechnungEingegangenAm), 'd. MMM yyyy', { locale: de })}
                        </p>
                      )}

                      {next && (
                        <Button
                          size="sm"
                          className="w-full mt-3 gap-1.5"
                          onClick={() => handleAdvanceStatus(item.auftragId, item.status)}
                          disabled={updateAbrStatus.isPending}
                        >
                          {updateAbrStatus.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          → {ABRECHNUNG_STATUS_LABELS[next]}
                        </Button>
                      )}

                      {item.status === 'bezahlt' && (
                        <div className="mt-2 text-center text-green-600 text-xs font-medium">
                          ✓ Bezahlt {item.bezahltAm && `am ${format(parseISO(item.bezahltAm), 'd. MMM yyyy', { locale: de })}`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
