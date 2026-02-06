import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, X } from 'lucide-react';
import { OnboardingStepWrapper } from './onboarding/OnboardingStepWrapper';
import { ProfileStep } from './onboarding/steps/ProfileStep';
import { DocumentsStep } from './onboarding/steps/DocumentsStep';
import { OrdersStep } from './onboarding/steps/OrdersStep';
import { EquipmentStep } from './onboarding/steps/EquipmentStep';
import { AcademyStep } from './onboarding/steps/AcademyStep';
import { ProofStep } from './onboarding/steps/ProofStep';
import { CoachingStep } from './onboarding/steps/CoachingStep';
import { OnboardingComplete } from './onboarding/OnboardingComplete';
import { WaitingForApproval } from './onboarding/WaitingForApproval';
import { useOnboardingState, clearOnboardingLocalStorage } from '@/hooks/useOnboardingState';
import { useAkademieContent } from '@/hooks/useAkademieContent';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { useContractorOrders, getPaidProductKeys } from '@/hooks/useContractorOrders';
import {
  MOCK_PRODUCTS,
  MOCK_COACHING_SLOTS,
  MOCK_EQUIPMENT,
  ONBOARDING_STEPS,
  createInitialOnboardingState,
} from '@/lib/onboarding-config';
import { CoachingSlot, ApplicantProfile, OnboardingStepId } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { getOnboardingStorageKey } from '@/lib/onboarding-storage';

interface OnboardingScreenProps {
  onComplete: () => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
  dbStatus?: {
    onboardingStatus: string;
    trainerFreigabe: boolean;
    profileId?: string; // NEU: Profile ID für DB-Abfragen
  };
}

// Leeres Profil als Fallback (wird durch DB-Daten ersetzt)
const EMPTY_PROFILE: ApplicantProfile = {
  id: '',
  vorname: '',
  nachname: '',
  email: '',
  telefon: '',
  strasse: '',
  hausnummer: '',
  plz: '',
  ort: '',
};

export function OnboardingScreen({ onComplete, isPreview = false, onExitPreview, dbStatus }: OnboardingScreenProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasHydratedRef = useRef(false);
  const nextClickLockRef = useRef(false);
  const paymentHandledRef = useRef(false);

  // verhindert Mehrfachklicks/Spam auf "Weiter" (sonst Steps werden übersprungen)
  const [isAdvancing, setIsAdvancing] = useState(false);

  // KRITISCH: Prüfe ob localStorage-Fortschritt ignoriert werden muss
  // weil DB sagt "invited" (kein echter Fortschritt vorhanden)
  const dbShowsNoProgress = dbStatus?.onboardingStatus === 'invited';
  const [forceReset, setForceReset] = useState(false);

  // Wenn DB "invited" sagt, aber localStorage möglicherweise "fertig" oder stark fortgeschritten ist
  // (z.B. wenn ein anderer User im gleichen Browser vorher Onboarding gemacht hat)
  useEffect(() => {
    const profileId = dbStatus?.profileId;
    if (!profileId || !dbShowsNoProgress || forceReset || isPreview) return;

    const storageKey = getOnboardingStorageKey(profileId);
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return;

    try {
      const parsed = JSON.parse(savedState);

      const completedSteps: OnboardingStepId[] = parsed.completedSteps || [];
      const indicatesMajorProgress =
        parsed.coachingAbgeschlossen === true ||
        completedSteps.includes('bestellungen') ||
        completedSteps.includes('equipment') ||
        completedSteps.includes('akademie') ||
        completedSteps.includes('nachweise') ||
        completedSteps.includes('coaching') ||
        (parsed.bestellungenBestaetigt?.length || 0) > 0 ||
        parsed.akademieTestBestanden === true;

      if (indicatesMajorProgress) {
        console.warn('[Onboarding] Stale localStorage detected (DB invited) - forcing reset');
        clearOnboardingLocalStorage(profileId);
        setForceReset(true);
      }
    } catch {
      clearOnboardingLocalStorage(profileId);
      setForceReset(true);
    }
  }, [dbShowsNoProgress, forceReset, isPreview, dbStatus?.profileId]);

  // Profildaten aus DB laden (SSoT: public.profiles + thermocheck.contractor_onboarding)
  const {
    data: dbProfile,
    isLoading: profileLoading,
    updateProfile: saveProfileToDb,
    uploadAvatar,
  } = useContractorProfile(dbStatus?.profileId || null);

  // Initial-Profil: DB-Daten oder leeres Fallback (aber mit korrekter User-ID für localStorage-Key)
  const initialProfile: ApplicantProfile =
    dbProfile || { ...EMPTY_PROFILE, id: dbStatus?.profileId || '' };
  
  const {
    state,
    progress,
    canProceed,
    isComplete,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    updateProfile,
    setAvatarUrl,
    setGewerbescheinUrl,
    setGewerbescheinSpaeter,
    toggleProductOrdered,
    setOberteilAuswahl,
    updateEquipmentStatus,
    completeAkademieModul,
    completeAkademieUnterpunkt,
    setAkademieTestBestanden,
    updateCheckliste,
    setGesamtfotoUrl,
    setGebuchterCoachingSlot,
    setCoachingAbgeschlossen,
    hydrateAkademieFromDb,
  } = useOnboardingState(initialProfile, isPreview, forceReset);
  
  // Unlock "Weiter" sobald der Schritt gewechselt hat
  useEffect(() => {
    if (!nextClickLockRef.current) return;
    nextClickLockRef.current = false;
    setIsAdvancing(false);
  }, [state.currentStep]);

  // Sync DB-Profil in State wenn geladen - intelligentes Merging
  useEffect(() => {
    if (!profileLoading && dbProfile) {
      // Prüfe ob wichtige DB-Felder fehlen im State
      const stateHasNoAvatar = !state.profil.avatarUrl;
      const dbHasAvatar = !!dbProfile.avatarUrl;

      const stateMissingAddress =
        !state.profil.strasse?.trim() ||
        !state.profil.hausnummer?.trim() ||
        !state.profil.plz?.trim() ||
        !state.profil.ort?.trim();

      const dbHasAddress =
        !!dbProfile.strasse?.trim() &&
        !!dbProfile.hausnummer?.trim() &&
        !!dbProfile.plz?.trim() &&
        !!dbProfile.ort?.trim();

      // Hydrate wenn State leer ODER wenn DB wichtige Daten hat die im State fehlen
      if (
        state.profil.id === '' ||
        (stateHasNoAvatar && dbHasAvatar) ||
        (stateMissingAddress && dbHasAddress)
      ) {
        console.log('[Onboarding] Hydrating profile from DB:', {
          reason:
            state.profil.id === ''
              ? 'empty_state'
              : stateHasNoAvatar && dbHasAvatar
                ? 'missing_avatar'
                : 'missing_address',
          dbProfile,
        });

        // Merge: Lokale Eingaben behalten, DB-Werte für leere Felder nutzen
        const mergedProfile: ApplicantProfile = {
          id: dbProfile.id,
          vorname: state.profil.vorname || dbProfile.vorname,
          nachname: state.profil.nachname || dbProfile.nachname,
          email: state.profil.email || dbProfile.email,
          telefon: state.profil.telefon || dbProfile.telefon,
          avatarUrl: state.profil.avatarUrl || dbProfile.avatarUrl,
          strasse: state.profil.strasse || dbProfile.strasse,
          hausnummer: state.profil.hausnummer || dbProfile.hausnummer,
          plz: state.profil.plz || dbProfile.plz,
          ort: state.profil.ort || dbProfile.ort,
        };

        updateProfile(mergedProfile);
      }
    }
  }, [profileLoading, dbProfile, state.profil, updateProfile]);
  
  // Fetch akademie content from database and hydrate state
  const { data: dbAkademieModule, isSuccess: dbLoaded } = useAkademieContent();
  
  useEffect(() => {
    if (isPreview || hasHydratedRef.current) return;
    if (!dbLoaded || !dbAkademieModule || dbAkademieModule.length === 0) return;
    
    hasHydratedRef.current = true;
    hydrateAkademieFromDb(dbAkademieModule);
  }, [dbLoaded, dbAkademieModule, isPreview, hydrateAkademieFromDb]);

  // Bestellungen aus DB laden (für Payment-Status-Sync)
  const { 
    data: dbOrders, 
    refetchOrders,
    isSuccess: ordersLoaded,
  } = useContractorOrders(dbStatus?.profileId || null);

  // Polling-Ref für Cleanup
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync bezahlte Bestellungen in den State
  useEffect(() => {
    if (!ordersLoaded || !dbOrders || dbOrders.length === 0) return;
    
    const paidKeys = getPaidProductKeys(dbOrders);
    if (paidKeys.length === 0) return;
    
    // Prüfe ob es neue bezahlte Produkte gibt
    const newPaidProducts = paidKeys.filter(key => !state.bestellungenBestaetigt.includes(key));
    if (newPaidProducts.length > 0) {
      console.log('[Onboarding] Syncing paid products from DB:', newPaidProducts);
      newPaidProducts.forEach(productId => {
        toggleProductOrdered(productId);
      });
    }
  }, [ordersLoaded, dbOrders, state.bestellungenBestaetigt, toggleProductOrdered]);

  // Polling nach Stripe-Checkout: Alle 3 Sekunden Orders neu laden
  useEffect(() => {
    // Cleanup vorheriges Polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    // Nur wenn auf Bestellungen-Step und es pending Orders gibt
    if (state.currentStep !== 'bestellungen') return;

    // Prüfe ob es pending Orders gibt
    const hasPendingOrders = dbOrders?.some(
      order => order.stripe_payment_status === 'pending'
    );

    if (!hasPendingOrders) return;

    console.log('[Onboarding] Starting payment polling (pending orders detected)');
    
    pollingRef.current = setInterval(() => {
      console.log('[Onboarding] Polling for payment status...');
      refetchOrders();
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [state.currentStep, dbOrders, refetchOrders]);

  // Payment Success Handler - wird aufgerufen wenn User von Stripe zurückkommt
  useEffect(() => {
    if (paymentHandledRef.current) return;
    
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      paymentHandledRef.current = true;
      console.log('[Onboarding] Payment success detected, session:', sessionId);
      
      // Toast anzeigen
      toast.success('Zahlung erfolgreich! 🎉');
      
      // Bestellungen neu laden (Webhook hat DB aktualisiert)
      refetchOrders();
      
      // Stelle sicher dass wir auf dem Bestellungen-Schritt sind
      if (state.currentStep !== 'bestellungen') {
        goToStep('bestellungen');
      }
      
      // URL-Parameter entfernen (saubere URL)
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      paymentHandledRef.current = true;
      toast.info('Zahlung abgebrochen');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refetchOrders, state.currentStep, goToStep]);

  const [selectedCoachingSlot, setSelectedCoachingSlot] = useState<string | undefined>();
  const [coachingSlots, setCoachingSlots] = useState<CoachingSlot[]>(MOCK_COACHING_SLOTS);

  // Handle completed unterpunkt from AkademieModul page navigation
  useEffect(() => {
    const navState = location.state as { 
      completedHauptmodulId?: string;
      completedUnterpunktId?: string;
      // Legacy support
      completedModuleId?: string;
    } | null;
    
    if (navState?.completedHauptmodulId && navState?.completedUnterpunktId) {
      // Neue hierarchische Struktur
      completeAkademieUnterpunkt(navState.completedHauptmodulId, navState.completedUnterpunktId);
      toast.success('Unterpunkt abgeschlossen!');
      goToStep('akademie');
      navigate('/', { replace: true, state: {} });
    } else if (navState?.completedModuleId) {
      // Legacy support
      completeAkademieModul(navState.completedModuleId);
      toast.success('Modul abgeschlossen!');
      goToStep('akademie');
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, completeAkademieModul, completeAkademieUnterpunkt, goToStep, navigate]);

  // DB ist die Single Source of Truth für "einsatzbereit"
  const isDbReady = dbStatus?.onboardingStatus === 'ready' && dbStatus?.trainerFreigabe === true;
  
  // Hinweis: dbShowsNoProgress wird bereits oben definiert (Zeile 58)

  // Wenn abgeschlossen, zeige Complete-Screen oder Warte-auf-Freigabe
  if (isComplete) {
    if (isPreview) {
      toast.success('Vorschau beendet');
      onExitPreview?.();
      return null;
    }
    
    // Nur Complete-Screen wenn DB auch "ready" sagt
    if (isDbReady) {
      return <OnboardingComplete onContinue={onComplete} />;
    }
    
    // localStorage sagt complete, aber DB noch nicht ready → Warte auf Freigabe
    return <WaitingForApproval />;
  }

  const currentStepConfig = ONBOARDING_STEPS.find(s => s.id === state.currentStep);

  // Handler für File-Uploads
  const handleAvatarUpload = async (file: File) => {
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      toast.success('Profilbild hochgeladen');
    } catch (error) {
      console.error('[Onboarding] Avatar upload failed:', error);
      toast.error('Fehler beim Hochladen des Profilbilds');
    }
  };

  const handleGewerbescheinUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setGewerbescheinUrl(url);
    toast.success('Gewerbeschein hochgeladen');
  };

  const handleGesamtfotoUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setGesamtfotoUrl(url);
    toast.success('Foto hochgeladen');
  };

  const handleProductOrder = (productId: string) => {
    toggleProductOrdered(productId);
    toast.success('Produkt als bestellt markiert');
  };

  const handleStartModule = (moduleId: string) => {
    // In Production würde hier ein Video-Player geöffnet
    toast.info('Video wird gestartet...');
    // Simuliere Abschluss nach 2 Sekunden
    setTimeout(() => {
      completeAkademieModul(moduleId);
      toast.success('Modul abgeschlossen!');
    }, 2000);
  };

  const handleStartTest = () => {
    toast.info('Abschlusstest wird gestartet...');
    // Simuliere bestandenen Test
    setTimeout(() => {
      setAkademieTestBestanden(true);
      toast.success('Test bestanden! 🎉');
    }, 2000);
  };

  const handleBookCoaching = () => {
    if (!selectedCoachingSlot) return;
    
    setCoachingSlots(prev => prev.map(s => 
      s.id === selectedCoachingSlot 
        ? { ...s, gebucht: true }
        : s
    ));
    setGebuchterCoachingSlot(selectedCoachingSlot);
    setCoachingAbgeschlossen(true);
    toast.success('Coaching-Termin gebucht!');
  };

  const handleNext = async () => {
    if (nextClickLockRef.current) return;
    nextClickLockRef.current = true;
    setIsAdvancing(true);

    // Bei Profil-Schritt: Validierung + DB speichern
    if (state.currentStep === 'profil') {
      // Validiere Pflichtfelder inkl. Adresse
      if (
        !state.profil.strasse?.trim() ||
        !state.profil.hausnummer?.trim() ||
        !state.profil.plz?.trim() ||
        !state.profil.ort?.trim()
      ) {
        toast.error('Bitte fülle deine vollständige Adresse aus');
        nextClickLockRef.current = false;
        setIsAdvancing(false);
        return;
      }

      try {
        await saveProfileToDb(state.profil);
        toast.success('Profildaten gespeichert');
      } catch (error) {
        console.error('[Onboarding] Failed to save profile:', error);
        toast.error('Fehler beim Speichern der Profildaten');
        nextClickLockRef.current = false;
        setIsAdvancing(false);
        return; // Nicht weiter navigieren bei Fehler
      }
    }

    if (state.currentStep === 'coaching' && state.coachingAbgeschlossen) {
      // Onboarding abgeschlossen
      nextClickLockRef.current = false;
      setIsAdvancing(false);
      return;
    }

    goToNextStep();
  };

  const getNextLabel = () => {
    switch (state.currentStep) {
      case 'profil':
        return 'Weiter zu Dokumente';
      case 'dokumente':
        return 'Weiter zu Bestellungen';
      case 'bestellungen':
        return 'Weiter zu Equipment';
      case 'equipment':
        return 'Jetzt zur Akademie';
      case 'akademie':
        return 'Weiter zu Nachweise';
      case 'nachweise':
        return 'Weiter zu Coaching';
      case 'coaching':
        return 'Onboarding abschließen';
      default:
        return 'Weiter';
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 'profil':
        return (
          <ProfileStep
            profile={state.profil}
            onProfileChange={updateProfile}
            onAvatarUpload={handleAvatarUpload}
          />
        );

      case 'dokumente':
        return (
          <DocumentsStep
            gewerbescheinUrl={state.gewerbescheinUrl}
            gewerbescheinSpaeter={state.gewerbescheinSpaeter}
            onGewerbescheinUpload={handleGewerbescheinUpload}
            onRemoveGewerbeschein={() => {
              setGewerbescheinUrl(undefined);
              setGewerbescheinSpaeter(false);
            }}
            onGewerbescheinSpaeter={() => setGewerbescheinSpaeter(true)}
          />
        );

      case 'bestellungen':
        return (
          <OrdersStep
            products={MOCK_PRODUCTS}
            orderedProducts={state.bestellungenBestaetigt}
            onProductOrder={handleProductOrder}
            oberteilAuswahl={state.oberteilAuswahl}
            onOberteilAuswahl={setOberteilAuswahl}
          />
        );

      case 'equipment': {
        const drohneItem = MOCK_EQUIPMENT.find(e => e.id === 'drohne');
        const iPhoneItem = MOCK_EQUIPMENT.find(e => e.id === 'iphone-lidar');
        return (
          <EquipmentStep
            drohneStatus={state.equipmentStatus['drohne'] || { hatEigenes: false }}
            iphoneStatus={state.equipmentStatus['iphone-lidar'] || { hatEigenes: false }}
            onDrohneChange={(status) => updateEquipmentStatus('drohne', status)}
            onIphoneChange={(status) => updateEquipmentStatus('iphone-lidar', status)}
            drohneMietLink={drohneItem?.mietLink}
            drohneKaufLink={drohneItem?.kaufLink}
            iPhoneMietLink={iPhoneItem?.mietLink}
            iPhoneKaufLink={iPhoneItem?.kaufLink}
          />
        );
      }

      case 'akademie':
        return (
          <AcademyStep
            hauptmodule={state.akademieHauptmodule}
            onUnterpunktComplete={completeAkademieUnterpunkt}
            testBestanden={state.akademieTestBestanden}
            onStartTest={handleStartTest}
          />
        );

      case 'nachweise':
        return (
          <ProofStep
            checkliste={state.ausstattungCheckliste}
            onChecklistChange={updateCheckliste}
            gesamtfotoUrl={state.gesamtfotoUrl}
            onGesamtfotoUpload={handleGesamtfotoUpload}
            onRemoveGesamtfoto={() => setGesamtfotoUrl(undefined)}
          />
        );

      case 'coaching':
        return (
          <CoachingStep
            slots={coachingSlots}
            selectedSlotId={selectedCoachingSlot}
            onSelectSlot={setSelectedCoachingSlot}
            onBookSlot={handleBookCoaching}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Vorschau-Modus – Änderungen werden nicht gespeichert
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExitPreview}
            className="text-amber-800 hover:bg-amber-200/50 h-7 px-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <OnboardingStepWrapper
        currentStep={state.currentStep}
        completedSteps={state.completedSteps}
        title={currentStepConfig?.label || ''}
        description={currentStepConfig?.description}
        onBack={isPreview ? onExitPreview : goToPreviousStep}
        onNext={handleNext}
        nextLabel={getNextLabel()}
        nextDisabled={!canProceed || isAdvancing}
        progress={progress}
      >
        {renderStep()}
      </OnboardingStepWrapper>
    </div>
  );
}
