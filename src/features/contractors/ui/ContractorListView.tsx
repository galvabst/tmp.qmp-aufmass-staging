import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, GraduationCap, ShoppingBag, Users, UserCheck, Clock, UserX, AlertTriangle, Car, LucideIcon, MoreVertical, Pause, Ban, RotateCcw, UserCog, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useHasRole } from '@/hooks/useIAM';
import { useImpersonation } from '@/hooks/useImpersonation';
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
  EHEMALIGE_STATUSES,
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
  inaktiv: UserX,
  ausgestiegen: LogOut,
  gefeuert: UserX,
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
};

function getStatusBadgeVariant(status: OnboardingStatusEnum): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ready': return 'default';
    case 'in_progress':
    case 'started':
    case 'mitfahrt': return 'secondary';
    case 'blocked':
    case 'deaktiviert':
    case 'gefeuert': return 'destructive';
    case 'inaktiv':
    case 'ausgestiegen': return 'outline';
    default: return 'outline';
  }
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'heute';
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wo.`;
  if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Mon.`;
  return `vor ${Math.floor(diffDays / 365)} J.`;
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showInaktiv, setShowInaktiv] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<AdminContractor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ id: string; name: string; action: 'inaktiv' | 'ausgestiegen' | 'gefeuert' | 'reaktivieren' } | null>(null);
  const [reasonText, setReasonText] = useState('');

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

  const handleStatusChange = useCallback(async (id: string, newStatus: 'inaktiv' | 'ausgestiegen' | 'gefeuert' | 'in_progress', grund: string | null) => {
    const { data, error } = await (supabase.rpc as any)('set_contractor_austritt', {
      p_onboarding_id: id,
      p_status: newStatus,
      p_grund: grund,
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
    const grund = reasonText.trim() || null;
    handleStatusChange(confirmDialog.id, newStatus as any, grund);
    setConfirmDialog(null);
    setReasonText('');
  }, [confirmDialog, reasonText, handleStatusChange]);

  // KPI values
  const kpis = useMemo(() => {
    if (!contractors?.length) return { total: 0, ready: 0, onboarding: 0, trainers: 0, inaktiv: 0 };
    return {
      total: contractors.filter(c => c.onboardingStatus !== 'inaktiv').length,
      ready: contractors.filter(c => c.onboardingStatus === 'ready').length,
      onboarding: contractors.filter(c => ['started', 'in_progress', 'mitfahrt'].includes(c.onboardingStatus)).length,
      trainers: contractors.filter(c => c.isTrainer).length,
      inaktiv: contractors.filter(c => c.onboardingStatus === 'inaktiv').length,
    };
  }, [contractors]);

  // Pipeline stats
  const pipelineStats: PipelineStat[] = useMemo(() => {
    if (!contractors?.length) return [];
    const activeContractors = contractors.filter(c => c.onboardingStatus !== 'inaktiv');
    const total = activeContractors.length;
    if (total === 0) return [];
    const counts = new Map<OnboardingStatusEnum, number>();
    activeContractors.forEach(c => counts.set(c.onboardingStatus, (counts.get(c.onboardingStatus) || 0) + 1));

    return Array.from(counts.entries())
      .sort(([a], [b]) => {
        const order: OnboardingStatusEnum[] = ['angelegt', 'invited', 'started', 'in_progress', 'mitfahrt', 'ready', 'blocked', 'deaktiviert', 'inaktiv', 'gefeuert'];
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
      // Inaktiv tab logic
      if (showInaktiv) {
        if (c.onboardingStatus !== 'inaktiv') return false;
      } else {
        if (c.onboardingStatus === 'inaktiv') return false;
        if (statusFilter && c.onboardingStatus !== statusFilter) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = `${c.vorname} ${c.nachname}`.toLowerCase();
        return name.includes(q) || c.email.toLowerCase().includes(q) || c.ort.toLowerCase().includes(q);
      }
      return true;
    });
  }, [contractors, statusFilter, searchQuery, showInaktiv]);

  const statusOptions = Object.entries(ONBOARDING_STATUS_LABELS)
    .filter(([k]) => k !== 'inaktiv' && k !== 'gefeuert')
    .map(([value, label]) => ({ value, label }));

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

          {/* Aktiv / Inaktiv toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => { setShowInaktiv(false); setStatusFilter(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !showInaktiv ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Aktiv ({kpis.total})
            </button>
            <button
              onClick={() => { setShowInaktiv(true); setStatusFilter(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                showInaktiv ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Inaktiv ({kpis.inaktiv})
            </button>
          </div>

          {!showInaktiv && <PipelineCards stats={pipelineStats} activeFilter={statusFilter} onFilterChange={setStatusFilter} />}

          <FilterRow
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Name, E-Mail oder Ort..."
            statusOptions={showInaktiv ? [] : statusOptions}
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
                  onAction={(action) => setConfirmDialog({ id: c.id, name: [c.vorname, c.nachname].filter(Boolean).join(' ') || 'Techniker', action })}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.action === 'inaktiv' && '⏸️ Techniker pausieren'}
              {confirmDialog?.action === 'gefeuert' && '🚫 Techniker deaktivieren'}
              {confirmDialog?.action === 'reaktivieren' && '🔄 Techniker reaktivieren'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.action === 'inaktiv' && `${confirmDialog.name} wird als inaktiv markiert. Er/sie bekommt keine neuen Aufträge, kann aber jederzeit reaktiviert werden.`}
              {confirmDialog?.action === 'gefeuert' && `${confirmDialog?.name} wird endgültig deaktiviert und verschwindet aus allen Listen und der Hiring-Map. Diese Aktion kann nur manuell rückgängig gemacht werden.`}
              {confirmDialog?.action === 'reaktivieren' && `${confirmDialog.name} wird reaktiviert und ist wieder für Aufträge verfügbar.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={confirmDialog?.action === 'gefeuert' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmDialog?.action === 'inaktiv' && 'Pausieren'}
              {confirmDialog?.action === 'gefeuert' && 'Endgültig deaktivieren'}
              {confirmDialog?.action === 'reaktivieren' && 'Reaktivieren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

// ── Contractor Card ──

function ContractorCard({ contractor: c, onClick, onAction }: {
  contractor: AdminContractor;
  onClick: () => void;
  onAction: (action: 'inaktiv' | 'gefeuert' | 'reaktivieren') => void;
}) {
  const displayName = [c.vorname, c.nachname].filter(Boolean).join(' ') || 'Kein Profil';
  const initials = `${c.vorname?.[0] ?? ''}${c.nachname?.[0] ?? ''}`.toUpperCase() || '??';
  const stepsProgress = Math.round((c.completedSteps.length / 7) * 100);
  const isInaktiv = c.onboardingStatus === 'inaktiv';
  const isSuperadmin = useHasRole('superadmin');
  const { startImpersonation } = useImpersonation();
  const [impersonating, setImpersonating] = useState(false);

  const handleImpersonate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!c.profileId) {
      toast.error('Kein verknüpftes Profil — Login als dieser Techniker nicht möglich.');
      return;
    }
    const reason = window.prompt(`Als ${displayName} einloggen.\n\nGrund (z. B. Support-Ticket #) — wird im Audit-Log gespeichert:`, '');
    if (reason === null) return; // Abbruch
    setImpersonating(true);
    try {
      await startImpersonation({ targetUserId: c.profileId, targetLabel: displayName, reason: reason || undefined });
    } catch (err) {
      console.error(err);
      toast.error('Login fehlgeschlagen: ' + (err as Error).message);
      setImpersonating(false);
    }
  };

  return (
    <Card className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${isInaktiv ? 'opacity-60' : ''}`} onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={c.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className={`font-medium text-sm truncate ${isInaktiv ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{displayName}</p>
                {c.isTrainer && <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={getStatusBadgeVariant(c.onboardingStatus)} className="text-[10px]">
                  {ONBOARDING_STATUS_LABELS[c.onboardingStatus]}
                </Badge>
                {isSuperadmin && (
                  <button
                    onClick={handleImpersonate}
                    disabled={impersonating}
                    title="Als dieser Techniker einloggen"
                    className="p-1 rounded hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <UserCog className="w-3.5 h-3.5 text-destructive" />
                  </button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    {isInaktiv ? (
                      <DropdownMenuItem onClick={() => onAction('reaktivieren')}>
                        <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reaktivieren
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onAction('inaktiv')}>
                        <Pause className="w-3.5 h-3.5 mr-2" /> Pausieren
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onAction('gefeuert')} className="text-destructive focus:text-destructive">
                      <Ban className="w-3.5 h-3.5 mr-2" /> Endgültig deaktivieren
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              {c.currentStep && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium border-primary/30 text-primary">
                  {STEP_LABELS[c.currentStep] ?? c.currentStep}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground truncate">
                {c.erstelltAm && <span>Seit {formatRelativeDate(c.erstelltAm)}</span>}
                {c.ort ? ` · ${c.ort}` : ''}
              </span>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {c.completedSteps.length}/7 Schritte
                </span>
                <span className="text-[10px] font-medium text-foreground">{stepsProgress}%</span>
              </div>
              <Progress value={stepsProgress} className="h-1.5" />
            </div>

            <div className="flex gap-3 mt-1.5">
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <GraduationCap className="w-3 h-3" /> {c.lektionenCompleted}/{c.lektionenTotal} Lektionen
              </span>
              {c.pflichtProdukteTotal > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <ShoppingBag className="w-3 h-3" /> {c.pflichtProdukteBezahlt}/{c.pflichtProdukteTotal} Produkte
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
