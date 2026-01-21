import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { useState } from 'react';
import { CoachingSlot } from '@/types/onboarding';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
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
    toggleProductOrdered,
    updateEquipmentStatus,
    completeAkademieModul,
    setAkademieTestBestanden,
    updateCheckliste,
    setGesamtfotoUrl,
    setGebuchterCoachingSlot,
    setCoachingAbgeschlossen,
  } = useOnboardingState(MOCK_APPLICANT_PROFILE);

  const [selectedCoachingSlot, setSelectedCoachingSlot] = useState<string | undefined>();
  const [coachingSlots, setCoachingSlots] = useState<CoachingSlot[]>(MOCK_COACHING_SLOTS);

  // Handle completed module from AkademieModul page navigation
  useEffect(() => {
    const navState = location.state as { completedModuleId?: string } | null;
    if (navState?.completedModuleId) {
      completeAkademieModul(navState.completedModuleId);
      toast.success('Modul abgeschlossen!');
      // Stay on akademie step
      goToStep('akademie');
      // Clear the navigation state to prevent re-processing
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, completeAkademieModul, goToStep, navigate]);

  // Wenn abgeschlossen, zeige Complete-Screen
  if (isComplete) {
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
            onGewerbescheinUpload={handleGewerbescheinUpload}
            onRemoveGewerbeschein={() => setGewerbescheinUrl(undefined)}
          />
        );

      case 'bestellungen':
        return (
          <OrdersStep
            products={MOCK_PRODUCTS}
            orderedProducts={state.bestellungenBestaetigt}
            onProductOrder={handleProductOrder}
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
            module={state.akademieModule}
            onModuleComplete={completeAkademieModul}
            onStartModule={handleStartModule}
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
    <OnboardingStepWrapper
      currentStep={state.currentStep}
      completedSteps={state.completedSteps}
      title={currentStepConfig?.label || ''}
      description={currentStepConfig?.description}
      onBack={goToPreviousStep}
      onNext={handleNext}
      nextLabel={getNextLabel()}
      nextDisabled={!canProceed}
      progress={progress}
    >
      {renderStep()}
    </OnboardingStepWrapper>
  );
}
