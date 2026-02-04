import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  OnboardingState, 
  OnboardingStepId, 
  ApplicantProfile,
  AkademieModul,
  AkademieHauptmodul,
  OberteilAuswahl,
  STEP_ORDER,
  getNextStep,
  getPreviousStep,
} from '@/types/onboarding';
import { 
  createInitialOnboardingState, 
  calculateOnboardingProgress,
} from '@/lib/onboarding-config';
import { isUuid } from '@/lib/utils';
import { useAkademieContent } from '@/hooks/useAkademieContent';

const STORAGE_KEY = 'thermocheck_onboarding_state_v2';

/**
 * Validate if akademieHauptmodule contains valid UUIDs
 * Returns false if any ID is not a UUID (legacy mock data)
 */
function hasValidAkademieIds(hauptmodule: AkademieHauptmodul[] | undefined): boolean {
  if (!hauptmodule || hauptmodule.length === 0) return false;
  
  // Check all hauptmodul IDs and their unterpunkte IDs
  return hauptmodule.every(hm => {
    if (!isUuid(hm.id)) return false;
    const unterpunkte = hm.unterpunkte || [];
    return unterpunkte.every(up => isUuid(up.id));
  });
}

const loadPersistedState = (initialProfile: ApplicantProfile): OnboardingState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<OnboardingState>;
      const initial = createInitialOnboardingState(initialProfile);
      
      // Check if akademie data has valid UUIDs - if not, reset it
      const hasValidAkademie = hasValidAkademieIds(parsed.akademieHauptmodule);
      
      if (!hasValidAkademie && parsed.akademieHauptmodule?.length) {
        console.log('[Onboarding] Legacy akademie IDs detected, resetting akademie data...');
      }
      
      // Merge mit initialem State um fehlende Felder zu ergänzen
      return {
        ...initial,
        ...parsed,
        // Reset akademie if legacy IDs detected, otherwise keep persisted
        akademieHauptmodule: hasValidAkademie 
          ? parsed.akademieHauptmodule! 
          : [], // Empty array triggers DB hydration
        // Legacy akademieModule - also reset if needed
        akademieModule: [],
      };
    }
  } catch (e) {
    console.warn('Failed to load onboarding state from localStorage', e);
  }
  return createInitialOnboardingState(initialProfile);
};

export function useOnboardingState(
  initialProfile: ApplicantProfile,
  isPreview: boolean = false
) {
  const [state, setState] = useState<OnboardingState>(() => 
    isPreview 
      ? createInitialOnboardingState(initialProfile)
      : loadPersistedState(initialProfile)
  );
  
  // Track if we've already hydrated from DB to prevent loops
  const hasHydratedRef = useRef(false);
  
  // Fetch akademie content from database
  const { data: dbAkademieModule, isSuccess: dbLoaded } = useAkademieContent();

  // Hydrate akademie state from database when loaded
  useEffect(() => {
    if (isPreview || hasHydratedRef.current) return;
    if (!dbLoaded || !dbAkademieModule || dbAkademieModule.length === 0) return;
    
    const currentHauptmodule = state.akademieHauptmodule || [];
    const hasValidIds = hasValidAkademieIds(currentHauptmodule);
    
    // Only hydrate if: empty, or IDs mismatch (schema changed)
    const dbIds = dbAkademieModule.flatMap(m => [m.id, ...m.unterpunkte.map(u => u.id)]).sort().join(',');
    const stateIds = currentHauptmodule.flatMap(m => [m.id, ...(m.unterpunkte || []).map(u => u.id)]).sort().join(',');
    
    if (currentHauptmodule.length === 0 || !hasValidIds || dbIds !== stateIds) {
      console.log('[Onboarding] Hydrating akademie from database...');
      
      // Merge: use DB structure but preserve local progress
      const mergedModules = dbAkademieModule.map(dbHm => {
        const existingHm = currentHauptmodule.find(h => h.id === dbHm.id);
        return {
          ...dbHm,
          unterpunkte: dbHm.unterpunkte.map(dbUp => {
            const existingUp = existingHm?.unterpunkte?.find(u => u.id === dbUp.id);
            return {
              ...dbUp,
              abgeschlossen: existingUp?.abgeschlossen || false,
              abgeschlossenAt: existingUp?.abgeschlossenAt,
            };
          }),
        };
      });
      
      hasHydratedRef.current = true;
      setState(prev => ({
        ...prev,
        akademieHauptmodule: mergedModules,
      }));
    } else {
      hasHydratedRef.current = true;
    }
  }, [dbLoaded, dbAkademieModule, state.akademieHauptmodule, isPreview]);

  // Persist state to localStorage on every change (only if not in preview mode)
  useEffect(() => {
    if (isPreview) return; // Don't persist in preview mode
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save onboarding state to localStorage', e);
    }
  }, [state, isPreview]);

  // Reset state when entering preview mode
  useEffect(() => {
    if (isPreview) {
      hasHydratedRef.current = false;
      setState(createInitialOnboardingState(initialProfile));
    }
  }, [isPreview, initialProfile]);

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
    setState(prev => ({ ...prev, gewerbescheinUrl: url, gewerbescheinSpaeter: false }));
  }, []);

  const setGewerbescheinSpaeter = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, gewerbescheinSpaeter: value }));
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

  const setOberteilAuswahl = useCallback((auswahl: OberteilAuswahl) => {
    setState(prev => ({ ...prev, oberteilAuswahl: auswahl }));
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

  // Schritt 5: Akademie (Legacy)
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

  // Schritt 5: Akademie (NEU: Hierarchische Struktur)
  const completeAkademieUnterpunkt = useCallback((hauptmodulId: string, unterpunktId: string) => {
    setState(prev => ({
      ...prev,
      akademieHauptmodule: prev.akademieHauptmodule.map(hm =>
        hm.id === hauptmodulId
          ? {
              ...hm,
              unterpunkte: hm.unterpunkte.map(up =>
                up.id === unterpunktId
                  ? { ...up, abgeschlossen: true, abgeschlossenAt: new Date().toISOString() }
                  : up
              ),
            }
          : hm
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
        // Preview-Modus: Profil-Validierung überspringen
        if (isPreview) return true;
        return !!(
          state.profil.vorname &&
          state.profil.nachname &&
          state.profil.email &&
          state.profil.avatarUrl
        );
      case 'dokumente':
        // Preview-Modus: Dokumente-Validierung überspringen
        if (isPreview) return true;
        return !!(state.gewerbescheinUrl || state.gewerbescheinSpaeter);
      case 'bestellungen':
        // Preview-Modus: Bestellungen-Validierung überspringen (für Development)
        if (isPreview) return true;
        const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6;
        return state.bestellungenBestaetigt.length >= requiredCount;
      case 'equipment':
        if (isPreview) return true;
        const drohne = state.equipmentStatus['drohne'];
        const iphone = state.equipmentStatus['iphone-lidar'];
        return !!(
          (drohne?.hatEigenes && drohne?.nachweisUrl) || (drohne?.hatEigenes === false)
        ) && !!(iphone?.hatEigenes);
      case 'akademie':
        if (isPreview) return true;
        // Prüfe ob alle Unterpunkte aller Hauptmodule abgeschlossen sind UND Test bestanden
        const hauptmodule = state.akademieHauptmodule || [];
        const allUnterpunkteComplete = hauptmodule.length > 0 && hauptmodule.every(hm =>
          (hm.unterpunkte || []).every(up => up.abgeschlossen)
        );
        return allUnterpunkteComplete && state.akademieTestBestanden;
      case 'nachweise':
        if (isPreview) return true;
        return !!(
          Object.values(state.ausstattungCheckliste).every(Boolean) &&
          state.gesamtfotoUrl
        );
      case 'coaching':
        if (isPreview) return true;
        return state.coachingAbgeschlossen;
      default:
        return false;
    }
  }, [state, isPreview]);

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
    setGewerbescheinSpaeter,
    
    // Schritt 3
    toggleProductOrdered,
    setOberteilAuswahl,
    
    // Schritt 4
    updateEquipmentStatus,
    
    // Schritt 5 (NEU)
    completeAkademieUnterpunkt,
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
