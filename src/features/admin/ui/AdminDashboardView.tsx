import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from './AdminLayout';
import { useAdminContractorList, STEP_LABELS } from '@/features/contractors/hooks/useAdminContractorList';
import { useAdminDashboardStats } from '@/features/admin/hooks/useAdminDashboardStats';
import { Users, ClipboardList, AlertTriangle, MapPin } from 'lucide-react';

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

export function AdminDashboardView() {
  const { data: contractors, isLoading: cLoading } = useAdminContractorList();
  const { data: stats, isLoading: sLoading } = useAdminDashboardStats();

  // Onboarding funnel data
  const funnelData = useMemo(() => {
    if (!contractors) return [];
    // Only non-ready, non-deaktiviert contractors
    const active = contractors.filter(c => !c.isTrainer && c.onboardingStatus !== 'ready' && c.onboardingStatus !== 'deaktiviert');
    return ONBOARDING_STEPS.map(step => {
      const count = active.filter(c => c.currentStep === step).length;
      return { step, label: STEP_LABELS[step] ?? step, count };
    });
  }, [contractors]);

  const kpis = useMemo(() => {
    const ready = contractors?.filter(c => c.onboardingStatus === 'ready').length ?? 0;
    const trainers = contractors?.filter(c => c.isTrainer).length ?? 0;
    return { ready, trainers };
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

      {/* Onboarding Funnel */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Onboarding-Fortschritt</CardTitle>
          <p className="text-xs text-muted-foreground">Techniker pro Onboarding-Schritt (ohne Trainer & Einsatzbereite)</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Lädt…</div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} Techniker`, '']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i / ONBOARDING_STEPS.length) * 0.6})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Techniker-Auslastung */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Techniker-Auslastung</CardTitle>
          <p className="text-xs text-muted-foreground">Zugewiesene Aufträge pro Techniker</p>
        </CardHeader>
        <CardContent>
          {isLoading || !stats?.auslastung?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              {isLoading ? 'Lädt…' : 'Keine Daten'}
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.auslastung} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value} Aufträge`, '']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="auftraege" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
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
