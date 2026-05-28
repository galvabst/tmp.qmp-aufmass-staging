import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import {
  Users, UserCheck, Clock, UserX, AlertTriangle, Car, LucideIcon, LogOut, Award,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ListSkeleton } from '@/components/ListSkeleton';
import { PipelineCards, PipelineStat } from '@/components/PipelineCards';
import { FilterRow } from '@/components/FilterRow';
import { ContractorDetailView } from './ContractorDetailView';
import { ContractorCard } from './ContractorCard';
import {
  useAdminContractorList, AdminContractor, OnboardingStatusEnum,
  ONBOARDING_STATUS_LABELS, EHEMALIGE_STATUSES,
} from '../hooks/useAdminContractorList';

// ── Konstanten ──────────────────────────────────────────────────────────────

const STATUS_ICON_MAP: Record<OnboardingStatusEnum, LucideIcon> = {
  angelegt: Clock, invited: Clock, started: Clock, in_progress: Clock,
  blocked: AlertTriangle, ready: UserCheck, deaktiviert: UserX, mitfahrt: Car,
  inaktiv: UserX, ausgestiegen: LogOut, gefeuert: UserX, onboarding_abgebrochen: UserX,
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
  inaktiv: 'bg-gray-50 dark:bg-gray-900/30',
  ausgestiegen: 'bg-gray-50 dark:bg-gray-900/30',
  gefeuert: 'bg-red-50 dark:bg-red-950/30',
  onboarding_abgebrochen: 'bg-gray-50 dark:bg-gray-900/30',
};

// Onboarding-Statuses (alles vor 'ready', ohne 'inaktiv'/'ehemalige')
const ONBOARDING_STATUSES: OnboardingStatusEnum[] = [
  'angelegt', 'invited', 'started', 'in_progress', 'mitfahrt', 'blocked',
];

type ViewMode = 'onboarding' | 'aktiv' | 'ehemalige';
const VIEW_MODE_STORAGE_KEY = 'admin.contractorList.viewMode';

const VIEW_MODE_LABEL: Record<ViewMode, string> = {
  onboarding: 'Im Onboarding',
  aktiv: 'Aktive',
  ehemalige: 'Ehemalige',
};

const VIEW_MODE_SUBTITLE: Record<ViewMode, string> = {
  onboarding: 'Im Onboarding',
  aktiv: 'Aktive Thermotrackler (inkl. pausiert)',
  ehemalige: 'Ehemalige & nie gestartet',
};

function isOnboardingStatus(s: OnboardingStatusEnum): boolean {
  return ONBOARDING_STATUSES.includes(s);
}

function loadViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'aktiv';
  const v = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (v === 'onboarding' || v === 'aktiv' || v === 'ehemalige') return v;
  return 'aktiv';
}


// ── KPI Card ────────────────────────────────────────────────────────────────

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

// ── Main View ───────────────────────────────────────────────────────────────

interface ContractorListViewProps {
  initialSelectedId?: string | null;
  onClearSelection?: () => void;
}

export function ContractorListView({ initialSelectedId, onClearSelection }: ContractorListViewProps = {}) {
  const { data: contractors, isLoading } = useAdminContractorList();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadViewMode());
  const [selectedContractor, setSelectedContractor] = useState<AdminContractor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; name: string; action: 'inaktiv' | 'ausgestiegen' | 'gefeuert' | 'reaktivieren' } | null>(null);
  const [reasonText, setReasonText] = useState('');

  // View-Mode persistieren
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }
  }, [viewMode]);

  // Auto-Select via deep-link
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

  const handleStatusChange = useCallback(async (id: string, newStatus: 'inaktiv' | 'ausgestiegen' | 'gefeuert' | 'in_progress', grund: string | null) => {
    const { data, error } = await (supabase.rpc as any)('set_contractor_austritt', {
      p_onboarding_id: id, p_status: newStatus, p_grund: grund,
    });
    if (error) {
      console.error('[set_contractor_austritt]', error);
      toast.error(`Status konnte nicht geändert werden: ${error.message}`);
      return;
    }
    const released = (data?.unassigned_thermochecks ?? 0) + (data?.unassigned_einweisungen ?? 0);
    const msg =
      newStatus === 'inaktiv' ? 'Techniker pausiert' :
      newStatus === 'ausgestiegen' ? 'Techniker als ausgestiegen markiert' :
      newStatus === 'gefeuert' ? 'Techniker endgültig deaktiviert' :
      'Techniker reaktiviert';
    toast.success(released > 0 ? `${msg} · ${released} Aufträge zurück in Pool` : msg);
    queryClient.invalidateQueries({ queryKey: ['admin-contractor-list'] });
    queryClient.invalidateQueries({ queryKey: ['admin-hiring-map-contractors'] });
  }, [queryClient]);

  const confirmAction = useCallback(() => {
    if (!confirmDialog) return;
    const newStatus = confirmDialog.action === 'reaktivieren' ? 'in_progress' : confirmDialog.action;
    handleStatusChange(confirmDialog.id, newStatus as any, reasonText.trim() || null);
    setConfirmDialog(null);
    setReasonText('');
  // KPIs (immer Gesamtbild, unabhängig vom Modus)
  const kpis = useMemo(() => {
    if (!contractors?.length) return { total: 0, ready: 0, onboarding: 0, trainers: 0, ehemalige: 0 };
    const isEhemalig = (s: OnboardingStatusEnum) => EHEMALIGE_STATUSES.includes(s);
    return {
      total: contractors.filter(c => !isEhemalig(c.onboardingStatus)).length,
      ready: contractors.filter(c => c.onboardingStatus === 'ready').length,
      onboarding: contractors.filter(c => isOnboardingStatus(c.onboardingStatus) && !c.isTrainer).length,
      trainers: contractors.filter(c => c.isTrainer).length,
      ehemalige: contractors.filter(c => isEhemalig(c.onboardingStatus)).length,
    };
  }, [contractors]);

  // Counts pro Tab
  const tabCounts = useMemo<Record<ViewMode, number>>(() => {
    if (!contractors?.length) return { onboarding: 0, aktiv: 0, ehemalige: 0 };
    let onboarding = 0, aktiv = 0, ehemalige = 0;
    for (const c of contractors) {
      const ehemalig = EHEMALIGE_STATUSES.includes(c.onboardingStatus);
      if (ehemalig) {
        ehemalige++;
      } else if (c.onboardingStatus === 'ready' || c.isTrainer || c.onboardingStatus === 'inaktiv') {
        aktiv++;
      } else if (isOnboardingStatus(c.onboardingStatus)) {
        onboarding++;
      }
    }
    return { onboarding, aktiv, ehemalige };
  }, [contractors]);

  // Pipeline-Stats nur sinnvoll für Onboarding-Tab
  const pipelineStats: PipelineStat[] = useMemo(() => {
    if (!contractors?.length || viewMode !== 'onboarding') return [];
    const source = contractors.filter(c => !c.isTrainer && isOnboardingStatus(c.onboardingStatus));
    const total = source.length;
    if (total === 0) return [];
    const counts = new Map<OnboardingStatusEnum, number>();
    source.forEach(c => counts.set(c.onboardingStatus, (counts.get(c.onboardingStatus) || 0) + 1));
    const order: OnboardingStatusEnum[] = ['angelegt', 'invited', 'started', 'in_progress', 'mitfahrt', 'blocked'];
    return Array.from(counts.entries())
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([status, count]) => ({
        key: status,
        label: ONBOARDING_STATUS_LABELS[status] ?? status,
        count,
        percent: Math.round((count / total) * 100),
        icon: STATUS_ICON_MAP[status] ?? Clock,
        bgColor: STATUS_BG_MAP[status] ?? 'bg-muted',
      }));
  }, [contractors, viewMode]);

  const hasSearch = searchQuery.trim().length > 0;

  // Stelle sicher, dass ein veralteter statusFilter beim Modus-Wechsel weichen muss
  useEffect(() => {
    if (!statusFilter) return;
    if (viewMode === 'onboarding' && !ONBOARDING_STATUSES.includes(statusFilter as OnboardingStatusEnum)) setStatusFilter(null);
    if (viewMode === 'ehemalige' && !EHEMALIGE_STATUSES.includes(statusFilter as OnboardingStatusEnum)) setStatusFilter(null);
    if (viewMode === 'aktiv') setStatusFilter(null);
  }, [viewMode, statusFilter]);

  const filtered = useMemo(() => {
    if (!contractors) return [];
    return contractors.filter(c => {
      const ehemalig = EHEMALIGE_STATUSES.includes(c.onboardingStatus);

      if (viewMode === 'ehemalige') {
        if (!ehemalig) return false;
        if (statusFilter && c.onboardingStatus !== statusFilter) return false;
      } else if (viewMode === 'onboarding') {
        if (ehemalig || c.onboardingStatus === 'inaktiv') return false;
        if (c.isTrainer) return false;
        if (!isOnboardingStatus(c.onboardingStatus)) return false;
        if (statusFilter && c.onboardingStatus !== statusFilter) return false;
      } else {
        // aktiv: ready, trainer, oder pausiert (inaktiv)
        if (ehemalig) return false;
        if (!(c.onboardingStatus === 'ready' || c.isTrainer || c.onboardingStatus === 'inaktiv')) return false;
      }

      if (hasSearch) {
        const q = searchQuery.toLowerCase();
        const name = `${c.vorname} ${c.nachname}`.toLowerCase();
        return name.includes(q) || c.email.toLowerCase().includes(q) || c.ort.toLowerCase().includes(q);
      }
      return true;
    });
  }, [contractors, viewMode, statusFilter, searchQuery, hasSearch]);

  // Status-Chips: nur Stati mit echten Treffern im aktuellen Tab, mit Counts
  const statusOptions = useMemo(() => {
    if (!contractors?.length) return [];
    if (viewMode === 'aktiv') return [];

    const inMode = contractors.filter(c => {
      const ehemalig = EHEMALIGE_STATUSES.includes(c.onboardingStatus);
      if (viewMode === 'onboarding') {
        return !ehemalig && c.onboardingStatus !== 'inaktiv' && !c.isTrainer && isOnboardingStatus(c.onboardingStatus);
      }
      // ehemalige
      return ehemalig;
    });

    const counts = new Map<OnboardingStatusEnum, number>();
    inMode.forEach(c => counts.set(c.onboardingStatus, (counts.get(c.onboardingStatus) || 0) + 1));

    const candidates = viewMode === 'onboarding'
      ? (ONBOARDING_STATUSES.map(s => [s, ONBOARDING_STATUS_LABELS[s]] as const))
      : (EHEMALIGE_STATUSES.map(s => [s, ONBOARDING_STATUS_LABELS[s]] as const));

    return candidates
      .map(([value, label]) => ({ value, label, count: counts.get(value as OnboardingStatusEnum) ?? 0 }))
      .filter(o => o.count > 0)
      .map(o => ({ value: o.value, label: `${o.label} (${o.count})` }));
  }, [contractors, viewMode]);

  if (selectedContractor) {
    return <ContractorDetailView contractor={selectedContractor} onBack={() => { setSelectedContractor(null); onClearSelection?.(); }} />;
  }

  const tabOrder: ViewMode[] = ['onboarding', 'aktiv', 'ehemalige'];


  return (
    <AdminLayout title="Auftragnehmer" subtitle={VIEW_MODE_SUBTITLE[viewMode]} count={isLoading ? undefined : filtered.length}>
      {isLoading ? (
        <ListSkeleton count={5} showAvatar showBadge />
      ) : (
        <div className="space-y-4">
          {/* KPI-Dashboard */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <KpiCard label="Gesamt" value={kpis.total} icon={Users} />
            <KpiCard label="Einsatzbereit" value={kpis.ready} icon={UserCheck} accent="bg-emerald-50 dark:bg-emerald-950/30" />
            <KpiCard label="Onboarding" value={kpis.onboarding} icon={Clock} accent="bg-amber-50 dark:bg-amber-950/30" />
            <KpiCard label="Trainer" value={kpis.trainers} icon={Award} accent="bg-indigo-50 dark:bg-indigo-950/30" />
          </div>

          {/* Segmented Control: Onboarding · Aktive · Alle · Inaktiv */}
          <div className="inline-flex rounded-full bg-muted/60 p-0.5 gap-0.5 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            {tabOrder.map(mode => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); }}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={active}
                >
                  {VIEW_MODE_LABEL[mode]} <span className={active ? 'text-muted-foreground' : 'text-muted-foreground/70'}>({tabCounts[mode]})</span>
                </button>
              );
            })}
          </div>

          {viewMode === 'onboarding' && (
            <PipelineCards stats={pipelineStats} activeFilter={statusFilter} onFilterChange={setStatusFilter} />
          )}

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
              filtered.map(c => (
                <ContractorCard
                  key={c.id}
                  contractor={c}
                  onClick={() => setSelectedContractor(c)}
                  onAction={(action) => { setReasonText(''); setConfirmDialog({ id: c.id, name: [c.vorname, c.nachname].filter(Boolean).join(' ') || 'Techniker', action }); }}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => { if (!open) { setConfirmDialog(null); setReasonText(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'inaktiv' && '⏸️ Techniker pausieren'}
              {confirmDialog?.action === 'ausgestiegen' && '🚪 Techniker als ausgestiegen markieren'}
              {confirmDialog?.action === 'gefeuert' && '🚫 Techniker endgültig deaktivieren'}
              {confirmDialog?.action === 'reaktivieren' && '🔄 Techniker reaktivieren'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'inaktiv' && `${confirmDialog.name} wird als inaktiv markiert. Er/sie bekommt keine neuen Aufträge, kann aber jederzeit reaktiviert werden.`}
              {confirmDialog?.action === 'ausgestiegen' && `${confirmDialog?.name} wird als freiwillig ausgeschieden markiert. Aktive Aufträge werden zurück in den Pool gegeben. Der Techniker bleibt nur über die Namenssuche auffindbar.`}
              {confirmDialog?.action === 'gefeuert' && `${confirmDialog?.name} wird endgültig deaktiviert. Aktive Aufträge werden zurück in den Pool gegeben. Der Techniker bleibt nur über die Namenssuche auffindbar.`}
              {confirmDialog?.action === 'reaktivieren' && `${confirmDialog.name} wird reaktiviert und ist wieder für Aufträge verfügbar.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmDialog && confirmDialog.action !== 'reaktivieren' && (
            <div className="space-y-2 py-1">
              <Label htmlFor="austritts-grund" className="text-xs">Grund / Notiz (optional)</Label>
              <Textarea
                id="austritts-grund"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="z. B. Hat sich gemeldet, möchte nicht weitermachen…"
                rows={3}
                className="text-sm"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={confirmDialog?.action === 'gefeuert' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmDialog?.action === 'inaktiv' && 'Pausieren'}
              {confirmDialog?.action === 'ausgestiegen' && 'Als ausgestiegen markieren'}
              {confirmDialog?.action === 'gefeuert' && 'Endgültig deaktivieren'}
              {confirmDialog?.action === 'reaktivieren' && 'Reaktivieren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
