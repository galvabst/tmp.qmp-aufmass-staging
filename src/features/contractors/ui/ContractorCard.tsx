import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Award, GraduationCap, ShoppingBag, MoreVertical, Pause, Ban, RotateCcw, UserCog, LogOut,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useHasRole } from '@/hooks/useIAM';
import { useImpersonation } from '@/hooks/useImpersonation';
import {
  AdminContractor, OnboardingStatusEnum, ONBOARDING_STATUS_LABELS, STEP_LABELS, EHEMALIGE_STATUSES,
} from '../hooks/useAdminContractorList';

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
    case 'ausgestiegen':
    case 'onboarding_abgebrochen': return 'outline';
    default: return 'outline';
  }
}


function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'heute';
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wo.`;
  if (diffDays < 365) return `vor ${Math.floor(diffDays / 30)} Mon.`;
  return `vor ${Math.floor(diffDays / 365)} J.`;
}

export interface ContractorCardProps {
  contractor: AdminContractor;
  onClick: () => void;
  onAction: (action: 'inaktiv' | 'ausgestiegen' | 'gefeuert' | 'reaktivieren') => void;
}

export function ContractorCard({ contractor: c, onClick, onAction }: ContractorCardProps) {
  const displayName = [c.vorname, c.nachname].filter(Boolean).join(' ') || 'Kein Profil';
  const isInaktiv = c.onboardingStatus === 'inaktiv';
  const isEhemalig = EHEMALIGE_STATUSES.includes(c.onboardingStatus);
  const isAbgebrochen = c.onboardingStatus === 'onboarding_abgebrochen';
  const isSynthetic = c.id.startsWith('potential:');
  const isDimmed = isInaktiv || isEhemalig;

  const isEhemalig = EHEMALIGE_STATUSES.includes(c.onboardingStatus);
  const isDimmed = isInaktiv || isEhemalig;
  const isSuperadmin = useHasRole('superadmin');
  const { startImpersonation } = useImpersonation();
  const [impersonating, setImpersonating] = useState(false);

  const handleImpersonate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!c.profileId) {
      toast.error('Kein verknüpftes Profil — Login als dieser Techniker nicht möglich.');
      return;
    }
    const reason = window.prompt(
      `Als ${displayName} einloggen.\n\nGrund (z. B. Support-Ticket #) — wird im Audit-Log gespeichert:`, '',
    );
    if (reason === null) return;
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
    <Card className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${isDimmed ? 'opacity-60' : ''}`} onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={c.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className={`font-medium text-sm truncate ${isDimmed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{displayName}</p>
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
                    {(isInaktiv || isEhemalig) ? (
                      <DropdownMenuItem onClick={() => onAction('reaktivieren')}>
                        <RotateCcw className="w-3.5 h-3.5 mr-2" /> Reaktivieren
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onAction('inaktiv')}>
                          <Pause className="w-3.5 h-3.5 mr-2" /> Pausieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction('ausgestiegen')}>
                          <LogOut className="w-3.5 h-3.5 mr-2" /> Ausgestiegen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAction('gefeuert')} className="text-destructive focus:text-destructive">
                          <Ban className="w-3.5 h-3.5 mr-2" /> Endgültig deaktivieren
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {isEhemalig && c.austrittsDatum && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {ONBOARDING_STATUS_LABELS[c.onboardingStatus]} seit {new Date(c.austrittsDatum).toLocaleDateString('de-DE')}
                {c.austrittsGrund ? ` · ${c.austrittsGrund}` : ''}
              </p>
            )}

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
                <span className="text-[10px] text-muted-foreground">{c.completedSteps.length}/7 Schritte</span>
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

            {c.coachingBewertung === 'bestanden' && c.onboardingStatus !== 'ready' && !c.isTrainer && (() => {
              const gaps: string[] = [];
              if (c.completedSteps.length < 7) {
                const stepLabel = c.currentStep ? (STEP_LABELS[c.currentStep] ?? c.currentStep) : `${c.completedSteps.length}/7`;
                gaps.push(`Step: ${stepLabel}`);
              }
              if (!c.vertragGeprueft) gaps.push('Vertrag');
              if (!c.kleidungBestellt) gaps.push('Kleidung');
              if (!c.lizenzenBereitgestellt) gaps.push('Lizenzen');
              if (gaps.length === 0) return null;
              return (
                <p className="text-[10px] text-amber-600 mt-1 truncate" title={gaps.join(' · ')}>
                  Fehlt für Einsatzbereit: {gaps.join(' · ')}
                </p>
              );
            })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
