import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { 
  MOCK_PRODUCTS, 
  MOCK_COACHING_SLOTS,
  MOCK_EQUIPMENT,
  ONBOARDING_STEPS,
  createInitialOnboardingState,
} from '@/lib/onboarding-config';
import { CoachingSlot, ApplicantProfile } from '@/types/onboarding';
import { Button } from '@/components/ui/button';

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
  const hasHydratedRef = useRef(false);
  
  // KRITISCH: Prüfe ob localStorage-Fortschritt ignoriert werden muss
  // weil DB sagt "invited" (kein echter Fortschritt vorhanden)
  const dbShowsNoProgress = dbStatus?.onboardingStatus === 'invited';
  const [forceReset, setForceReset] = useState(false);
  
  // Wenn DB "invited" sagt, aber localStorage möglicherweise alten Fortschritt hat
  // → State ohne Reload zurücksetzen
  useEffect(() => {
    if (dbShowsNoProgress && !forceReset && !isPreview) {
      console.log('[Onboarding] DB says invited - checking localStorage for stale data...');
      const savedState = localStorage.getItem('thermocheck_onboarding_state_v2');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // Wenn localStorage "complete" Zustand zeigt, aber DB sagt "invited" → Reset
          if (parsed.coachingAbgeschlossen || (parsed.completedSteps?.length || 0) > 0) {
            console.warn('[Onboarding] Stale localStorage detected - forcing reset');
            clearOnboardingLocalStorage();
            setForceReset(true);
          }
        } catch (e) {
          // Kaputtes JSON → auch resetten
          clearOnboardingLocalStorage();
          setForceReset(true);
        }
      }
    }
  }, [dbShowsNoProgress, forceReset, isPreview]);
  
  // Profildaten aus DB laden (SSoT: public.profiles + thermocheck.contractor_onboarding)
  const { 
    data: dbProfile, 
    isLoading: profileLoading,
    updateProfile: saveProfileToDb,
    uploadAvatar,
  } = useContractorProfile(dbStatus?.profileId || null);
  
  // Initial-Profil: DB-Daten oder leeres Fallback
  const initialProfile: ApplicantProfile = dbProfile || EMPTY_PROFILE;
  
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
  
  // Sync DB-Profil in State wenn geladen - intelligentes Merging
  useEffect(() => {
    if (!profileLoading && dbProfile) {
      // Prüfe ob wichtige DB-Felder fehlen im State
      const stateHasNoAvatar = !state.profil.avatarUrl;
      const dbHasAvatar = !!dbProfile.avatarUrl;
      
      // Hydrate wenn State leer ODER wenn DB wichtige Daten hat die im State fehlen
      if (state.profil.id === '' || (stateHasNoAvatar && dbHasAvatar)) {
        console.log('[Onboarding] Hydrating profile from DB:', {
          reason: state.profil.id === '' ? 'empty_state' : 'missing_avatar',
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
    // Bei Profil-Schritt: Validierung + DB speichern
    if (state.currentStep === 'profil') {
      // Validiere Pflichtfelder inkl. Adresse
      if (!state.profil.strasse?.trim() || !state.profil.plz?.trim() || !state.profil.ort?.trim()) {
        toast.error('Bitte fülle deine vollständige Adresse aus');
        return;
      }
      
      try {
        await saveProfileToDb(state.profil);
        toast.success('Profildaten gespeichert');
      } catch (error) {
        console.error('[Onboarding] Failed to save profile:', error);
        toast.error('Fehler beim Speichern der Profildaten');
        return; // Nicht weiter navigieren bei Fehler
      }
    }
    
    if (state.currentStep === 'coaching' && state.coachingAbgeschlossen) {
      // Onboarding abgeschlossen
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
        nextDisabled={!canProceed}
        progress={progress}
      >
        {renderStep()}
      </OnboardingStepWrapper>
    </div>
  );
}
