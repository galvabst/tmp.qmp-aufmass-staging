import { useEffect, useState } from 'react';
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
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { 
  MOCK_PRODUCTS, 
  MOCK_COACHING_SLOTS,
  MOCK_APPLICANT_PROFILE,
  MOCK_EQUIPMENT,
  ONBOARDING_STEPS,
} from '@/lib/onboarding-config';
import { CoachingSlot } from '@/types/onboarding';
import { Button } from '@/components/ui/button';

interface OnboardingScreenProps {
  onComplete: () => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
}

export function OnboardingScreen({ onComplete, isPreview = false, onExitPreview }: OnboardingScreenProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
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
  } = useOnboardingState(MOCK_APPLICANT_PROFILE, isPreview);

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

  // Wenn abgeschlossen, zeige Complete-Screen
  if (isComplete) {
    if (isPreview) {
      toast.success('Vorschau beendet');
      onExitPreview?.();
      return null;
    }
    return <OnboardingComplete onContinue={onComplete} />;
  }

  const currentStepConfig = ONBOARDING_STEPS.find(s => s.id === state.currentStep);

  // Handler für File-Uploads (Mock)
  const handleAvatarUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
    toast.success('Profilbild hochgeladen');
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

  const handleNext = () => {
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
