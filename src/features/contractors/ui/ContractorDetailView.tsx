import { ArrowLeft, User, FileText, ShoppingBag, Wrench, GraduationCap, Car, ShieldCheck, Check, X, ExternalLink, Calendar, Mail, Phone, MapPin, Award, Activity, UserCog, Star, Settings2 } from 'lucide-react';
import { AdminCoachingAssignment } from './AdminCoachingAssignment';
import { AdminStepOverride } from './AdminStepOverride';
import { AdminPraxistestActions } from './AdminPraxistestActions';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AdminContractor,
  BestellungDetail,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_SUBSTATUS_LABELS,
  STEP_LABELS,
  OnboardingStatusEnum,
  OnboardingSubstatusEnum,
} from '../hooks/useAdminContractorList';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useContractorActivityStats } from '../hooks/useContractorActivityStats';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { useHasRole, useIsAdmin } from '@/hooks/useIAM';
import { useImpersonation } from '@/hooks/useImpersonation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  contractor: AdminContractor;
  onBack: () => void;
}

const ALL_STEPS = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];

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

function fmtDate(d: string | null | undefined) {
  if (!d) return '–';
  try { return format(parseISO(d), 'd. MMM yyyy', { locale: de }); } catch { return '–'; }
}

export function ContractorDetailView({ contractor: c, onBack }: Props) {
  const completedCount = c.completedSteps.length;
  const progressPercent = Math.round((completedCount / ALL_STEPS.length) * 100);
  const initials = `${c.vorname?.[0] ?? ''}${c.nachname?.[0] ?? ''}`.toUpperCase() || '??';
  const displayName = [c.vorname, c.nachname].filter(Boolean).join(' ') || 'Kein Profil';

  const { data: activityStats } = useContractorActivityStats(c.id);
  const hasActivity = activityStats && activityStats.some(p => p.checks > 0 || p.einweisungen > 0 || p.avgRating !== null);
  const isSuperadmin = useHasRole('superadmin');
  const isAdmin = useIsAdmin();
  const { startImpersonation } = useImpersonation();
  const [impersonating, setImpersonating] = useState(false);

  const handleImpersonate = async () => {
    if (!c.profileId) {
      toast.error('Kein verknüpftes Profil — Login als dieser Techniker nicht möglich.');
      return;
    }
    const reason = window.prompt(`Als ${displayName} einloggen.\n\nGrund (z. B. Support-Ticket #) — wird im Audit-Log gespeichert:`, '');
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground flex-1 truncate">{displayName}</h1>
          {isAdmin && (
            <TrainerToggleButton
              onboardingId={c.id}
              contractorName={displayName}
              initial={c.isTrainer}
            />
          )}
          {isSuperadmin && (
            <button
              onClick={handleImpersonate}
              disabled={impersonating}
              title="Als dieser Techniker einloggen"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors disabled:opacity-50"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Einloggen als</span>
            </button>
          )}
          <Badge variant={getStatusBadgeVariant(c.onboardingStatus)}>
            {ONBOARDING_STATUS_LABELS[c.onboardingStatus] ?? c.onboardingStatus}
          </Badge>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* ── Profile Card ── */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={c.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground">{displayName}</h2>
                {c.isTrainer && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Award className="w-3 h-3 mr-0.5" /> Trainer
                  </Badge>
                )}
              </div>
              {c.onboardingSubstatus && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ONBOARDING_SUBSTATUS_LABELS[c.onboardingSubstatus] ?? c.onboardingSubstatus}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                {c.telefon && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefon}</span>}
                {c.ort && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.ort}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Seit {fmtDate(c.erstelltAm)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 7-Step Progress ── */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Onboarding-Fortschritt</p>
            <span className="text-xs font-medium text-muted-foreground">{completedCount}/{ALL_STEPS.length}</span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-3" />
          <div className="flex justify-between">
            {ALL_STEPS.map((step, idx) => {
              const isDone = c.completedSteps.includes(step);
              const isCurrent = c.currentStep === step;
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span className={`text-[9px] mt-1 text-center leading-tight ${isDone ? 'text-green-600 dark:text-green-400 font-medium' : isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {STEP_LABELS[step] ?? step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Step-Verweildauer (Audit-Log) ── */}
        <ContractorStepTimeline onboardingId={c.id} erstelltAm={c.erstelltAm} />

        {/* ── Innendienst + Bestellungen nebeneinander ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Linke Spalte: Innendienst */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            {(() => {
              const tasks = [
                { label: 'Vertrag', done: c.vertragGeprueft },
                { label: 'Kleidung', done: c.kleidungBestellt },
                { label: 'Lizenzen', done: c.lizenzenBereitgestellt },
              ];
              const doneCount = tasks.filter(t => t.done).length;
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-foreground">Innendienst</p>
                    <span className={`text-[10px] font-bold ${doneCount === 3 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {doneCount}/3
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {tasks.map(t => (
                      <div key={t.label} className="flex items-center gap-1.5 text-xs">
                        {t.done ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span className={t.done ? 'text-foreground' : 'text-muted-foreground'}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Rechte Spalte: Pflichtprodukte */}
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-foreground">Pflichtprodukte</p>
              <span className={`text-[10px] font-bold ${c.pflichtProdukteBezahlt >= c.pflichtProdukteTotal && c.pflichtProdukteTotal > 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {c.pflichtProdukteBezahlt}/{c.pflichtProdukteTotal}
              </span>
            </div>
            {c.bestellungen.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">Keine</p>
            ) : (
              <div className="space-y-1.5">
                {c.bestellungen.filter(b => b.status === 'paid').map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    <span className="truncate text-foreground">
                      {b.produktKey.replace(/[-_]/g, ' ')}{b.groesse ? ` (${b.groesse})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* ── Quick Stats Row ── */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Lektionen" value={`${c.lektionenCompleted}/${c.lektionenTotal}`} sub={c.lektionenInProgress > 0 ? `${c.lektionenInProgress} in Arbeit` : undefined} />
          <StatCard label="Pflichtprodukte" value={`${c.pflichtProdukteBezahlt}/${c.pflichtProdukteTotal}`} sub={c.pflichtProdukteTotal === 0 ? 'Keine' : c.pflichtProdukteBezahlt >= c.pflichtProdukteTotal ? 'Alle bezahlt' : 'Offen'} />
          <StatCard label="Coaching" value={c.coachingBewertung === 'bestanden' ? '✓' : c.coachingBewertung === 'nicht_bestanden' ? '✗' : '–'} sub={c.coachingBewertung === 'ausstehend' ? 'Ausstehend' : c.coachingBewertung === 'bestanden' ? 'Bestanden' : 'Nicht bestanden'} />
        </div>

        {/* ── Activity Chart (Combined) ── */}
        {hasActivity && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Aktivität (letzte 6 Monate)</p>
            </div>
            {/* Chart 1: Aufträge */}
            <div className="flex items-center gap-3 mb-1">
              <p className="text-[11px] font-medium text-muted-foreground">Aufträge</p>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'hsl(var(--primary))' }} />TC
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'hsl(280 60% 55%)' }} />EW
              </span>
            </div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityStats} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number, name: string) => [value, name === 'checks' ? 'Thermochecks' : 'Einweisungen']}
                  />
                  <Line type="monotone" dataKey="checks" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                  <Line type="monotone" dataKey="einweisungen" stroke="hsl(280 60% 55%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(280 60% 55%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 2: Ø Bewertung */}
            <p className="text-[11px] font-medium text-muted-foreground mb-1 mt-3">Ø Bewertung</p>
            <div className="h-[100px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityStats} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    formatter={(value: number | null) => [value !== null ? Number(value).toFixed(1) : '–', 'Ø Bewertung']}
                  />
                  <Line type="monotone" dataKey="avgRating" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4, fill: 'hsl(142, 71%, 45%)' }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Umsatz row */}
            {activityStats!.some(d => d.umsatz > 0) && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium">Umsatz</span>
                  <span className="font-bold text-foreground">
                    Σ {activityStats!.reduce((s, d) => s + d.umsatz, 0).toFixed(0)} €
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1 text-center">
                  {activityStats!.map((d, i) => (
                    <div key={i}>
                      <p className="text-[10px] text-muted-foreground">{d.month}</p>
                      <p className="text-xs font-semibold text-foreground">{d.umsatz > 0 ? `${d.umsatz.toFixed(0)}€` : '–'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Admin-Orchestrierung ── */}
        {isAdmin && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Admin-Orchestrierung</p>
            </div>
            <AdminStepOverride
              profileId={c.profileId}
              currentStep={c.currentStep}
              contractorName={displayName}
            />
            <AdminCoachingAssignment
              traineeProfileId={c.profileId}
              traineeName={displayName}
            />
            <AdminPraxistestActions
              onboardingId={c.id}
              contractorName={displayName}
              praxistestEingereicht={c.praxistestEingereicht}
              praxistestFreigabe={c.praxistestFreigabe}
              scanFreigegeben={c.scanFreigegeben}
              videoFreigegeben={c.videoFreigegeben}
            />
          </div>
        )}

        {/* ── Detail Accordions ── */}
        <Accordion type="multiple" className="space-y-2">
          {/* Dokumente */}
          <AccordionItem value="dokumente" className="bg-card rounded-xl border-0 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /> Dokumente</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 text-sm">
                <Row label="Gewerbeschein">
                  {c.gewerbescheinUrl ? (
                    <a href={c.gewerbescheinUrl} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-xs">
                      Anzeigen <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : c.gewerbescheinSpaeter ? (
                    <span className="text-amber-600 text-xs">Später nachreichen</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Nicht vorhanden</span>
                  )}
                </Row>
              </div>
            </AccordionContent>
          </AccordionItem>



          {/* Equipment */}
          <AccordionItem value="equipment" className="bg-card rounded-xl border-0 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><Wrench className="w-4 h-4 text-muted-foreground" /> Equipment</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {Object.keys(c.equipmentStatus).length === 0 ? (
                <p className="text-xs text-muted-foreground">Noch keine Angaben</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(c.equipmentStatus).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="text-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        {val?.hatEigenes ? (
                          <Badge variant="secondary" className="text-[10px]">Eigenes</Badge>
                        ) : null}
                        {val?.nachweisUrl ? (
                          <a href={val.nachweisUrl} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-0.5">
                            Foto <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Kein Nachweis</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Akademie */}
          <AccordionItem value="akademie" className="bg-card rounded-xl border-0 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-muted-foreground" /> Akademie</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Lektionen</span>
                  <span className="text-xs font-medium text-foreground">{c.lektionenCompleted}/{c.lektionenTotal}</span>
                </div>
                <Progress value={Math.round((c.lektionenCompleted / c.lektionenTotal) * 100)} className="h-1.5" />
              </div>
              <div className="text-xs space-y-1">
                <Row label="In Bearbeitung">{c.lektionenInProgress}</Row>
                <Row label="Quiz-Versuche">{c.quizVersuche}</Row>
                <Row label="Best Score">{c.quizBestScore}%</Row>
                <Row label="Quiz bestanden">
                  {c.quizBestanden ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-muted-foreground" />}
                </Row>
                <Row label="Abschlusstest">
                  {(c.akademieTestBestanden || c.completedSteps.includes('akademie')) ? (
                    <Badge variant="default" className="text-[10px]">Bestanden</Badge>
                  ) : (
                    <span className="text-muted-foreground">Nicht bestanden</span>
                  )}
                </Row>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Coaching */}
          <AccordionItem value="coaching" className="bg-card rounded-xl border-0 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><Car className="w-4 h-4 text-muted-foreground" /> Coaching / Mitfahrt</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="text-xs space-y-1">
                <Row label="Bewertung">
                  <Badge variant={c.coachingBewertung === 'bestanden' ? 'default' : c.coachingBewertung === 'nicht_bestanden' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {c.coachingBewertung === 'bestanden' ? 'Bestanden' : c.coachingBewertung === 'nicht_bestanden' ? 'Nicht bestanden' : 'Ausstehend'}
                  </Badge>
                </Row>
                <Row label="Termin">{c.coachingTermin ? fmtDate(c.coachingTermin) : 'Nicht gebucht'}</Row>
                <Row label="Coach">{c.coachName ?? '–'}</Row>
                <Row label="Mitfahrt-Termin">{c.mitfahrtTermin ? fmtDate(c.mitfahrtTermin) : '–'}</Row>
                <Row label="Mitfahrt bezahlt">{c.mitfahrtBezahltAm ? fmtDate(c.mitfahrtBezahltAm) : '–'}</Row>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Intern-Flags */}
          <AccordionItem value="intern" className="bg-card rounded-xl border-0 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-muted-foreground" /> Interne Checks</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <FlagRow label="Vertrag geprüft" checked={c.vertragGeprueft} />
                <FlagRow label="Kleidung bestellt" checked={c.kleidungBestellt} />
                <FlagRow label="Lizenzen bereitgestellt" checked={c.lizenzenBereitgestellt} />
                <EinweisungFreigabeToggle contractorId={c.id} initial={c.einweisungFreigabe} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

// ── Helper components ──

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card rounded-xl p-3 shadow-sm text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{children}</span>
    </div>
  );
}

function FlagRow({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} disabled className="pointer-events-none" />
      <span className={`text-xs ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

function EinweisungFreigabeToggle({ contractorId, initial }: { contractorId: string; initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('update_contractor_einweisung_freigabe', {
        p_contractor_id: contractorId,
        p_freigabe: checked,
      } as any);
      if (error) throw error;
      setValue(checked);
      queryClient.invalidateQueries({ queryKey: ['admin-contractor-list'] });
      toast.success(checked ? 'Einweisungs-Freigabe erteilt' : 'Einweisungs-Freigabe entzogen');
    } catch (err: any) {
      console.error('[EinweisungFreigabe]', err);
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${value ? 'text-foreground' : 'text-muted-foreground'}`}>Einweisung freigegeben</span>
      <Switch checked={value} onCheckedChange={handleToggle} disabled={loading} />
    </div>
  );
}

function TrainerToggleButton({
  onboardingId,
  contractorName,
  initial,
}: {
  onboardingId: string;
  contractorName: string;
  initial: boolean;
}) {
  const [isTrainer, setIsTrainer] = useState(initial);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const next = !isTrainer;
      const { error } = await (supabaseTC
        .from('contractor_onboarding' as any)
        .update({ is_trainer: next } as any)
        .eq('id', onboardingId) as any);
      if (error) throw error;
      setIsTrainer(next);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-contractor-list'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-hiring-map-contractors'] }),
        queryClient.invalidateQueries({ queryKey: ['is-trainer'] }),
      ]);
      toast.success(next ? `${contractorName} ist jetzt Trainer` : 'Trainer-Status entfernt');
      setConfirmOpen(false);
    } catch (err: any) {
      console.error('[TrainerToggle]', err);
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        title={isTrainer ? 'Trainer-Status entfernen' : 'Zum Trainer befördern'}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
          isTrainer
            ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400'
            : 'bg-muted hover:bg-muted/70 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${isTrainer ? 'fill-current' : ''}`} />
        <span className="hidden sm:inline">{isTrainer ? 'Trainer' : 'Befördern'}</span>
      </button>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!loading) setConfirmOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isTrainer ? 'Trainer-Status entfernen?' : 'Zum Trainer befördern?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isTrainer
                ? `${contractorName} verliert den Trainer-Status. Bestehende Mitfahrten/Coaching-Slots bleiben erhalten, neue können nicht mehr angeboten werden.`
                : `${contractorName} wird als Trainer markiert. Trainer können Coachings & Mitfahrten anbieten, sehen den Trainer-Bereich, überspringen die Akademie-Pflicht und sind im Forum als „Trainer" gekennzeichnet.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleConfirm(); }}
              disabled={loading}
            >
              {loading ? 'Bitte warten…' : isTrainer ? 'Entfernen' : 'Befördern'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
