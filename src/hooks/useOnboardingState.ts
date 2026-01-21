import { useState, useCallback } from 'react';
import { 
  OnboardingState, 
  OnboardingStepId, 
  ApplicantProfile,
  AkademieModul,
  STEP_ORDER,
  getNextStep,
  getPreviousStep,
} from '@/types/onboarding';
import { 
  createInitialOnboardingState, 
  calculateOnboardingProgress,
  MOCK_AKADEMIE_MODULE,
} from '@/lib/onboarding-config';

export function useOnboardingState(initialProfile: ApplicantProfile) {
  const [state, setState] = useState<OnboardingState>(() => 
    createInitialOnboardingState(initialProfile)
  );

  // Navigation
  const goToNextStep = useCallback(() => {
    setState(prev => {
      const nextStep = getNextStep(prev.currentStep);
      if (!nextStep) return prev;
      
      return {
        ...prev,
        currentStep: nextStep,
        completedSteps: prev.completedSteps.includes(prev.currentStep)
          ? prev.completedSteps
          : [...prev.completedSteps, prev.currentStep],
      };
    });
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => {
      const previousStep = getPreviousStep(prev.currentStep);
      if (!previousStep) return prev;
      return { ...prev, currentStep: previousStep };
    });
  }, []);

  const goToStep = useCallback((step: OnboardingStepId) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  // Schritt 1: Profil
  const updateProfile = useCallback((profile: ApplicantProfile) => {
    setState(prev => ({ ...prev, profil: profile }));
  }, []);

  const setProfilBestaetigt = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, profilBestaetigt: value }));
  }, []);

  const setAvatarUrl = useCallback((url: string) => {
    setState(prev => ({
      ...prev,
      profil: { ...prev.profil, avatarUrl: url },
    }));
  }, []);

  // Schritt 2: Dokumente
  const setGewerbescheinUrl = useCallback((url: string | undefined) => {
    setState(prev => ({ ...prev, gewerbescheinUrl: url }));
  }, []);

  // Schritt 3: Bestellungen
  const toggleProductOrdered = useCallback((productId: string) => {
    setState(prev => {
      const isOrdered = prev.bestellungenBestaetigt.includes(productId);
      return {
        ...prev,
        bestellungenBestaetigt: isOrdered
          ? prev.bestellungenBestaetigt.filter(id => id !== productId)
          : [...prev.bestellungenBestaetigt, productId],
      };
    });
  }, []);

  // Schritt 4: Equipment
  const updateEquipmentStatus = useCallback((
    equipmentId: string, 
    status: { hatEigenes: boolean; nachweisUrl?: string }
  ) => {
    setState(prev => ({
      ...prev,
      equipmentStatus: {
        ...prev.equipmentStatus,
        [equipmentId]: status,
      },
    }));
  }, []);

  // Schritt 5: Akademie
  const completeAkademieModul = useCallback((modulId: string) => {
    setState(prev => ({
      ...prev,
      akademieModule: prev.akademieModule.map(m =>
        m.id === modulId
          ? { ...m, abgeschlossen: true, abgeschlossenAt: new Date().toISOString() }
          : m
      ),
    }));
  }, []);

  const setAkademieTestBestanden = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, akademieTestBestanden: value }));
  }, []);

  // Schritt 6: Nachweise
  const updateCheckliste = useCallback((key: string, value: boolean) => {
    setState(prev => ({
      ...prev,
      ausstattungCheckliste: {
        ...prev.ausstattungCheckliste,
        [key]: value,
      },
    }));
  }, []);

  const setGesamtfotoUrl = useCallback((url: string | undefined) => {
    setState(prev => ({ ...prev, gesamtfotoUrl: url }));
  }, []);

  // Schritt 7: Coaching
  const setGebuchterCoachingSlot = useCallback((slotId: string | undefined) => {
    setState(prev => ({ ...prev, gebuchterCoachingSlot: slotId }));
  }, []);

  const setCoachingAbgeschlossen = useCallback((value: boolean) => {
    setState(prev => ({ 
      ...prev, 
      coachingAbgeschlossen: value,
      completedAt: value ? new Date().toISOString() : undefined,
    }));
  }, []);

  // Berechnete Werte
  const progress = calculateOnboardingProgress(state);
  
  const isStepComplete = useCallback((step: OnboardingStepId): boolean => {
    switch (step) {
      case 'profil':
        return !!(
          state.profil.vorname &&
          state.profil.nachname &&
          state.profil.email &&
          state.profil.avatarUrl
        );
      case 'dokumente':
        return !!state.gewerbescheinUrl;
      case 'bestellungen':
        // Alle Pflichtprodukte müssen bestellt sein
        return state.bestellungenBestaetigt.length >= 3; // Anpassen basierend auf Pflichtprodukten
      case 'equipment':
        const drohne = state.equipmentStatus['drohne'];
        const iphone = state.equipmentStatus['iphone-lidar'];
        return !!(
          (drohne?.hatEigenes && drohne?.nachweisUrl) || (drohne?.hatEigenes === false)
        ) && !!(iphone?.hatEigenes);
      case 'akademie':
        return state.akademieTestBestanden;
      case 'nachweise':
        return !!(
          Object.values(state.ausstattungCheckliste).every(Boolean) &&
          state.gesamtfotoUrl
        );
      case 'coaching':
        return state.coachingAbgeschlossen;
      default:
        return false;
    }
  }, [state]);

  const canProceed = isStepComplete(state.currentStep);
  const isComplete = state.completedSteps.length === STEP_ORDER.length || state.coachingAbgeschlossen;

  return {
    state,
    progress,
    canProceed,
    isComplete,
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,
    
    // Schritt 1
    updateProfile,
    setProfilBestaetigt,
    setAvatarUrl,
    
    // Schritt 2
    setGewerbescheinUrl,
    
    // Schritt 3
    toggleProductOrdered,
    
    // Schritt 4
    updateEquipmentStatus,
    
    // Schritt 5
    completeAkademieModul,
    setAkademieTestBestanden,
    
    // Schritt 6
    updateCheckliste,
    setGesamtfotoUrl,
    
    // Schritt 7
    setGebuchterCoachingSlot,
    setCoachingAbgeschlossen,
    
    // Helpers
    isStepComplete,
  };
}
