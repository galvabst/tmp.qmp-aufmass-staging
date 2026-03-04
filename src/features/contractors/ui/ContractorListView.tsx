import { useState, useMemo } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, GraduationCap, ShoppingBag } from 'lucide-react';
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
import { UserCheck, Clock, UserX, UserMinus, AlertTriangle, Car, LucideIcon } from 'lucide-react';

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

export function ContractorListView() {
  const { data: contractors, isLoading } = useAdminContractorList();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<AdminContractor | null>(null);

  // Pipeline stats
  const pipelineStats: PipelineStat[] = useMemo(() => {
    if (!contractors?.length) return [];
    const total = contractors.length;
    const counts = new Map<OnboardingStatusEnum, number>();
    contractors.forEach(c => counts.set(c.onboardingStatus, (counts.get(c.onboardingStatus) || 0) + 1));

    // Only show statuses that exist
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

  // Filtered
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

  // Detail view
  if (selectedContractor) {
    return <ContractorDetailView contractor={selectedContractor} onBack={() => setSelectedContractor(null)} />;
  }

  return (
    <AdminLayout
      title="Auftragnehmer"
      subtitle="Onboarding"
      count={isLoading ? undefined : filtered.length}
    >
      {isLoading ? (
        <ListSkeleton count={5} showAvatar showBadge />
      ) : (
        <div className="space-y-4">
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

            {/* Substatus + Ort */}
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {c.onboardingSubstatus ? (ONBOARDING_SUBSTATUS_LABELS[c.onboardingSubstatus] ?? c.onboardingSubstatus) : ''}
              {c.ort ? ` · ${c.ort}` : ''}
            </p>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {c.currentStep ? `Schritt: ${STEP_LABELS[c.currentStep] ?? c.currentStep}` : `${c.completedSteps.length}/7 Schritte`}
                </span>
                <span className="text-[10px] font-medium text-foreground">{stepsProgress}%</span>
              </div>
              <Progress value={stepsProgress} className="h-1.5" />
            </div>

            {/* Quick info chips */}
            <div className="flex gap-3 mt-1.5">
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <GraduationCap className="w-3 h-3" /> {c.lektionenCompleted}/{c.lektionenTotal}
              </span>
              {c.bestellungenTotal > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <ShoppingBag className="w-3 h-3" /> {c.bestellungenBezahlt}/{c.bestellungenTotal} bezahlt
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
