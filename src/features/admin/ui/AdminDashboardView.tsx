import { useMemo, useState } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from './AdminLayout';
import { useAdminContractorList, AdminContractor, STEP_LABELS } from '@/features/contractors/hooks/useAdminContractorList';
import { useAdminDashboardStats } from '@/features/admin/hooks/useAdminDashboardStats';
import { useAdminAggregatedStats } from '@/features/admin/hooks/useAdminAggregatedStats';
import { Users, ClipboardList, AlertTriangle, MapPin, Check, X, Shirt, Footprints, CreditCard, MonitorSmartphone, ScanLine, GraduationCap, Car, FileCheck, UserX, Star, TrendingUp, Clock, Activity } from 'lucide-react';
import { AdminHiringMap } from './AdminHiringMap';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO, differenceInDays, startOfQuarter, differenceInWeeks } from 'date-fns';
import { de } from 'date-fns/locale';

// ── Funnel config ──
const FUNNEL_STAGES = [
  { label: 'Registriert', filter: () => true },
  { label: 'Stammdaten', filter: (c: AdminContractor) => c.completedSteps.includes('profil') },
  { label: 'Bestellungen', filter: (c: AdminContractor) => c.completedSteps.includes('bestellungen') },
  { label: 'Akademie', filter: (c: AdminContractor) => c.completedSteps.includes('akademie') || (c.currentStep === 'akademie' && c.lektionenCompleted > 0) },
  { label: 'Prüfung bestanden', filter: (c: AdminContractor) => c.akademieTestBestanden },
  { label: 'Coaching', filter: (c: AdminContractor) => c.completedSteps.includes('coaching') || !!c.coachingTermin },
  { label: 'Einsatzbereit', filter: (c: AdminContractor) => c.onboardingStatus === 'ready' },
];
const FUNNEL_COLORS = [
  'hsl(var(--muted-foreground))',
  'hsl(200 80% 50%)',
  'hsl(45 93% 47%)',
  'hsl(280 60% 55%)',
  'hsl(var(--primary))',
  'hsl(142 71% 45%)',
  'hsl(142 71% 35%)',
];

// ── Pipeline config ──
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

// ── Mandatory items for Bestellungen tab ──
const MANDATORY_ITEMS = [
  { key: 'oberteil', label: 'Polo/T-Shirt', check: (p: string[]) => p.some(k => k === 'tshirt' || k === 'poloshirt') },
  { key: 'schlappen', label: 'Schlappen', check: (p: string[]) => p.includes('schlappen') },
  { key: 'ausweiskarte', label: 'Ausweis', check: (p: string[]) => p.includes('ausweiskarte') },
  { key: 'pullover', label: 'Pullover', check: (p: string[]) => p.includes('pullover') },
  { key: 'scanner-lizenz', label: 'Scanner-Lizenz', check: (p: string[]) => p.includes('scanner-lizenz') },
  { key: 'google-workspace', label: 'Google Workspace', check: (p: string[]) => p.includes('google-workspace') },
];

// ── Onboarding steps index ──
const ONBOARDING_STEPS = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];

function getOnboardingTrafficLight(c: AdminContractor): 'green' | 'orange' | 'red' {
  if (!c.erstelltAm) return 'green';
  const daysLeft = 7 - differenceInDays(new Date(), parseISO(c.erstelltAm));
  const stepIdx = ONBOARDING_STEPS.indexOf(c.currentStep ?? '');
  if (daysLeft <= 0) return 'red';
  if (stepIdx >= 4) return 'green'; // Akademie or further
  if (daysLeft <= 2) return 'red';
  if (daysLeft <= 4 && stepIdx < 3) return 'orange';
  return 'green';
}

function getOnboardingDaysLabel(c: AdminContractor): string {
  if (!c.erstelltAm) return '';
  const daysLeft = 7 - differenceInDays(new Date(), parseISO(c.erstelltAm));
  if (daysLeft < 0) return `Überfällig (+${Math.abs(daysLeft)} T)`;
  if (daysLeft === 0) return 'Heute fällig';
  return `${daysLeft} Tag${daysLeft !== 1 ? 'e' : ''} verbl.`;
}

const TRAFFIC_COLORS = {
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  red: 'bg-destructive',
};

function getQuotaTrafficLight(quartalTCs: number): 'green' | 'orange' | 'red' {
  const now = new Date();
  const qStart = startOfQuarter(now);
  const weeksPassed = Math.max(1, differenceInWeeks(now, qStart));
  const expected = (weeksPassed / 13) * 24;
  if (quartalTCs >= expected * 0.8) return 'green';
  if (quartalTCs >= expected * 0.5) return 'orange';
  return 'red';
}

// ── Filter tab definitions ──
type TabKey = 'alle' | 'nicht_registriert' | 'stammdaten' | 'bestellungen' | 'akademie' | 'pruefung' | 'praxistest' | 'coaching';

interface TabDef {
  key: TabKey;
  label: string;
  filter: (c: AdminContractor) => boolean;
}

const TAB_DEFS: TabDef[] = [
  { key: 'alle', label: 'Alle', filter: () => true },
  { key: 'nicht_registriert', label: 'Nicht registriert', filter: c => c.onboardingStatus === 'invited' || c.onboardingStatus === 'angelegt' || !c.currentStep },
  { key: 'stammdaten', label: 'Stammdaten', filter: c => c.currentStep === 'profil' || c.currentStep === 'dokumente' },
  { key: 'bestellungen', label: 'Bestellungen', filter: c => c.currentStep === 'bestellungen' || c.currentStep === 'equipment' },
  { key: 'akademie', label: 'Akademie', filter: c => c.currentStep === 'akademie' && !c.akademieTestBestanden },
  { key: 'pruefung', label: 'Abschlussprüfung', filter: c => c.akademieTestBestanden || (c.lektionenCompleted >= c.lektionenTotal && !c.akademieTestBestanden) },
  { key: 'praxistest', label: 'Praxistest', filter: c => c.praxistestEingereicht && !c.praxistestFreigabe },
  { key: 'coaching', label: 'Coaching', filter: c => c.currentStep === 'coaching' || c.currentStep === 'nachweise' },
];

// ── Detail renderers per tab ──
function DetailForTab({ tab, c }: { tab: TabKey; c: AdminContractor }) {
  switch (tab) {
    case 'nicht_registriert':
      return (
        <span className="text-xs text-muted-foreground">
          Angelegt: {c.erstelltAm ? format(parseISO(c.erstelltAm), 'dd.MM.yyyy', { locale: de }) : '–'}
        </span>
      );

    case 'stammdaten': {
      const missing: string[] = [];
      if (!c.vorname || !c.nachname) missing.push('Name');
      if (!c.ort) missing.push('Adresse');
      if (!c.gewerbescheinUrl && !c.gewerbescheinSpaeter) missing.push('Gewerbeschein');
      return (
        <div className="flex flex-wrap gap-1">
          {missing.length === 0 ? (
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">Vollständig</Badge>
          ) : (
            missing.map(m => (
              <Badge key={m} variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                <X className="w-2.5 h-2.5 mr-0.5" />{m}
              </Badge>
            ))
          )}
        </div>
      );
    }

    case 'bestellungen':
      return (
        <div className="flex flex-wrap gap-1">
          {MANDATORY_ITEMS.map(item => {
            const has = item.check(c.bezahlteProdukte);
            return (
              <Badge
                key={item.key}
                variant="outline"
                className={`text-[10px] ${has ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}`}
              >
                {has ? <Check className="w-2.5 h-2.5 mr-0.5" /> : <X className="w-2.5 h-2.5 mr-0.5" />}
                {item.label}
              </Badge>
            );
          })}
        </div>
      );

    case 'akademie':
      return (
        <span className="text-xs text-muted-foreground">
          <GraduationCap className="w-3 h-3 inline mr-1" />
          {c.lektionenCompleted}/{c.lektionenTotal} Lektionen
        </span>
      );

    case 'pruefung':
      return c.akademieTestBestanden ? (
        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
          <Check className="w-2.5 h-2.5 mr-0.5" />Bestanden
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          {c.quizVersuche} Versuch{c.quizVersuche !== 1 ? 'e' : ''} · Bester: {c.quizBestScore}%
        </span>
      );

    case 'praxistest':
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
          Wartet auf Freigabe
        </Badge>
      );

    case 'coaching':
      return (
        <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
          {c.coachingTermin ? (
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              <Car className="w-2.5 h-2.5 mr-0.5" />
              {format(parseISO(c.coachingTermin), 'dd.MM.yyyy', { locale: de })}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Kein Termin</Badge>
          )}
          {c.coachName && <span>Coach: {c.coachName}</span>}
        </div>
      );

    default: // 'alle'
      return c.currentStep ? (
        <Badge variant="outline" className="text-[10px]">
          {STEP_LABELS[c.currentStep] ?? c.currentStep}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">Kein Schritt</span>
      );
  }
}

// ── Main component ──
interface AdminDashboardViewProps {
  onSelectContractor?: (contractorId: string) => void;
}

export function AdminDashboardView({ onSelectContractor }: AdminDashboardViewProps) {
  const { data: contractors, isLoading: cLoading } = useAdminContractorList();
  const { data: stats, isLoading: sLoading } = useAdminDashboardStats();
  const { data: perfStats, isLoading: pLoading } = useAdminAggregatedStats();
  const [activeTab, setActiveTab] = useState<TabKey>('alle');
  const [verzugOpen, setVerzugOpen] = useState(false);

  // Active technicians (not ready, not deaktiviert, not trainer)
  const activeTechs = useMemo(() => {
    if (!contractors) return [];
    return contractors.filter(c => !c.isTrainer && c.onboardingStatus !== 'ready' && c.onboardingStatus !== 'deaktiviert');
  }, [contractors]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {} as any;
    TAB_DEFS.forEach(t => { counts[t.key] = activeTechs.filter(t.filter).length; });
    return counts;
  }, [activeTechs]);

  // Filtered list
  const filteredTechs = useMemo(() => {
    const tabDef = TAB_DEFS.find(t => t.key === activeTab);
    return tabDef ? activeTechs.filter(tabDef.filter) : activeTechs;
  }, [activeTechs, activeTab]);

  // Ready technicians (active, non-trainer)
  const readyTechs = useMemo(() => {
    if (!contractors || !stats) return [];
    const auslastungMap = new Map(stats.auslastung.map(a => [a.onboardingId, a]));
    return contractors
      .filter(c => c.onboardingStatus === 'ready' && !c.isTrainer)
      .map(c => ({
        ...c,
        quartalTCs: auslastungMap.get(c.id)?.quartalTCs ?? 0,
      }))
      .sort((a, b) => b.quartalTCs - a.quartalTCs);
  }, [contractors, stats]);

  const { inVerzugList, ready, trainers } = useMemo(() => {
    const ready = contractors?.filter(c => c.onboardingStatus === 'ready').length ?? 0;
    const trainers = contractors?.filter(c => c.isTrainer).length ?? 0;
    const now = new Date();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const inVerzugList = contractors?.filter(c => {
      if (c.isTrainer || c.onboardingStatus === 'ready' || c.onboardingStatus === 'deaktiviert') return false;
      if (!c.erstelltAm) return false;
      const deadlineExceeded = now.getTime() - new Date(c.erstelltAm).getTime() > sevenDaysMs;
      const akademieNotDone = !c.completedSteps.includes('akademie');
      return deadlineExceeded && akademieNotDone;
    }) ?? [];
    return { inVerzugList, ready, trainers };
  }, [contractors]);

  // Funnel data (all contractors including trainers)
  const allContractors = useMemo(() => contractors ?? [], [contractors]);
  const funnelData = useMemo(() => {
    if (!allContractors.length) return [];
    return FUNNEL_STAGES.map(stage => ({
      stage: stage.label,
      count: allContractors.filter(stage.filter).length,
    }));
  }, [allContractors]);

  const isLoading = cLoading || sLoading || pLoading;

  return (
    <AdminLayout title="Dashboard" subtitle="Betriebsübersicht">
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <KpiCard icon={<ClipboardList className="w-4 h-4" />} label="Aufträge gesamt" value={stats?.gesamtAuftraege ?? '–'} />
        <KpiCard icon={<Users className="w-4 h-4" />} label="Einsatzbereit" value={ready} />
        <KpiCard icon={<MapPin className="w-4 h-4" />} label="Offene Pool-Termine" value={stats?.offenePool ?? '–'} />
        <KpiCard icon={<AlertTriangle className="w-4 h-4" />} label="In Verzug" value={inVerzugList.length} accent onClick={() => setVerzugOpen(true)} />
      </div>

      {/* In Verzug Dialog */}
      <Dialog open={verzugOpen} onOpenChange={setVerzugOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              In Verzug ({inVerzugList.length})
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-border overflow-y-auto flex-1 -mx-6 px-6">
            {inVerzugList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Keine Techniker in Verzug</p>
            ) : (
              inVerzugList.map(c => {
                const initials = `${c.vorname?.[0] || ''}${c.nachname?.[0] || ''}`.toUpperCase() || '?';
                const displayName = [c.vorname, c.nachname].filter(Boolean).join(' ') || c.email || 'Kein Profil';
                const daysOverdue = c.erstelltAm ? differenceInDays(new Date(), parseISO(c.erstelltAm)) - 7 : 0;

                return (
                  <div
                    key={c.id}
                    className="py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-md px-1 -mx-1"
                    onClick={() => { setVerzugOpen(false); onSelectContractor?.(c.id); }}
                  >
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={c.avatarUrl || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">
                          +{daysOverdue} Tag{daysOverdue !== 1 ? 'e' : ''} über Deadline
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          <GraduationCap className="w-3 h-3 inline mr-0.5" />
                          {c.lektionenCompleted}/{c.lektionenTotal} Lektionen
                        </span>
                        {c.currentStep && (
                          <Badge variant="outline" className="text-[10px]">
                            {STEP_LABELS[c.currentStep] ?? c.currentStep}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hiring-Map */}
      <AdminHiringMap />

      {/* Performance-Übersicht */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold">Performance (letzte 6 Monate)</CardTitle>
            <div className="flex items-center gap-2">
              {perfStats?.overallOnTimePercent !== null && perfStats?.overallOnTimePercent !== undefined && (
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  perfStats.overallOnTimePercent >= 90 ? 'bg-emerald-50 dark:bg-emerald-950/30' : perfStats.overallOnTimePercent >= 75 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-destructive/10'
                }`}>
                  <Clock className={`w-3.5 h-3.5 ${
                    perfStats.overallOnTimePercent >= 90 ? 'text-emerald-500' : perfStats.overallOnTimePercent >= 75 ? 'text-amber-500' : 'text-destructive'
                  }`} />
                  <span className="text-xs font-bold text-foreground">{perfStats.overallOnTimePercent}%</span>
                </div>
              )}
              {perfStats?.overallAvgRating !== null && perfStats?.overallAvgRating !== undefined && (
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                  perfStats.overallAvgRating >= 4.5 ? 'bg-emerald-50 dark:bg-emerald-950/30' : perfStats.overallAvgRating >= 4.0 ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-destructive/10'
                }`}>
                  <Star className={`w-3.5 h-3.5 fill-current ${
                    perfStats.overallAvgRating >= 4.5 ? 'text-emerald-500' : perfStats.overallAvgRating >= 4.0 ? 'text-amber-500' : 'text-destructive'
                  }`} />
                  <span className="text-xs font-bold text-foreground">{perfStats.overallAvgRating}</span>
                  <span className="text-[10px] text-muted-foreground">({perfStats.overallRatingCount})</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {perfStats ? `${perfStats.totalChecksLast6} Thermochecks · ${perfStats.totalEinweisungenLast6} Einweisungen · ${perfStats.totalLateCount} Verspätungen · ${perfStats.overallLateFees.toFixed(0)} € Gebühren` : ''}
            {perfStats?.overallAvgVorOrtMin != null && (
              <span className="block mt-0.5">⌀ {perfStats.overallAvgVorOrtMin} Min Vor-Ort · ⌀ {perfStats.overallAvgNachbearbeitungMin ?? '–'} Min Nachb. · ⌀ {perfStats.overallAvgGesamtMin ?? '–'} Min Gesamt</span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {pLoading || !perfStats?.monthly?.length ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">{pLoading ? 'Lädt…' : 'Keine Daten'}</div>
          ) : (
            <div className="space-y-4">
              {/* Aufträge volume */}
              <div>
                <div className="flex items-center gap-4 mb-1">
                  <p className="text-[10px] text-muted-foreground font-medium">Aufträge / Monat</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(var(--primary))' }} />Thermochecks
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'hsl(280 60% 55%)' }} />Einweisungen
                    </span>
                  </div>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perfStats.monthly} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(v: number, name: string) => [v, name === 'checks' ? 'Thermochecks' : 'Einweisungen']}
                      />
                      <Line type="monotone" dataKey="checks" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                      <Line type="monotone" dataKey="einweisungen" stroke="hsl(280 60% 55%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(280 60% 55%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Average rating trend – color-coded dots */}
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Ø Bewertung / Monat</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perfStats.monthly.map(p => ({ ...p, avgRating: p.avgRating ?? undefined }))} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`${v} ★`, '']} contentStyle={{ fontSize: 12 }} />
                      <ReferenceLine y={4.5} stroke="hsl(142 71% 45%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <ReferenceLine y={4.0} stroke="hsl(0 84% 60%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Line
                        type="monotone"
                        dataKey="avgRating"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={2}
                        connectNulls
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          if (payload.avgRating == null) return <circle key={`dot-${cx}`} r={0} />;
                          const color = payload.avgRating >= 4.5
                            ? 'hsl(142 71% 45%)'
                            : payload.avgRating >= 4.0
                              ? 'hsl(45 93% 47%)'
                              : 'hsl(0 84% 60%)';
                          return <circle key={`dot-${cx}`} cx={cx} cy={cy} r={4} fill={color} stroke={color} strokeWidth={1} />;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Pünktlichkeit / Monat */}
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Pünktlichkeit / Monat</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perfStats.monthly.map(p => ({ ...p, onTimePercent: p.onTimePercent ?? 0 }))} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Pünktlich']} contentStyle={{ fontSize: 12 }} />
                      <ReferenceLine y={90} stroke="hsl(142 71% 45%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Bar dataKey="onTimePercent" radius={[4, 4, 0, 0]} maxBarSize={28}>
                        {perfStats.monthly.map((p, i) => (
                          <Cell
                            key={i}
                            fill={
                              (p.onTimePercent ?? 0) >= 90
                                ? 'hsl(142 71% 45%)'
                                : (p.onTimePercent ?? 0) >= 75
                                  ? 'hsl(45 93% 47%)'
                                  : 'hsl(0 84% 60%)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Durchlaufzeiten */}
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Ø Vor-Ort-Dauer / Monat</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perfStats.monthly} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit=" Min" />
                      <Tooltip formatter={(v: number) => [`${v} Min`, 'Vor-Ort']} contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="avgVorOrtMin" stroke="hsl(25 95% 53%)" strokeWidth={2} connectNulls dot={{ r: 3, fill: 'hsl(25 95% 53%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Ø Nachbearbeitung / Monat</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perfStats.monthly} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit=" Min" />
                      <Tooltip formatter={(v: number) => [`${v} Min`, 'Nachbearbeitung']} contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="avgNachbearbeitungMin" stroke="hsl(200 80% 50%)" strokeWidth={2} connectNulls dot={{ r: 3, fill: 'hsl(200 80% 50%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Ø Gesamtdurchlauf / Monat</p>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={perfStats.monthly} margin={{ left: -20, right: 8, top: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit=" Min" />
                      <Tooltip formatter={(v: number) => [`${v} Min`, 'Gesamt']} contentStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="avgGesamtMin" stroke="hsl(var(--primary))" strokeWidth={2} connectNulls dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Techniker im Onboarding ({activeTechs.length})</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {/* Horizontal scrollable tabs */}
          <ScrollArea className="w-full px-4 pb-3">
            <div className="flex gap-1.5">
              {TAB_DEFS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${
                    activeTab === tab.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
                  }`}>
                    {tabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Filtered list */}
          {isLoading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Lädt…</div>
          ) : filteredTechs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Keine Techniker in dieser Kategorie</div>
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {filteredTechs.map(c => {
                const initials = `${c.vorname?.[0] || ''}${c.nachname?.[0] || ''}`.toUpperCase() || '?';
                const displayName = [c.vorname, c.nachname].filter(Boolean).join(' ') || c.email || 'Kein Profil';
                const tl = getOnboardingTrafficLight(c);
                const daysLabel = getOnboardingDaysLabel(c);

                return (
                  <div
                    key={c.id}
                    className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onSelectContractor?.(c.id)}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={c.avatarUrl || undefined} />
                        <AvatarFallback className="text-[10px] bg-muted">{initials}</AvatarFallback>
                      </Avatar>
                      <span className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${TRAFFIC_COLORS[tl]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                        {daysLabel && (
                          <span className={`text-[10px] font-medium shrink-0 ${tl === 'red' ? 'text-destructive' : tl === 'orange' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {daysLabel}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <DetailForTab tab={activeTab} c={c} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding-Funnel */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Onboarding-Funnel</CardTitle>
          <p className="text-xs text-muted-foreground">Kumulativ: Wie viele Techniker haben mindestens diese Stufe erreicht?</p>
        </CardHeader>
        <CardContent>
          {isLoading || !funnelData.length ? (
            <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">{isLoading ? 'Lädt…' : 'Keine Daten'}</div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="stage" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${value} Techniker`, '']} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={FUNNEL_COLORS[i] ?? 'hsl(var(--muted-foreground))'} />
                    ))}
                  </Bar>
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
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">{isLoading ? 'Lädt…' : 'Keine Daten'}</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pipeline.map(p => ({ ...p, label: PIPELINE_LABELS[p.status] ?? p.status }))} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${value} Aufträge`, '']} contentStyle={{ fontSize: 12 }} />
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

function KpiCard({ icon, label, value, accent, onClick }: { icon: React.ReactNode; label: string; value: number | string; accent?: boolean; onClick?: () => void }) {
  return (
    <Card className={`${accent ? 'border-destructive/30' : ''} ${onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`} onClick={onClick}>
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
