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
    profileId?: string;
    erstelltAm?: string;
  };
}

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
  const hasHydratedOnboardingStateRef = useRef(false);
  const nextClickLockRef = useRef(false);
  const paymentHandledRef = useRef(false);

  const [isAdvancing, setIsAdvancing] = useState(false);

  // KRITISCH: Payment-Success in URL? Dann NIEMALS forceReset!
  const hasPaymentSuccess = searchParams.get('payment') === 'success';

  const dbShowsNoProgress = dbStatus?.onboardingStatus === 'invited';
  const [forceReset, setForceReset] = useState(false);

  // ForceReset-Logik: Nur bei wirklich unmöglichem Zustand UND NICHT bei payment=success
  useEffect(() => {
    const profileId = dbStatus?.profileId;
    if (!profileId || !dbShowsNoProgress || forceReset || isPreview || hasPaymentSuccess) return;

    const storageKey = getOnboardingStorageKey(profileId);
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return;

    try {
      const parsed = JSON.parse(savedState);

      // Nur bei WIRKLICH unmöglichem Zustand resetten
      // (coaching abgeschlossen bei DB "invited" = definitiv veralteter State eines anderen Users)
      const isDefinitelyStale =
        parsed.coachingAbgeschlossen === true ||
        parsed.akademieTestBestanden === true;

      if (isDefinitelyStale) {
        console.warn('[Onboarding] Stale localStorage detected (DB invited + coaching/test done) - forcing reset');
        clearOnboardingLocalStorage(profileId);
        setForceReset(true);
      }
    } catch {
      clearOnboardingLocalStorage(profileId);
      setForceReset(true);
    }
  }, [dbShowsNoProgress, forceReset, isPreview, dbStatus?.profileId, hasPaymentSuccess]);

  // Profildaten aus DB laden
  const {
    data: dbProfile,
    isLoading: profileLoading,
    updateProfile: saveProfileToDb,
    uploadAvatar,
    uploadGewerbeschein,
    saveGewerbeschein,
    saveProgress,
    onboardingState: dbOnboardingState,
    isOnboardingStateLoaded,
  } = useContractorProfile(dbStatus?.profileId || null);

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
    setBestellungenFromDb,
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

  // Hydrate Onboarding-State aus DB (Gewerbeschein + Fortschritt)
  useEffect(() => {
    if (isPreview || hasHydratedOnboardingStateRef.current || !isOnboardingStateLoaded || !dbOnboardingState) return;
    hasHydratedOnboardingStateRef.current = true;

    console.log('[Onboarding] Hydrating onboarding state from DB:', dbOnboardingState);

    // Gewerbeschein-Daten
    if (dbOnboardingState.gewerbescheinUrl) {
      setGewerbescheinUrl(dbOnboardingState.gewerbescheinUrl);
    }
    if (dbOnboardingState.gewerbescheinSpaeter) {
      setGewerbescheinSpaeter(true);
    }

    // Fortschritt aus DB (hat Vorrang vor localStorage)
    if (dbOnboardingState.currentStep) {
      goToStep(dbOnboardingState.currentStep);
    }
    if (dbOnboardingState.completedSteps && dbOnboardingState.completedSteps.length > 0) {
      // completedSteps werden über goToStep + state merge angewendet
      // Wir setzen sie direkt via den State
      dbOnboardingState.completedSteps.forEach(step => {
        if (!state.completedSteps.includes(step)) {
          // goToStep doesn't set completedSteps, so we need to use the hook differently
          // For now, we let the existing localStorage merge handle this
        }
      });
    }
  }, [isPreview, isOnboardingStateLoaded, dbOnboardingState, setGewerbescheinUrl, setGewerbescheinSpaeter, goToStep, state.completedSteps]);

  // Sync DB-Profil in State wenn geladen
  useEffect(() => {
    if (!profileLoading && dbProfile) {
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

      if (
        state.profil.id === '' ||
        (stateHasNoAvatar && dbHasAvatar) ||
        (stateMissingAddress && dbHasAddress)
      ) {
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
  
  // Fetch akademie content from database
  const { data: dbAkademieModule, isSuccess: dbLoaded } = useAkademieContent();
  
  useEffect(() => {
    if (isPreview || hasHydratedRef.current) return;
    if (!dbLoaded || !dbAkademieModule || dbAkademieModule.length === 0) return;
    
    hasHydratedRef.current = true;
    hydrateAkademieFromDb(dbAkademieModule);
  }, [dbLoaded, dbAkademieModule, isPreview, hydrateAkademieFromDb]);

  // Bestellungen aus DB laden
  const { 
    data: dbOrders, 
    refetchOrders,
    isSuccess: ordersLoaded,
  } = useContractorOrders(dbStatus?.profileId || null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync bezahlte Bestellungen in den State (DB ist SSOT)
  useEffect(() => {
    if (!ordersLoaded || !dbOrders) return;
    
    const paidKeys = getPaidProductKeys(dbOrders);
    
    // Replace komplett – DB ist die einzige Wahrheitsquelle
    const currentKeys = state.bestellungenBestaetigt.slice().sort().join(',');
    const dbKeysStr = paidKeys.slice().sort().join(',');
    
    if (currentKeys !== dbKeysStr) {
      console.log('[Onboarding] Replacing bestellungenBestaetigt with DB values:', paidKeys);
      setBestellungenFromDb(paidKeys);
    }
  }, [ordersLoaded, dbOrders, state.bestellungenBestaetigt, setBestellungenFromDb]);

  // Polling nach Stripe-Checkout
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (state.currentStep !== 'bestellungen') return;

    const hasPendingOrders = dbOrders?.some(
      order => order.stripe_payment_status === 'pending'
    );

    if (!hasPendingOrders) return;

    console.log('[Onboarding] Starting payment polling (pending orders detected)');
    
    pollingRef.current = setInterval(() => {
      refetchOrders();
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [state.currentStep, dbOrders, refetchOrders]);

  // Payment Success Handler – IMMER Priorität über DB-Hydration
  useEffect(() => {
    if (paymentHandledRef.current) return;
    
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      paymentHandledRef.current = true;
      console.log('[Onboarding] Payment success detected, session:', sessionId);
      
      toast.success('Zahlung erfolgreich! 🎉');
      refetchOrders();
      
      // IMMER auf bestellungen setzen – egal was DB-Hydration sagt
      goToStep('bestellungen');
      
      setSearchParams({}, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      paymentHandledRef.current = true;
      toast.info('Zahlung abgebrochen');
      goToStep('bestellungen');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refetchOrders, goToStep]);

  const [selectedCoachingSlot, setSelectedCoachingSlot] = useState<string | undefined>();
  const [coachingSlots, setCoachingSlots] = useState<CoachingSlot[]>(MOCK_COACHING_SLOTS);

  // Handle completed unterpunkt from AkademieModul page navigation
  useEffect(() => {
    const navState = location.state as { 
      completedHauptmodulId?: string;
      completedUnterpunktId?: string;
      completedModuleId?: string;
    } | null;
    
    if (navState?.completedHauptmodulId && navState?.completedUnterpunktId) {
      completeAkademieUnterpunkt(navState.completedHauptmodulId, navState.completedUnterpunktId);
      toast.success('Unterpunkt abgeschlossen!');
      goToStep('akademie');
      navigate('/', { replace: true, state: {} });
    } else if (navState?.completedModuleId) {
      completeAkademieModul(navState.completedModuleId);
      toast.success('Modul abgeschlossen!');
      goToStep('akademie');
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, completeAkademieModul, completeAkademieUnterpunkt, goToStep, navigate]);

  const isDbReady = dbStatus?.onboardingStatus === 'ready' && dbStatus?.trainerFreigabe === true;

  if (isComplete) {
    if (isPreview) {
      toast.success('Vorschau beendet');
      onExitPreview?.();
      return null;
    }
    
    if (isDbReady) {
      return <OnboardingComplete onContinue={onComplete} />;
    }
    
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

  const handleGewerbescheinUpload = async (file: File) => {
    try {
      const url = await uploadGewerbeschein(file);
      setGewerbescheinUrl(url);
      toast.success('Gewerbeschein hochgeladen');
    } catch (error) {
      console.error('[Onboarding] Gewerbeschein upload failed:', error);
      toast.error('Fehler beim Hochladen des Gewerbescheins');
    }
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
    toast.info('Video wird gestartet...');
    setTimeout(() => {
      completeAkademieModul(moduleId);
      toast.success('Modul abgeschlossen!');
    }, 2000);
  };

  const handleStartTest = () => {
    toast.info('Abschlusstest wird gestartet...');
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
        return;
      }
    }

    // Bei Dokumente-Schritt: Gewerbeschein-Daten in DB speichern
    if (state.currentStep === 'dokumente') {
      try {
        await saveGewerbeschein({
          url: state.gewerbescheinUrl || undefined,
          spaeter: state.gewerbescheinSpaeter || false,
        });
        console.log('[Onboarding] Gewerbeschein data saved to DB');
      } catch (error) {
        console.warn('[Onboarding] Failed to save Gewerbeschein data:', error);
        // Nicht blockieren - kann später nachgeholt werden
      }
    }

    if (state.currentStep === 'coaching' && state.coachingAbgeschlossen) {
      nextClickLockRef.current = false;
      setIsAdvancing(false);
      return;
    }

    goToNextStep();

    // Fortschritt in DB speichern (async, non-blocking)
    try {
      const nextCompletedSteps = state.completedSteps.includes(state.currentStep)
        ? state.completedSteps
        : [...state.completedSteps, state.currentStep];
      
      const nextStepIndex = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'nachweise', 'coaching'].indexOf(state.currentStep);
      const nextStep = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'nachweise', 'coaching'][nextStepIndex + 1];
      
      if (nextStep) {
        await saveProgress({
          currentStep: nextStep,
          completedSteps: nextCompletedSteps,
        });
        console.log('[Onboarding] Progress saved to DB:', nextStep);
      }
    } catch (error) {
      console.warn('[Onboarding] Failed to save progress to DB:', error);
    }
  };

  const getNextLabel = () => {
    switch (state.currentStep) {
      case 'profil': return 'Weiter zu Dokumente';
      case 'dokumente': return 'Weiter zu Bestellungen';
      case 'bestellungen': return 'Weiter zu Equipment';
      case 'equipment': return 'Jetzt zur Akademie';
      case 'akademie': return 'Weiter zu Nachweise';
      case 'nachweise': return 'Weiter zu Coaching';
      case 'coaching': return 'Onboarding abschließen';
      default: return 'Weiter';
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
            isLoadingOrders={!ordersLoaded}
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
        erstelltAm={isPreview ? undefined : dbStatus?.erstelltAm}
      >
        {renderStep()}
      </OnboardingStepWrapper>
    </div>
  );
}
