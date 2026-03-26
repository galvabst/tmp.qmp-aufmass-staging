import { useState, useMemo, useEffect, useRef } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, GraduationCap, ShoppingBag, Users, UserCheck, Clock, UserX, AlertTriangle, Car, LucideIcon } from 'lucide-react';
import { ListSkeleton } from '@/components/ListSkeleton';
import { PipelineCards, PipelineStat } from '@/components/PipelineCards';
import { FilterRow } from '@/components/FilterRow';
import { ContractorDetailView } from './ContractorDetailView';
import {
  useAdminContractorList,
  AdminContractor,
  OnboardingStatusEnum,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_SUBSTATUS_LABELS,
  STEP_LABELS,
} from '../hooks/useAdminContractorList';

// Status config for pipeline cards
const STATUS_ICON_MAP: Record<OnboardingStatusEnum, LucideIcon> = {
  angelegt: Clock,
  invited: Clock,
  started: Clock,
  in_progress: Clock,
  blocked: AlertTriangle,
  ready: UserCheck,
  deaktiviert: UserX,
  mitfahrt: Car,
};

const STATUS_BG_MAP: Record<OnboardingStatusEnum, string> = {
  angelegt: 'bg-slate-50 dark:bg-slate-900/30',
  invited: 'bg-blue-50 dark:bg-blue-950/30',
  started: 'bg-amber-50 dark:bg-amber-950/30',
  in_progress: 'bg-amber-50 dark:bg-amber-950/30',
  blocked: 'bg-red-50 dark:bg-red-950/30',
  ready: 'bg-emerald-50 dark:bg-emerald-950/30',
  deaktiviert: 'bg-gray-50 dark:bg-gray-900/30',
  mitfahrt: 'bg-indigo-50 dark:bg-indigo-950/30',
};

function getStatusBadgeVariant(status: OnboardingStatusEnum): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ready': return 'default';
    case 'in_progress':
    case 'started':
    case 'mitfahrt': return 'secondary';
    case 'blocked':
    case 'deaktiviert': return 'destructive';
    default: return 'outline';
  }
}

// ── KPI Dashboard ──
function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: LucideIcon; accent?: string }) {
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

interface ContractorListViewProps {
  initialSelectedId?: string | null;
  onClearSelection?: () => void;
}

export function ContractorListView({ initialSelectedId, onClearSelection }: ContractorListViewProps = {}) {
  const { data: contractors, isLoading } = useAdminContractorList();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<AdminContractor | null>(null);

  // Auto-select contractor when initialSelectedId is provided
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (initialSelectedId && contractors?.length && !autoSelectedRef.current) {
      const found = contractors.find(c => c.id === initialSelectedId);
      if (found) {
        setSelectedContractor(found);
        autoSelectedRef.current = true;
      }
    }
  }, [initialSelectedId, contractors]);

  // KPI values
  const kpis = useMemo(() => {
    if (!contractors?.length) return { total: 0, ready: 0, onboarding: 0, trainers: 0 };
    return {
      total: contractors.length,
      ready: contractors.filter(c => c.onboardingStatus === 'ready').length,
      onboarding: contractors.filter(c => ['started', 'in_progress', 'mitfahrt'].includes(c.onboardingStatus)).length,
      trainers: contractors.filter(c => c.isTrainer).length,
    };
  }, [contractors]);

  // Pipeline stats
  const pipelineStats: PipelineStat[] = useMemo(() => {
    if (!contractors?.length) return [];
    const total = contractors.length;
    const counts = new Map<OnboardingStatusEnum, number>();
    contractors.forEach(c => counts.set(c.onboardingStatus, (counts.get(c.onboardingStatus) || 0) + 1));

    return Array.from(counts.entries())
      .sort(([a], [b]) => {
        const order: OnboardingStatusEnum[] = ['angelegt', 'invited', 'started', 'in_progress', 'mitfahrt', 'ready', 'blocked', 'deaktiviert'];
        return order.indexOf(a) - order.indexOf(b);
      })
      .map(([status, count]) => ({
        key: status,
        label: ONBOARDING_STATUS_LABELS[status] ?? status,
        count,
        percent: Math.round((count / total) * 100),
        icon: STATUS_ICON_MAP[status] ?? Clock,
        bgColor: STATUS_BG_MAP[status] ?? 'bg-muted',
      }));
  }, [contractors]);

  const filtered = useMemo(() => {
    if (!contractors) return [];
    return contractors.filter(c => {
      if (statusFilter && c.onboardingStatus !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${c.vorname} ${c.nachname}`.toLowerCase();
        return name.includes(q) || c.email.toLowerCase().includes(q) || c.ort.toLowerCase().includes(q);
      }
      return true;
    });
  }, [contractors, statusFilter, searchQuery]);

  const statusOptions = Object.entries(ONBOARDING_STATUS_LABELS).map(([value, label]) => ({ value, label }));

  if (selectedContractor) {
    return <ContractorDetailView contractor={selectedContractor} onBack={() => { setSelectedContractor(null); onClearSelection?.(); }} />;
  }

  return (
    <AdminLayout title="Auftragnehmer" subtitle="Onboarding" count={isLoading ? undefined : filtered.length}>
      {isLoading ? (
        <ListSkeleton count={5} showAvatar showBadge />
      ) : (
        <div className="space-y-4">
          {/* KPI Dashboard */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <KpiCard label="Gesamt" value={kpis.total} icon={Users} />
            <KpiCard label="Einsatzbereit" value={kpis.ready} icon={UserCheck} accent="bg-emerald-50 dark:bg-emerald-950/30" />
            <KpiCard label="Onboarding" value={kpis.onboarding} icon={Clock} accent="bg-amber-50 dark:bg-amber-950/30" />
            <KpiCard label="Trainer" value={kpis.trainers} icon={Award} accent="bg-indigo-50 dark:bg-indigo-950/30" />
          </div>

          <PipelineCards stats={pipelineStats} activeFilter={statusFilter} onFilterChange={setStatusFilter} />

          <FilterRow
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Name, E-Mail oder Ort..."
            statusOptions={statusOptions}
            statusValue={statusFilter || undefined}
            onStatusChange={(v) => setStatusFilter(v || null)}
            statusPlaceholder="Status"
            onReset={() => { setSearchQuery(''); setStatusFilter(null); }}
          />

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Keine Techniker gefunden</div>
            ) : (
              filtered.map(c => <ContractorCard key={c.id} contractor={c} onClick={() => setSelectedContractor(c)} />)
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// ── Contractor Card ──

function ContractorCard({ contractor: c, onClick }: { contractor: AdminContractor; onClick: () => void }) {
  const displayName = [c.vorname, c.nachname].filter(Boolean).join(' ') || 'Kein Profil';
  const initials = `${c.vorname?.[0] ?? ''}${c.nachname?.[0] ?? ''}`.toUpperCase() || '??';
  const stepsProgress = Math.round((c.completedSteps.length / 7) * 100);

  return (
    <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={c.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{displayName}</p>
                {c.isTrainer && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <Badge variant={getStatusBadgeVariant(c.onboardingStatus)} className="text-[10px] shrink-0">
                {ONBOARDING_STATUS_LABELS[c.onboardingStatus]}
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {c.onboardingSubstatus ? (ONBOARDING_SUBSTATUS_LABELS[c.onboardingSubstatus] ?? c.onboardingSubstatus) : ''}
              {c.ort ? ` · ${c.ort}` : ''}
            </p>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {c.currentStep ? `Schritt: ${STEP_LABELS[c.currentStep] ?? c.currentStep}` : `${c.completedSteps.length}/7 Schritte`}
                </span>
                <span className="text-[10px] font-medium text-foreground">{stepsProgress}%</span>
              </div>
              <Progress value={stepsProgress} className="h-1.5" />
            </div>

            <div className="flex gap-3 mt-1.5">
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <GraduationCap className="w-3 h-3" /> {c.lektionenCompleted}/{c.lektionenTotal}
              </span>
              {c.pflichtProdukteTotal > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <ShoppingBag className="w-3 h-3" /> {c.pflichtProdukteBezahlt}/{c.pflichtProdukteTotal} Pflichtprodukte
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
