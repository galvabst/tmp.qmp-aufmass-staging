import { ArrowLeft, MapPin, Clock, Phone, Mail, FileText, Euro, Navigation, Calendar, ClipboardList, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { TechnicianOrder, CheckinPhase, CHECKIN_PHASE_LABELS } from '@/types/technician';
import { AUFTRAGSTYP_LABELS, OBJECT_ORDER_STATUS_LABELS } from '@/lib/enums';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}: TechnicianOrderDetailProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmingBooking, setConfirmingBooking] = useState(false);
  const [confirmingVortag, setConfirmingVortag] = useState(false);

  const formattedDate = format(parseISO(order.scheduledDate), 'EEEE, d. MMMM yyyy', { locale: de });
  
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

        {/* Confirmation Tasks Card - only for booked orders */}
        {isBookedOrder && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="font-medium text-foreground mb-3">Aufgaben</p>
            <div className="space-y-3">
              {/* Task 1: Buchungsbestätigung */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {buchungDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${buchungDone ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      Buchung bestätigen
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {buchungDone
                        ? `Bestätigt am ${format(parseISO(order.buchungBestaetigtAm!), 'd. MMM, HH:mm', { locale: de })} Uhr`
                        : 'Kunden per E-Mail kontaktieren & Termin bestätigen'}
                    </p>
                  </div>
                </div>
                {!buchungDone && (
                  <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleConfirmBooking(); }}
                    disabled={confirmingBooking}
                    className="shrink-0"
                  >
                    {confirmingBooking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Erledigt'}
                  </Button>
                )}
              </div>

              {/* Task 2: Vortag-Bestätigung */}
              {showVortagTask && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {vortagDone ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Phone className="w-5 h-5 text-orange-500" />
                    )}
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
                  {!vortagDone && (
                    <Button
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleConfirmVortag(); }}
                      disabled={confirmingVortag}
                      className="shrink-0"
                    >
                      {confirmingVortag ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Erledigt'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact - prominent for booked orders */}
        {canShowFullDetails && (order.contactPhone || order.contactEmail) && (
          <div className="bg-card rounded-xl p-4 shadow-card">
            <p className="font-medium text-foreground mb-3">Kontaktdaten</p>
            <div className="space-y-3">
              {order.contactPhone && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <a href={`tel:${order.contactPhone}`} className="font-medium text-primary hover:underline">
                    {order.contactPhone}
                  </a>
                </div>
              )}
              {order.contactEmail && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <a href={`mailto:${order.contactEmail}`} className="font-medium text-primary hover:underline text-sm break-all">
                    {order.contactEmail}
                  </a>
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
