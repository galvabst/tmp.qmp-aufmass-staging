import { ArrowLeft, MapPin, Clock, Phone, Mail, FileText, Euro, Navigation, Calendar, ClipboardList, CheckCircle2, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import { TechnicianOrder, CheckinPhase, CHECKIN_PHASE_LABELS } from '@/types/technician';
import { AUFTRAGSTYP_LABELS, OBJECT_ORDER_STATUS_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

  const formattedDate = format(parseISO(order.scheduledDate), 'EEEE, d. MMMM yyyy', { locale: de });
  const shortDate = format(parseISO(order.scheduledDate), 'd. MMMM yyyy', { locale: de });
  
  const fullAddress = `${order.address}, ${order.postalCode} ${order.city}`;
  const mapsUrl = `https://maps.google.com/maps?daddr=${encodeURIComponent(fullAddress)}`;

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
  const showVortagTask = buchungDone && terminSoon;

  // Phase tracking
  const vorOrtStarted = !!order.vorOrtCheckinAt;
  const vorOrtCompleted = !!order.vorOrtCheckoutAt;
  const nachbearbeitungStarted = !!order.nachbearbeitungCheckinAt;
  const nachbearbeitungCompleted = !!order.nachbearbeitungCheckoutAt;
  
  const canStartVorOrt = isBookedOrder && !vorOrtStarted;
  const canCheckoutVorOrt = isInProgress && order.checkinPhase === 'vor_ort' && vorOrtStarted && !vorOrtCompleted;
  const canStartNachbearbeitung = isInProgress && vorOrtCompleted && !nachbearbeitungStarted;
  const canCheckoutNachbearbeitung = isInProgress && order.checkinPhase === 'nachbearbeitung' && nachbearbeitungStarted && !nachbearbeitungCompleted;

  // --- E-Mail Template ---
  const emailSubject = `Terminbestätigung Feinaufmaß – ${shortDate}`;
  const emailBody = `Sehr geehrte/r ${order.customerName},

vielen Dank für Ihre Terminanfrage.

Hiermit bestätige ich Ihren Termin für das Feinaufmaß:

Datum: ${shortDate}
Uhrzeit: ${order.scheduledTime} Uhr
Adresse: ${order.address}, ${order.postalCode} ${order.city}

Ich werde als Ihr Feinaufmaßtechniker vor Ort sein.

Falls Sie Fragen haben, erreichen Sie mich unter dieser E-Mail-Adresse.

Mit freundlichen Grüßen`;

  // --- Anruf-Leitfaden ---
  const displayName = technicianName || '[Ihr Name]';
  const callScript = `"Guten Tag, mein Name ist ${displayName} von der Galvanek Bau GmbH.
Ich bin Ihr Feinaufmaßtechniker und rufe an, weil morgen Ihr Termin am ${shortDate} um ${order.scheduledTime} Uhr ansteht.

Ich wollte kurz bestätigen, dass der Termin bei Ihnen stattfinden kann. Passt das so?"`;

  const handleConfirmBooking = async () => {
    if (!order.auftragId) return;
    setConfirmingBooking(true);
    try {
      const { data, error } = await supabase.rpc('confirm_thermocheck_booking', {
        p_auftrag_id: order.auftragId,
      } as any);
      if (error) throw error;
      toast.success('Buchung als bestätigt markiert');
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
          <Badge variant="secondary" className="mb-2">
            {AUFTRAGSTYP_LABELS[order.auftragstyp]}
          </Badge>
          <h2 className="text-xl font-bold text-foreground">{order.customerName}</h2>
        </div>

        {/* ===== Aufgaben-Card with Accordion – only for booked orders ===== */}
        {isBookedOrder && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="font-medium text-foreground mb-2">Aufgaben</p>

            <Accordion type="single" collapsible className="w-full">
              {/* --- Task 1: Buchung bestätigen --- */}
              <AccordionItem value="buchung" className={buchungDone ? 'border-green-200 dark:border-green-800' : ''}>
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    {buchungDone
                      ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                      : <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />}
                    <div>
                      <p className={`text-sm font-medium ${buchungDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                        Buchung bestätigen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {buchungDone
                          ? `Bestätigt am ${format(parseISO(order.buchungBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })} Uhr`
                          : 'Kunden per E-Mail kontaktieren'}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {buchungDone ? (
                    <p className="text-sm text-green-600 dark:text-green-400">✓ Bereits erledigt</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Step-by-step instructions */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Arbeitsanweisung</p>
                        <ol className="list-decimal list-inside text-sm text-foreground space-y-1.5">
                          <li>Gmail öffnen und neue E-Mail erstellen</li>
                          <li>Kunden-E-Mail-Adresse eintragen (siehe unten)</li>
                          <li>Betreff aus dem Feld unten kopieren und einfügen</li>
                          <li>E-Mail-Text aus dem Feld unten kopieren und einfügen</li>
                          <li>E-Mail absenden – die Signatur wird automatisch angehängt</li>
                          <li>Danach unten auf „Als erledigt markieren" klicken</li>
                        </ol>
                      </div>

                      {/* Customer email as plain text with copy */}
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
                        onClick={handleConfirmBooking}
                        disabled={confirmingBooking}
                      >
                        {confirmingBooking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        Als erledigt markieren
                      </Button>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* --- Task 2: Vortag Anruf --- */}
              {showVortagTask && (
                <AccordionItem value="vortag" className={vortagDone ? 'border-green-200 dark:border-green-800' : ''}>
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      {vortagDone
                        ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                        : <Phone className="w-5 h-5 text-orange-500 shrink-0" />}
                      <div>
                        <p className={`text-sm font-medium ${vortagDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          Vortag: Termin rückbestätigen
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vortagDone
                            ? `Bestätigt am ${format(parseISO(order.vortagBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })} Uhr`
                            : 'Kunden anrufen & Termin nochmal bestätigen'}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {vortagDone ? (
                      <p className="text-sm text-green-600 dark:text-green-400">✓ Bereits erledigt</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Call script */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Anruf-Leitfaden</p>
                          <CopyBlock
                            label="Gesprächsvorlage"
                            text={callScript}
                            copyKey="callscript"
                            copiedKey={copiedKey}
                            onCopy={copy}
                          />
                        </div>

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

        {/* Address */}
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
          </div>
          {canShowFullDetails && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 p-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
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
          <Button
            className="w-full"
            variant="outline"
            onClick={() => navigate(`/thermocheck/aufmass/${order.id}`)}
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Aufmaß erfassen
          </Button>
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
