import { ArrowLeft, MapPin, Clock, Phone, Mail, FileText, Euro, Navigation, Calendar, ClipboardList, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
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

/** Render a grey box with copy button */
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
      <div className="relative bg-muted rounded-lg p-3 pr-12">
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{text}</p>
        <button
          onClick={() => onCopy(text, label, copyKey)}
          className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-accent transition-colors"
          title="Kopieren"
        >
          {isCopied
            ? <Check className="w-4 h-4 text-green-600" />
            : <Copy className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>
    </div>
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

  // Checklist state for Anruf task
  const [checklist, setChecklist] = useState({
    terminAbgesprochen: false,
    adresseVerifiziert: false,
    raumzugangBestaetigt: false,
  });
  const allChecked = checklist.terminAbgesprochen && checklist.adresseVerifiziert && checklist.raumzugangBestaetigt;

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
  
  // Confirmation status
  const buchungDone = !!order.buchungBestaetigtAm;
  const vortagDone = !!order.vortagBestaetigtAm;
  const terminSoon = isToday(parseISO(order.scheduledDate)) || isTomorrow(parseISO(order.scheduledDate));
  const showVortagTask = buchungDone;

  // Phase tracking
  const vorOrtStarted = !!order.vorOrtCheckinAt;
  const vorOrtCompleted = !!order.vorOrtCheckoutAt;
  const nachbearbeitungStarted = !!order.nachbearbeitungCheckinAt;
  const nachbearbeitungCompleted = !!order.nachbearbeitungCheckoutAt;
  
  const canStartVorOrt = isBookedOrder && !vorOrtStarted;
  const canCheckoutVorOrt = isInProgress && order.checkinPhase === 'vor_ort' && vorOrtStarted && !vorOrtCompleted;
  const canStartNachbearbeitung = isInProgress && vorOrtCompleted && !nachbearbeitungStarted;
  const canCheckoutNachbearbeitung = isInProgress && order.checkinPhase === 'nachbearbeitung' && nachbearbeitungStarted && !nachbearbeitungCompleted;

  // --- Anruf-Leitfaden (Task 1 – sofort nach Annahme) ---
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

  // --- E-Mail Template (Task 2 – Vortag, schriftlicher Nachweis) ---
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
    setConfirmingBooking(true);
    try {
      const { data, error } = await supabase.rpc('confirm_thermocheck_booking', {
        p_auftrag_id: order.auftragId,
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
      const { data, error } = await supabase.rpc('confirm_thermocheck_vortag', {
        p_auftrag_id: order.auftragId,
      } as any);
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-primary-foreground/10 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Auftragsdetails</h1>
          </div>
          <Badge variant={getStatusBadgeVariant()} className="bg-primary-foreground/20 text-primary-foreground border-0">
            {OBJECT_ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Customer & Type */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="secondary" className="mb-2">
                {AUFTRAGSTYP_LABELS[order.auftragstyp]}
              </Badge>
              <h2 className="text-xl font-bold text-foreground">{order.customerName}</h2>
            </div>
            {order.billableAmount != null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Vergütung</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-1">
                  <Euro className="w-4 h-4" />
                  {order.billableAmount.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== Aufgaben-Card with Accordion – only for booked orders ===== */}
        {isBookedOrder && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="font-medium text-foreground mb-2">Aufgaben</p>

            <Accordion type="single" collapsible className="w-full" defaultValue={!buchungDone ? 'anruf' : undefined}>
              {/* --- Task 1: Anruf – Termin telefonisch absprechen --- */}
              <AccordionItem value="anruf" className={buchungDone ? 'border-green-200 dark:border-green-800' : ''}>
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    {buchungDone
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                      : <Phone className="w-5 h-5 text-orange-500 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${buchungDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                        Schritt 1: Termin telefonisch absprechen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {buchungDone
                          ? `Erledigt am ${format(parseISO(order.buchungBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })} Uhr`
                          : 'Kunden anrufen, Termin & Zugang klären'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {buchungDone ? (
                    <p className="text-sm text-green-600 dark:text-green-400">✓ Bereits erledigt</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Anruf-Leitfaden */}
                      <CopyBlock
                        label="Anruf-Leitfaden (Gesprächsvorlage)"
                        text={callScript}
                        copyKey="callscript"
                        copiedKey={copiedKey}
                        onCopy={copy}
                      />

                      {/* Phone number as plain text */}
                      {order.contactPhone && (
                        <CopyBlock
                          label="Telefonnummer"
                          text={order.contactPhone}
                          copyKey="phone"
                          copiedKey={copiedKey}
                          onCopy={copy}
                        />
                      )}

                      {/* Checkliste */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Checkliste – im Telefonat klären</p>
                        <div className="space-y-3">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={checklist.terminAbgesprochen}
                              onCheckedChange={(v) => setChecklist(s => ({ ...s, terminAbgesprochen: !!v }))}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Termin mit Kunde abgesprochen</p>
                              <p className="text-xs text-muted-foreground">Passt der vorgeschlagene Termin?</p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={checklist.adresseVerifiziert}
                              onCheckedChange={(v) => setChecklist(s => ({ ...s, adresseVerifiziert: !!v }))}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Adresse verifiziert – richtiges Objekt</p>
                              <p className="text-xs text-muted-foreground">Stimmt die Adresse? Fahren Sie zum richtigen Gebäude?</p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 cursor-pointer">
                            <Checkbox
                              checked={checklist.raumzugangBestaetigt}
                              onCheckedChange={(v) => setChecklist(s => ({ ...s, raumzugangBestaetigt: !!v }))}
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">Raumzugang bestätigt – alle Räume zugänglich</p>
                              <p className="text-xs text-muted-foreground">Sind alle Räume am Termin begehbar? Wichtig für die Heizlastberechnung.</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleConfirmBooking}
                        disabled={confirmingBooking || !allChecked}
                      >
                        {confirmingBooking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {allChecked ? 'Als erledigt markieren' : 'Bitte alle Punkte abhaken'}
                      </Button>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* --- Task 2: E-Mail am Vortag (schriftlicher Nachweis) --- */}
              {showVortagTask && (
                <AccordionItem value="vortag-email" className={vortagDone ? 'border-green-200 dark:border-green-800' : ''}>
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      {vortagDone
                        ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                        : <Mail className="w-5 h-5 text-orange-500 shrink-0" />}
                      <div>
                        <p className={`text-sm font-medium ${vortagDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          Schritt 2: Terminbestätigung per E-Mail
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vortagDone
                            ? `Erledigt am ${format(parseISO(order.vortagBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })} Uhr`
                            : 'Schriftliche Bestätigung am Vortag senden'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {vortagDone ? (
                      <p className="text-sm text-green-600 dark:text-green-400">✓ Bereits erledigt</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Disclaimer */}
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                            ⚠️ Diese E-Mail dient als schriftlicher Nachweis, dass der Termin stattfindet. Bitte am Vortag des Termins versenden.
                          </p>
                        </div>

                        {/* Step-by-step instructions */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Arbeitsanweisung</p>
                          <ol className="list-decimal list-inside text-sm text-foreground space-y-1.5">
                            <li>Gmail öffnen und neue E-Mail erstellen</li>
                            <li>Kunden-E-Mail-Adresse eintragen (siehe unten)</li>
                            <li>Betreff kopieren und einfügen</li>
                            <li>E-Mail-Text kopieren und einfügen</li>
                            <li>E-Mail absenden – die Signatur wird automatisch angehängt</li>
                            <li>Danach unten auf „Als erledigt markieren" klicken</li>
                          </ol>
                        </div>

                        {/* Customer email */}
                        {order.contactEmail && (
                          <CopyBlock
                            label="Kunden-E-Mail"
                            text={order.contactEmail}
                            copyKey="email"
                            copiedKey={copiedKey}
                            onCopy={copy}
                          />
                        )}

                        {/* Copyable subject */}
                        <CopyBlock
                          label="Betreff"
                          text={emailSubject}
                          copyKey="subject"
                          copiedKey={copiedKey}
                          onCopy={copy}
                        />

                        {/* Copyable body */}
                        <CopyBlock
                          label="E-Mail-Text"
                          text={emailBody}
                          copyKey="body"
                          copiedKey={copiedKey}
                          onCopy={copy}
                        />

                        <p className="text-xs text-muted-foreground italic">
                          Bitte in Gmail einfügen – die Signatur wird automatisch angehängt.
                        </p>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={handleConfirmVortag}
                          disabled={confirmingVortag}
                        >
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

        {/* Contact – plain text, no links */}
        {canShowFullDetails && (order.contactPhone || order.contactEmail) && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="font-medium text-foreground mb-3">Kontaktdaten</p>
            <div className="space-y-3">
              {order.contactPhone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{order.contactPhone}</span>
                  <button
                    onClick={() => copy(order.contactPhone!, 'Telefonnummer', 'contact-phone')}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                    title="Telefonnummer kopieren"
                  >
                    {copiedKey === 'contact-phone'
                      ? <Check className="w-4 h-4 text-green-600" />
                      : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              )}
              {order.contactEmail && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground text-sm break-all">{order.contactEmail}</span>
                  <button
                    onClick={() => copy(order.contactEmail!, 'E-Mail', 'contact-email')}
                    className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                    title="E-Mail kopieren"
                  >
                    {copiedKey === 'contact-email'
                      ? <Check className="w-4 h-4 text-green-600" />
                      : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{formattedDate}</p>
              <p className="text-muted-foreground">{order.scheduledTime} Uhr</p>
            </div>
          </div>
        </div>

        {/* Address – Navigation fix: window.open instead of <a> */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              {canShowFullDetails ? (
                <>
                  <p className="font-medium text-foreground">{order.address}</p>
                  <p className="text-muted-foreground">{order.postalCode} {order.city}</p>
                </>
              ) : (
                <>
                  <p className="font-medium text-foreground">{order.postalCode} {order.city}</p>
                  <p className="text-sm text-muted-foreground italic">Genaue Adresse nach Annahme sichtbar</p>
                </>
              )}
            </div>
            {canShowFullDetails && (
              <button
                onClick={() => copy(fullAddress, 'Adresse', 'address')}
                className="p-1.5 rounded-md hover:bg-accent transition-colors shrink-0"
                title="Adresse kopieren"
              >
                {copiedKey === 'address'
                  ? <Check className="w-4 h-4 text-green-600" />
                  : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            )}
          </div>
          {canShowFullDetails && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Navigation starten
            </a>
          )}
        </div>

        {/* Description */}
        {order.description && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">Beschreibung</p>
                <p className="text-muted-foreground text-sm">{order.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Hinweise</p>
            <p className="text-amber-700 dark:text-amber-300 text-sm">{order.notes}</p>
          </div>
        )}

        {/* Check-in/out Phase Status */}
        {(isInProgress || isSubmitted || isApproved || isReworkRequired) && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="font-medium text-foreground mb-3">Arbeitsfortschritt</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  vorOrtCompleted ? 'bg-green-500 text-white' : vorOrtStarted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {vorOrtCompleted ? '✓' : '1'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${vorOrtCompleted ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                    {CHECKIN_PHASE_LABELS.vor_ort}
                  </p>
                  {order.vorOrtCheckinAt && (
                    <p className="text-xs text-muted-foreground">
                      Check-in: {format(parseISO(order.vorOrtCheckinAt), 'HH:mm', { locale: de })} Uhr
                      {order.vorOrtCheckoutAt && ` → Check-out: ${format(parseISO(order.vorOrtCheckoutAt), 'HH:mm', { locale: de })} Uhr`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  nachbearbeitungCompleted ? 'bg-green-500 text-white' : nachbearbeitungStarted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {nachbearbeitungCompleted ? '✓' : '2'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${nachbearbeitungCompleted ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                    {CHECKIN_PHASE_LABELS.nachbearbeitung}
                  </p>
                  {order.nachbearbeitungCheckinAt && (
                    <p className="text-xs text-muted-foreground">
                      Check-in: {format(parseISO(order.nachbearbeitungCheckinAt), 'HH:mm', { locale: de })} Uhr
                      {order.nachbearbeitungCheckoutAt && ` → Check-out: ${format(parseISO(order.nachbearbeitungCheckoutAt), 'HH:mm', { locale: de })} Uhr`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing */}
        {order.billableAmount && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Euro className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium text-foreground">Vergütung</span>
              </div>
              <span className="text-xl font-bold text-foreground">{order.billableAmount.toFixed(2)} €</span>
            </div>
          </div>
        )}

        {/* Aufmaß Button */}
        {(isBookedOrder || isInProgress) && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base font-semibold"
              onClick={() => navigate(`/thermocheck/aufmass/${order.auftragId || order.id}`)}
            >
              <ClipboardList className="w-5 h-5 mr-2" />
              Aufmaß-Formular öffnen
            </Button>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        {isPoolOrder && onAccept && onReject && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onReject}>Ablehnen</Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={onAccept}>Annehmen</Button>
          </div>
        )}
        {canStartVorOrt && onStartCheckin && (
          <Button className="w-full bg-primary" onClick={() => onStartCheckin('vor_ort')}>
            <Clock className="w-4 h-4 mr-2" />Check-in Vor-Ort starten
          </Button>
        )}
        {canCheckoutVorOrt && onCheckout && (
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onCheckout('vor_ort')}>Vor-Ort abschließen</Button>
        )}
        {canStartNachbearbeitung && onStartCheckin && (
          <Button className="w-full bg-primary" onClick={() => onStartCheckin('nachbearbeitung')}>
            <Clock className="w-4 h-4 mr-2" />Nachbearbeitung starten
          </Button>
        )}
        {canCheckoutNachbearbeitung && onCheckout && (
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onCheckout('nachbearbeitung')}>Abschließen & Einreichen</Button>
        )}
        {isReworkRequired && onStartRework && (
          <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={onStartRework}>Nacharbeit starten</Button>
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
