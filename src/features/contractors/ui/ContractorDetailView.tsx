import { ArrowLeft, User, FileText, ShoppingBag, Wrench, GraduationCap, Car, ShieldCheck, Check, X, ExternalLink, Calendar, Mail, Phone, MapPin, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-semibold text-foreground flex-1 truncate">{displayName}</h1>
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

        {/* ── Quick Stats Row ── */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Lektionen" value={`${c.lektionenCompleted}/${c.lektionenTotal}`} sub={c.lektionenInProgress > 0 ? `${c.lektionenInProgress} in Arbeit` : undefined} />
          <StatCard label="Bestellungen" value={`${c.bestellungenBezahlt}/${c.bestellungenTotal}`} sub={c.bestellungenTotal === 0 ? 'Keine' : c.bestellungenBezahlt === c.bestellungenTotal ? 'Alle bezahlt' : 'Offen'} />
          <StatCard label="Coaching" value={c.coachingBewertung === 'bestanden' ? '✓' : c.coachingBewertung === 'nicht_bestanden' ? '✗' : '–'} sub={c.coachingBewertung === 'ausstehend' ? 'Ausstehend' : c.coachingBewertung === 'bestanden' ? 'Bestanden' : 'Nicht bestanden'} />
        </div>

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

          {/* Bestellungen */}
          <AccordionItem value="bestellungen" className="bg-card rounded-xl border-0 shadow-sm overflow-hidden">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
              <span className="flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-muted-foreground" /> Bestellungen ({c.bestellungenTotal})</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {c.bestellungen.length === 0 ? (
                <p className="text-xs text-muted-foreground">Keine Bestellungen vorhanden</p>
              ) : (
                <div className="space-y-1.5">
                  {c.bestellungen.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-foreground capitalize">{b.produktKey.replace(/[-_]/g, ' ')}{b.groesse ? ` (${b.groesse})` : ''}</span>
                      <Badge variant={b.status === 'paid' ? 'default' : b.status === 'failed' ? 'destructive' : 'outline'} className="text-[10px]">
                        {b.status === 'paid' ? '✓ Bezahlt' : b.status === 'failed' ? 'Fehlgeschlagen' : 'Offen'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
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
