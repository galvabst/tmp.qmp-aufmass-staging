import { ArrowLeft, MapPin, Clock, Phone, Mail, FileText, Euro, Navigation, Calendar, ClipboardList, CheckCircle2, AlertCircle, Loader2, Copy, Check, Ruler, Home, Thermometer, Receipt, Search, Banknote } from 'lucide-react';
import { AuftragChatSection } from '@/features/chat/ui/AuftragChatSection';
import { useAbrechnungStatus, useMarkRechnungGestellt, AbrechnungStatusEnum } from '@/hooks/useAbrechnungStatus';
import { TechnicianOrder, CheckinPhase, CHECKIN_PHASE_LABELS } from '@/types/technician';
import { AUFTRAGSTYP_LABELS, OBJECT_ORDER_STATUS_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface TechnicianOrderDetailProps {
  order: TechnicianOrder;
  onBack: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onStartCheckin?: (phase: CheckinPhase) => void;
  onCheckout?: (phase: CheckinPhase) => void;
  onStartRework?: () => void;
  showFullDetails?: boolean;
  technicianName?: string;
}

/** Small helper – copy text and show a toast */
function useCopyAction() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopiert`);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };
  return { copiedKey, copy };
}

/** Compact copy block */
function CopyBlock({ label, text, copyKey, copiedKey, onCopy }: {
  label: string;
  text: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, label: string, key: string) => void;
}) {
  const isCopied = copiedKey === copyKey;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <div className="relative bg-muted/60 rounded-lg p-2.5 pr-10">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{text}</p>
        <button
          onClick={() => onCopy(text, label, copyKey)}
          className="absolute top-2 right-2 p-1 rounded-md hover:bg-accent transition-colors"
          title="Kopieren"
        >
          {isCopied
            ? <Check className="w-3.5 h-3.5 text-green-600" />
            : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

/** Billing progress stepper for approved orders */
function AbrechnungStepper({ status, approvedAt, rechnungEingegangenAm, geprueftAm, bezahltAm, betrag, auftragId }: {
  status: AbrechnungStatusEnum;
  approvedAt?: string;
  rechnungEingegangenAm: string | null;
  geprueftAm: string | null;
  bezahltAm: string | null;
  betrag: number | null;
  auftragId?: string;
}) {
  const markMutation = useMarkRechnungGestellt();
  const steps: { key: AbrechnungStatusEnum | 'abgenommen'; label: string; icon: React.ReactNode; date: string | null | undefined }[] = [
    { key: 'abgenommen', label: 'Abgenommen', icon: <CheckCircle2 className="w-4 h-4" />, date: approvedAt },
    { key: 'rechnung_eingegangen', label: 'Rechnung', icon: <Receipt className="w-4 h-4" />, date: rechnungEingegangenAm },
    { key: 'in_pruefung', label: 'Prüfung', icon: <Search className="w-4 h-4" />, date: geprueftAm },
    { key: 'bezahlt', label: 'Bezahlt', icon: <Banknote className="w-4 h-4" />, date: bezahltAm },
  ];

  const statusOrder: (AbrechnungStatusEnum | 'abgenommen')[] = ['abgenommen', 'rechnung_eingegangen', 'in_pruefung', 'bezahlt'];
  const currentIdx = status === 'offen' ? 0 : statusOrder.indexOf(status);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Abrechnung</p>
        {betrag != null && (
          <p className="text-sm font-bold text-foreground">{betrag.toFixed(0)} €</p>
        )}
      </div>
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const isDone = idx <= currentIdx;
          const isActive = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDone ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                } ${isActive && !isDone ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                  {isDone ? <Check className="w-4 h-4" /> : step.icon}
                </div>
                <p className={`text-[11px] mt-1 font-medium text-center ${isDone ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(parseISO(step.date), 'd. MMM', { locale: de })}
                  </p>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mt-4 ${idx < currentIdx ? 'bg-green-400' : 'bg-muted'}`} />
              )}
            </div>
          );
        })}
      </div>
      {status === 'offen' && auftragId && (
        <button
          onClick={() => markMutation.mutate(auftragId)}
          disabled={markMutation.isPending}
          className="mt-4 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {markMutation.isPending ? 'Wird gesendet…' : 'Rechnung gestellt'}
        </button>
      )}
      {status === 'rechnung_eingegangen' && (
        <p className="mt-3 text-xs text-center text-muted-foreground">
          Rechnung übermittelt — geht automatisch in Prüfung.
        </p>
      )}
      {status === 'bezahlt' && (
        <p className="mt-3 text-xs text-center text-green-600 dark:text-green-400 font-medium">
          ✓ Bezahlt — Auftrag abgeschlossen
        </p>
      )}
    </div>
  );
}


function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
      {icon}
      {label}
    </span>
  );
}

export function TechnicianOrderDetail({ 
  order, 
  onBack, 
  onAccept, 
  onReject,
  onStartCheckin,
  onCheckout,
  onStartRework,
  showFullDetails = true,
  technicianName,
}: TechnicianOrderDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [confirmingVortag, setConfirmingVortag] = useState(false);
  const { copiedKey, copy } = useCopyAction();
  const { data: abrechnungData } = useAbrechnungStatus(order.auftragId);

  const [checklist, setChecklist] = useState({
    terminAbgesprochen: false,
    adresseVerifiziert: false,
    raumzugangBestaetigt: false,
  });
  const [agreedTime, setAgreedTime] = useState<string>(order.scheduledTime?.slice(0, 5) ?? '');
  const allChecked = checklist.terminAbgesprochen && checklist.adresseVerifiziert && checklist.raumzugangBestaetigt;
  const canSubmitBooking = allChecked && /^\d{2}:\d{2}$/.test(agreedTime);

  const formattedDate = format(parseISO(order.scheduledDate), 'EEEE, d. MMMM yyyy', { locale: de });
  const shortDate = format(parseISO(order.scheduledDate), 'd. MMMM yyyy', { locale: de });
  
  const fullAddress = `${order.address}, ${order.postalCode} ${order.city}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Status flags
  const isPoolOrder = order.status === 'published';
  const isBookedOrder = order.status === 'booked';
  const isInProgress = order.status === 'in_progress';
  const isReworkRequired = order.status === 'rework_required';
  const isSubmitted = order.status === 'submitted' || order.status === 'in_review';
  const isApproved = order.status === 'approved';
  const canShowFullDetails = showFullDetails && !isPoolOrder;
  
  const buchungDone = !!order.buchungBestaetigtAm;
  const vortagDone = !!order.vortagBestaetigtAm;
  const showVortagTask = buchungDone;

  const vorOrtStarted = !!order.vorOrtCheckinAt;
  const vorOrtCompleted = !!order.vorOrtCheckoutAt;
  const nachbearbeitungStarted = !!order.nachbearbeitungCheckinAt;
  const nachbearbeitungCompleted = !!order.nachbearbeitungCheckoutAt;
  
  const canStartVorOrt = isBookedOrder && !vorOrtStarted;
  const canCheckoutVorOrt = isInProgress && order.checkinPhase === 'vor_ort' && vorOrtStarted && !vorOrtCompleted;
  const canStartNachbearbeitung = isInProgress && vorOrtCompleted && !nachbearbeitungStarted;
  const canCheckoutNachbearbeitung = isInProgress && order.checkinPhase === 'nachbearbeitung' && nachbearbeitungStarted && !nachbearbeitungCompleted;

  const displayName = technicianName || '[Ihr Name]';
  const callScript = `Guten Tag, mein Name ist ${displayName} von der Galvanek Bau GmbH.
Ich bin Ihr Feinaufmaßtechniker. Sie hatten einen Terminvorschlag für den ${shortDate} um ${order.scheduledTime} Uhr gemacht.

Ich wollte den Termin kurz mit Ihnen absprechen – passt das bei Ihnen?

Außerdem möchte ich sicherstellen:
- Ist die Adresse ${fullAddress} korrekt?
- Sind am Termin alle Räume für mich zugänglich?
  Das ist wichtig für die korrekte Heizlastberechnung.

[Falls ja:] Sehr gut, ich schicke Ihnen vorab noch eine schriftliche Bestätigung per E-Mail.
[Falls nein:] Kein Problem, dann klären wir einen neuen Termin.`;

  const emailSubject = `Terminbestätigung Feinaufmaß – ${shortDate}`;
  const emailBody = `Sehr geehrte/r ${order.customerName},

wie soeben telefonisch besprochen, bestätige ich hiermit schriftlich Ihren Termin für das Feinaufmaß:

Datum: ${shortDate}
Uhrzeit: ${order.scheduledTime} Uhr
Adresse: ${order.address}, ${order.postalCode} ${order.city}

Bitte stellen Sie sicher, dass alle Räume am Termintag zugänglich sind, damit die Heizlastberechnung vollständig durchgeführt werden kann.

Falls sich etwas ändern sollte, melden Sie sich bitte zeitnah unter dieser E-Mail-Adresse.

Mit freundlichen Grüßen`;

  const handleConfirmBooking = async () => {
    if (!order.auftragId) return;
    if (!/^\d{2}:\d{2}$/.test(agreedTime)) {
      toast.error('Bitte exakte Uhrzeit angeben');
      return;
    }
    setConfirmingBooking(true);
    try {
      const { error } = await supabase.rpc('confirm_thermocheck_booking', {
        p_auftrag_id: order.auftragId,
        p_uhrzeit: `${agreedTime}:00`,
      } as any);
      if (error) throw error;
      toast.success('Anruf als erledigt markiert');
      queryClient.invalidateQueries({ queryKey: ['my-assigned-orders'] });
    } catch (err: any) {
      console.error('[confirmBooking]', err);
      toast.error(err.message || 'Fehler beim Bestätigen');
    } finally {
      setConfirmingBooking(false);
    }
  };

  const handleConfirmVortag = async () => {
    if (!order.auftragId) return;
    setConfirmingVortag(true);
    try {
      const { error } = await supabase.rpc('confirm_thermocheck_vortag', { p_auftrag_id: order.auftragId } as any);
      if (error) throw error;
      toast.success('Vortag-Bestätigung markiert');
      queryClient.invalidateQueries({ queryKey: ['my-assigned-orders'] });
    } catch (err: any) {
      console.error('[confirmVortag]', err);
      toast.error(err.message || 'Fehler beim Bestätigen');
    } finally {
      setConfirmingVortag(false);
    }
  };

  const getStatusBadgeVariant = () => {
    switch (order.status) {
      case 'published': return 'secondary';
      case 'booked': return 'default';
      case 'in_progress': return 'default';
      case 'submitted':
      case 'in_review': return 'secondary';
      case 'approved': return 'default';
      case 'rework_required': return 'destructive';
      default: return 'secondary';
    }
  };

  const hasObjectInfo = order.quadratmeter || order.wohneinheiten || order.fussbodenheizung !== undefined;

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header – slim */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-base font-semibold">Auftragsdetails</h1>
          <Badge variant={getStatusBadgeVariant()} className="bg-primary-foreground/20 text-primary-foreground border-0 text-[11px]">
            {OBJECT_ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </header>

      <div className="p-4 space-y-3">

        {/* ── Hero Card: Customer + Type + Object Info + Price ── */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Badge variant="secondary" className="mb-1.5 text-[11px]">
                {AUFTRAGSTYP_LABELS[order.auftragstyp]}
              </Badge>
              <h2 className="text-lg font-bold text-foreground leading-tight">{order.customerName}</h2>

              {/* Object Info Chips */}
              {hasObjectInfo && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {order.quadratmeter && (
                    <InfoChip icon={<Ruler className="w-3 h-3" />} label={`${order.quadratmeter} m²`} />
                  )}
                  {order.wohneinheiten && (
                    <InfoChip icon={<Home className="w-3 h-3" />} label={`${order.wohneinheiten} WE`} />
                  )}
                  {order.fussbodenheizung !== undefined && (
                    <InfoChip
                      icon={<Thermometer className="w-3 h-3" />}
                      label={order.fussbodenheizung ? 'FBH vorhanden' : 'Keine FBH'}
                    />
                  )}
                </div>
              )}
            </div>
            {order.billableAmount != null && (
              <div className="text-right shrink-0">
                <p className="text-[11px] text-muted-foreground">Vergütung</p>
                <p className="text-lg font-bold text-foreground">{order.billableAmount.toFixed(0)} €</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Termin & Adresse – combined card ── */}
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
            <span className="text-sm text-muted-foreground">·</span>
            <p className="text-sm text-muted-foreground">{order.scheduledTime} Uhr</p>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {canShowFullDetails && !isApproved ? (
                <p className="text-sm text-foreground">{order.address}, {order.postalCode} {order.city}</p>
              ) : (
                <>
                  <p className="text-sm text-foreground">{order.postalCode} {order.city}</p>
                  {isPoolOrder && <p className="text-xs text-muted-foreground italic">Genaue Adresse nach Annahme</p>}
                </>
              )}
            </div>
            {canShowFullDetails && !isApproved && (
              <button
                onClick={() => copy(fullAddress, 'Adresse', 'address')}
                className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
              >
                {copiedKey === 'address'
                  ? <Check className="w-3.5 h-3.5 text-green-600" />
                  : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            )}
          </div>
          {canShowFullDetails && !isApproved && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Navigation starten
            </a>
          )}
        </div>

        {/* ── Kontakt – compact row ── */}
        {canShowFullDetails && !isApproved && (order.contactPhone || order.contactEmail) && (
          <div className="bg-card rounded-2xl p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {order.contactPhone && (
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 flex-1 min-w-[140px]">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">{order.contactPhone}</span>
                  <button
                    onClick={() => copy(order.contactPhone!, 'Telefonnummer', 'contact-phone')}
                    className="p-0.5 rounded hover:bg-accent transition-colors shrink-0 ml-auto"
                  >
                    {copiedKey === 'contact-phone'
                      ? <Check className="w-3 h-3 text-green-600" />
                      : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              )}
              {order.contactEmail && (
                <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 flex-1 min-w-[140px]">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">{order.contactEmail}</span>
                  <button
                    onClick={() => copy(order.contactEmail!, 'E-Mail', 'contact-email')}
                    className="p-0.5 rounded hover:bg-accent transition-colors shrink-0 ml-auto"
                  >
                    {copiedKey === 'contact-email'
                      ? <Check className="w-3 h-3 text-green-600" />
                      : <Copy className="w-3 h-3 text-muted-foreground" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Aufgaben Accordion – booked orders only ── */}
        {isBookedOrder && (
          <div className="bg-card rounded-2xl p-3 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-2 px-1">Aufgaben</p>
            <Accordion type="single" collapsible className="w-full" defaultValue={!buchungDone ? 'anruf' : undefined}>
              {/* Task 1: Anruf */}
              <AccordionItem value="anruf" className={`border-0 ${buchungDone ? 'bg-green-50/50 dark:bg-green-950/20 rounded-xl' : 'bg-muted/30 rounded-xl'} mb-1`}>
                <AccordionTrigger className="py-2.5 px-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    {buchungDone
                      ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      : <Phone className="w-4 h-4 text-orange-500 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${buchungDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                        Termin telefonisch absprechen
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {buchungDone
                          ? `Erledigt ${format(parseISO(order.buchungBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })}`
                          : 'Kunden anrufen, Termin & Zugang klären'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  {buchungDone ? (
                    <p className="text-sm text-green-600 dark:text-green-400">✓ Bereits erledigt</p>
                  ) : (
                    <div className="space-y-3">
                      <CopyBlock label="Anruf-Leitfaden" text={callScript} copyKey="callscript" copiedKey={copiedKey} onCopy={copy} />
                      {order.contactPhone && (
                        <CopyBlock label="Telefonnummer" text={order.contactPhone} copyKey="phone" copiedKey={copiedKey} onCopy={copy} />
                      )}
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Checkliste</p>
                        <div className="space-y-2">
                          {[
                            { key: 'terminAbgesprochen' as const, title: 'Termin mit Kunde abgesprochen', sub: 'Passt der vorgeschlagene Termin?' },
                            { key: 'adresseVerifiziert' as const, title: 'Adresse verifiziert', sub: 'Stimmt die Adresse?' },
                            { key: 'raumzugangBestaetigt' as const, title: 'Raumzugang bestätigt', sub: 'Alle Räume zugänglich?' },
                          ].map(item => (
                            <label key={item.key} className="flex items-start gap-2.5 cursor-pointer">
                              <Checkbox
                                checked={checklist[item.key]}
                                onCheckedChange={(v) => setChecklist(s => ({ ...s, [item.key]: !!v }))}
                              />
                              <div>
                                <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
                                <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                          Exakt abgesprochene Uhrzeit
                        </p>
                        <input
                          type="time"
                          value={agreedTime}
                          onChange={(e) => setAgreedTime(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Diese Uhrzeit wird gespeichert. Der Auftragsstatus bleibt unverändert.
                        </p>
                      </div>
                      <Button size="sm" className="w-full" onClick={handleConfirmBooking} disabled={confirmingBooking || !canSubmitBooking}>
                        {confirmingBooking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {!allChecked ? 'Bitte alle Punkte abhaken' : !/^\d{2}:\d{2}$/.test(agreedTime) ? 'Uhrzeit angeben' : 'Als erledigt markieren'}
                      </Button>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Task 2: Vortag E-Mail */}
              {showVortagTask && (
                <AccordionItem value="vortag-email" className={`border-0 ${vortagDone ? 'bg-green-50/50 dark:bg-green-950/20 rounded-xl' : 'bg-muted/30 rounded-xl'}`}>
                  <AccordionTrigger className="py-2.5 px-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      {vortagDone
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                        : <Mail className="w-4 h-4 text-orange-500 shrink-0" />}
                      <div>
                        <p className={`text-sm font-medium ${vortagDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          Terminbestätigung per E-Mail
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {vortagDone
                            ? `Erledigt ${format(parseISO(order.vortagBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })}`
                            : 'Schriftliche Bestätigung am Vortag'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3">
                    {vortagDone ? (
                      <p className="text-sm text-green-600 dark:text-green-400">✓ Bereits erledigt</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5">
                          <p className="text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                            ⚠️ Am Vortag des Termins versenden – dient als schriftlicher Nachweis.
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Arbeitsanweisung</p>
                          <ol className="list-decimal list-inside text-sm text-foreground space-y-1">
                            <li>Gmail öffnen und neue E-Mail erstellen</li>
                            <li>Kunden-E-Mail-Adresse eintragen</li>
                            <li>Betreff kopieren und einfügen</li>
                            <li>E-Mail-Text kopieren und einfügen</li>
                            <li>E-Mail absenden</li>
                            <li>Unten auf „Als erledigt markieren" klicken</li>
                          </ol>
                        </div>
                        {order.contactEmail && (
                          <CopyBlock label="Kunden-E-Mail" text={order.contactEmail} copyKey="email" copiedKey={copiedKey} onCopy={copy} />
                        )}
                        <CopyBlock label="Betreff" text={emailSubject} copyKey="subject" copiedKey={copiedKey} onCopy={copy} />
                        <CopyBlock label="E-Mail-Text" text={emailBody} copyKey="body" copiedKey={copiedKey} onCopy={copy} />
                        <Button size="sm" className="w-full" onClick={handleConfirmVortag} disabled={confirmingVortag}>
                          {confirmingVortag ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          Als erledigt markieren
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}

        {/* ── Chat ── */}
        {order.auftragId && !isPoolOrder && !isApproved && (
          <AuftragChatSection auftragId={order.auftragId} />
        )}

        {/* ── Notes ── */}
        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-0.5">Hinweise</p>
            <p className="text-amber-700 dark:text-amber-300 text-sm">{order.notes}</p>
          </div>
        )}

        {/* ── Arbeitsfortschritt – horizontal stepper (non-approved) ── */}
        {(isInProgress || isSubmitted || isReworkRequired) && (
          <div className="bg-card rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground mb-3">Fortschritt</p>
            <div className="flex items-center gap-0">
              {/* Step 1: Vor-Ort */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  vorOrtCompleted ? 'bg-green-500 text-white' : vorOrtStarted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {vorOrtCompleted ? '✓' : '1'}
                </div>
                <p className={`text-[11px] mt-1 font-medium ${vorOrtCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  Vor-Ort
                </p>
                {order.vorOrtCheckinAt && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(parseISO(order.vorOrtCheckinAt), 'HH:mm', { locale: de })}
                    {order.vorOrtCheckoutAt && ` – ${format(parseISO(order.vorOrtCheckoutAt), 'HH:mm', { locale: de })}`}
                  </p>
                )}
              </div>
              {/* Connector line */}
              <div className={`h-0.5 flex-1 -mt-4 ${vorOrtCompleted ? 'bg-green-400' : 'bg-muted'}`} />
              {/* Step 2: Nachbearbeitung */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  nachbearbeitungCompleted ? 'bg-green-500 text-white' : nachbearbeitungStarted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {nachbearbeitungCompleted ? '✓' : '2'}
                </div>
                <p className={`text-[11px] mt-1 font-medium ${nachbearbeitungCompleted ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                  Nachbearbeitung
                </p>
                {order.nachbearbeitungCheckinAt && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(parseISO(order.nachbearbeitungCheckinAt), 'HH:mm', { locale: de })}
                    {order.nachbearbeitungCheckoutAt && ` – ${format(parseISO(order.nachbearbeitungCheckoutAt), 'HH:mm', { locale: de })}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Abrechnungs-Fortschritt – approved orders only ── */}
        {isApproved && (
          <AbrechnungStepper
            status={abrechnungData?.status ?? 'offen'}
            approvedAt={order.approvedAt}
            rechnungEingegangenAm={abrechnungData?.rechnungEingegangenAm ?? null}
            geprueftAm={abrechnungData?.geprueftAm ?? null}
            bezahltAm={abrechnungData?.bezahltAm ?? null}
            betrag={abrechnungData?.betrag ?? order.billableAmount ?? null}
            auftragId={order.auftragId}
          />
        )}

        {/* ── Aufstellort-Check (vor-Ort, vor dem Formular) ── */}
        {!isPoolOrder && !isSubmitted && !isApproved && (
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-2xl border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 text-base font-semibold h-12"
            onClick={() => navigate(`/thermocheck/aufstellort-check/${order.auftragId || order.id}`)}
          >
            <MapPin className="w-5 h-5 mr-2" />
            AI-Aufstellort-Check (vor Ort)
          </Button>
        )}

        {/* ── Aufmaß Button ── */}
        {!isPoolOrder && (
          <Button
            size="lg"
            className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold h-12"
            onClick={() => navigate(`/thermocheck/aufmass/${order.auftragId || order.id}`)}
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            {isSubmitted || isApproved ? 'Aufmaß-Formular ansehen' : 'Aufmaß-Formular öffnen'}
          </Button>
        )}
      </div>

      {/* ── Action Bar ── */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border safe-area-bottom">
        {isPoolOrder && order.isLocked && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground font-medium">{order.lockReason || 'Nicht freigegeben'}</p>
          </div>
        )}
        {isPoolOrder && !order.isLocked && onAccept && onReject && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onReject}>Ablehnen</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700 rounded-xl" onClick={onAccept}>Annehmen</Button>
          </div>
        )}
        {canStartVorOrt && onStartCheckin && (
          <Button className="w-full bg-primary rounded-xl" onClick={() => onStartCheckin('vor_ort')}>
            <Clock className="w-4 h-4 mr-2" />Check-in Vor-Ort starten
          </Button>
        )}
        {canCheckoutVorOrt && onCheckout && (
          <Button className="w-full bg-green-600 hover:bg-green-700 rounded-xl" onClick={() => onCheckout('vor_ort')}>Vor-Ort abschließen</Button>
        )}
        {canStartNachbearbeitung && onStartCheckin && (
          <Button className="w-full bg-primary rounded-xl" onClick={() => onStartCheckin('nachbearbeitung')}>
            <Clock className="w-4 h-4 mr-2" />Nachbearbeitung starten
          </Button>
        )}
        {canCheckoutNachbearbeitung && onCheckout && (
          <Button className="w-full bg-green-600 hover:bg-green-700 rounded-xl" onClick={() => onCheckout('nachbearbeitung')}>Abschließen & Einreichen</Button>
        )}
        {isReworkRequired && onStartRework && (
          <Button className="w-full bg-amber-600 hover:bg-amber-700 rounded-xl" onClick={onStartRework}>Nacharbeit starten</Button>
        )}
        {isSubmitted && (
          <div className="text-center text-muted-foreground py-2">
            <Clock className="w-5 h-5 mx-auto mb-1" /><p className="text-sm">Warte auf Prüfung...</p>
          </div>
        )}
        {isApproved && (
          <div className="text-center text-green-600 dark:text-green-400 py-2">
            <p className="font-medium">✓ Abgenommen</p>
            {order.approvedAt && <p className="text-sm">am {format(parseISO(order.approvedAt), 'd. MMMM yyyy', { locale: de })}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
