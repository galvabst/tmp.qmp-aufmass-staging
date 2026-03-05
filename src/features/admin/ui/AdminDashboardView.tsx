import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from './AdminLayout';
import { useAdminContractorList, STEP_LABELS } from '@/features/contractors/hooks/useAdminContractorList';
import { useAdminDashboardStats } from '@/features/admin/hooks/useAdminDashboardStats';
import { Users, ClipboardList, AlertTriangle, MapPin, Check, X, Shirt, Footprints, CreditCard, MonitorSmartphone, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

const PIPELINE_LABELS: Record<string, string> = {
  wc1_durchfuehren: 'Abgeschlossen',
  termin_abwarten: 'Termin abwarten',
  termin_bestaetigt: 'Bestätigt',
  in_verzug: 'In Verzug',
  vot_abfragen: 'VoT abfragen',
  storniert: 'Storniert',
};

const PIPELINE_COLORS: Record<string, string> = {
  wc1_durchfuehren: 'hsl(var(--primary))',
  termin_bestaetigt: 'hsl(142 71% 45%)',
  termin_abwarten: 'hsl(45 93% 47%)',
  vot_abfragen: 'hsl(200 80% 50%)',
  in_verzug: 'hsl(0 84% 60%)',
  storniert: 'hsl(var(--muted-foreground))',
};

const ONBOARDING_STEPS = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];

// Mandatory item categories
interface MandatoryItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  check: (products: string[]) => boolean;
}

const MANDATORY_ITEMS: MandatoryItem[] = [
  { key: 'oberteil', label: 'Oberteil', icon: <Shirt className="w-3 h-3" />, check: (p) => p.some(k => k === 'tshirt' || k === 'poloshirt') },
  { key: 'schlappen', label: 'Schlappen', icon: <Footprints className="w-3 h-3" />, check: (p) => p.includes('schlappen') },
  { key: 'ausweiskarte', label: 'Ausweis', icon: <CreditCard className="w-3 h-3" />, check: (p) => p.includes('ausweiskarte') },
  { key: 'pullover', label: 'Pullover', icon: <Shirt className="w-3 h-3" />, check: (p) => p.includes('pullover') },
  { key: 'scanner-lizenz', label: 'Scanner', icon: <ScanLine className="w-3 h-3" />, check: (p) => p.includes('scanner-lizenz') },
  { key: 'google-workspace', label: 'Workspace', icon: <MonitorSmartphone className="w-3 h-3" />, check: (p) => p.includes('google-workspace') },
];

const STEP_COLORS: Record<string, string> = {
  profil: 'bg-blue-100 text-blue-800',
  dokumente: 'bg-purple-100 text-purple-800',
  bestellungen: 'bg-amber-100 text-amber-800',
  equipment: 'bg-orange-100 text-orange-800',
  akademie: 'bg-emerald-100 text-emerald-800',
  coaching: 'bg-cyan-100 text-cyan-800',
  nachweise: 'bg-rose-100 text-rose-800',
};

export function AdminDashboardView() {
  const { data: contractors, isLoading: cLoading } = useAdminContractorList();
  const { data: stats, isLoading: sLoading } = useAdminDashboardStats();

  // Active technicians (not ready, not deaktiviert, not trainer)
  const activeTechs = useMemo(() => {
    if (!contractors) return [];
    return contractors.filter(c => !c.isTrainer && c.onboardingStatus !== 'ready' && c.onboardingStatus !== 'deaktiviert');
  }, [contractors]);

  const kpis = useMemo(() => {
    const ready = contractors?.filter(c => c.onboardingStatus === 'ready').length ?? 0;
    const trainers = contractors?.filter(c => c.isTrainer).length ?? 0;
    return { ready, trainers };
  }, [contractors]);

  // Activity trend data (cumulative started & ready per month)
  const trendData = useMemo(() => {
    if (!contractors) return [];
    const monthMap = new Map<string, { started: number; ready: number }>();
    
    contractors.filter(c => !c.isTrainer).forEach(c => {
      if (!c.erstelltAm) return;
      const month = format(startOfMonth(parseISO(c.erstelltAm)), 'yyyy-MM');
      if (!monthMap.has(month)) monthMap.set(month, { started: 0, ready: 0 });
      monthMap.get(month)!.started++;
      if (c.onboardingStatus === 'ready') monthMap.get(month)!.ready++;
    });

    const sorted = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let cumStarted = 0;
    let cumReady = 0;
    return sorted.map(([month, counts]) => {
      cumStarted += counts.started;
      cumReady += counts.ready;
      return {
        month: format(parseISO(`${month}-01`), 'MMM yy', { locale: de }),
        Gestartet: cumStarted,
        Einsatzbereit: cumReady,
      };
    });
  }, [contractors]);

  const isLoading = cLoading || sLoading;

  return (
    <AdminLayout title="Dashboard" subtitle="Betriebsübersicht">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard icon={<ClipboardList className="w-4 h-4" />} label="Aufträge gesamt" value={stats?.gesamtAuftraege ?? '–'} />
        <KpiCard icon={<Users className="w-4 h-4" />} label="Einsatzbereit" value={kpis.ready} />
        <KpiCard icon={<MapPin className="w-4 h-4" />} label="Offene Pool-Termine" value={stats?.offenePool ?? '–'} />
        <KpiCard icon={<AlertTriangle className="w-4 h-4" />} label="In Verzug" value={stats?.inVerzug ?? '–'} accent />
      </div>

      {/* Techniker-Übersicht */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Techniker im Onboarding ({activeTechs.length})</CardTitle>
          <p className="text-xs text-muted-foreground">Aktueller Schritt & Pflichtartikel</p>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Lädt…</div>
          ) : activeTechs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Alle Techniker sind einsatzbereit</div>
          ) : (
            <div className="divide-y divide-border">
              {activeTechs.map(c => {
                const stepIdx = c.currentStep ? ONBOARDING_STEPS.indexOf(c.currentStep) : 0;
                const progress = Math.round(((c.completedSteps.length) / ONBOARDING_STEPS.length) * 100);
                const initials = `${c.vorname?.[0] || ''}${c.nachname?.[0] || ''}`.toUpperCase() || '?';

                return (
                  <div key={c.id} className="px-4 py-3">
                    {/* Row 1: Avatar, Name, Step Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={c.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {c.vorname} {c.nachname}
                        </p>
                      </div>
                      {c.currentStep && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${STEP_COLORS[c.currentStep] || ''}`}>
                          {STEP_LABELS[c.currentStep] ?? c.currentStep}
                        </Badge>
                      )}
                    </div>

                    {/* Row 2: Mandatory items + progress */}
                    <div className="flex items-center gap-1.5 ml-10">
                      {MANDATORY_ITEMS.map(item => {
                        const has = item.check(c.bezahlteProdukte);
                        return (
                          <div
                            key={item.key}
                            title={`${item.label}: ${has ? '✓' : '✗'}`}
                            className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              has ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.icon}
                          </div>
                        );
                      })}
                      <div className="flex-1 ml-2">
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-1 shrink-0">
                        {c.completedSteps.length}/{ONBOARDING_STEPS.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aktivitäts-Trend */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Onboarding-Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Kumulativ gestartete vs. einsatzbereite Techniker</p>
        </CardHeader>
        <CardContent>
          {isLoading || !trendData.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {isLoading ? 'Lädt…' : 'Keine Daten'}
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Gestartet" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Einsatzbereit" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auftrags-Pipeline */}
      <Card className="mb-20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Auftrags-Pipeline</CardTitle>
          <p className="text-xs text-muted-foreground">Verteilung nach Status</p>
        </CardHeader>
        <CardContent>
          {isLoading || !stats?.pipeline?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {isLoading ? 'Lädt…' : 'Keine Daten'}
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.pipeline.map(p => ({ ...p, label: PIPELINE_LABELS[p.status] ?? p.status }))}
                  layout="vertical"
                  margin={{ left: 0, right: 16, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} Aufträge`, '']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {stats.pipeline.map((p, i) => (
                      <Cell key={i} fill={PIPELINE_COLORS[p.status] ?? 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-destructive/30' : ''}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${accent ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${accent ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
