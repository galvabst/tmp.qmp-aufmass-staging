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
import { getOnboardingStorageKey, ONBOARDING_STORAGE_KEY_PREFIX } from '@/lib/onboarding-storage';
import { isUuid } from '@/lib/utils';

/**
 * Clear onboarding localStorage - used when DB says "invited" but localStorage has stale progress
 */
export function clearOnboardingLocalStorage(profileId?: string) {
  const key = getOnboardingStorageKey(profileId);
  localStorage.removeItem(key);

  // Legacy cleanup (pre user-namespacing)
  if (profileId) {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY_PREFIX);
  }

  console.log('[Onboarding] localStorage cleared due to DB sync', { key });
}

/**
 * Validate if akademieHauptmodule contains valid UUIDs
 * Returns false if any ID is not a UUID (legacy mock data)
 */
export function hasValidAkademieIds(hauptmodule: AkademieHauptmodul[] | undefined): boolean {
  if (!hauptmodule || hauptmodule.length === 0) return false;

  // Check all hauptmodul IDs and their unterpunkte IDs
  return hauptmodule.every(hm => {
    if (!isUuid(hm.id)) return false;
    const unterpunkte = hm.unterpunkte || [];
    return unterpunkte.every(up => isUuid(up.id));
  });
}

const loadPersistedState = (initialProfile: ApplicantProfile, storageKey: string): OnboardingState => {
  try {
    let saved = localStorage.getItem(storageKey);

    // Legacy migration: global key -> per-user key (only if profile matches)
    if (!saved && initialProfile.id) {
      const legacy = localStorage.getItem(ONBOARDING_STORAGE_KEY_PREFIX);
      if (legacy) {
        try {
          const legacyParsed = JSON.parse(legacy) as Partial<OnboardingState>;
          const legacyProfileId = (legacyParsed as any)?.profil?.id;
          if (legacyProfileId === initialProfile.id) {
            saved = legacy;
            localStorage.setItem(storageKey, legacy);
            localStorage.removeItem(ONBOARDING_STORAGE_KEY_PREFIX);
            console.log('[Onboarding] Migrated legacy localStorage state to user key');
          }
        } catch {
          // Ignore legacy parse errors here; normal load flow will handle invalid JSON.
        }
      }
    }

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
  isPreview: boolean = false,
  forceReset: boolean = false // NEU: Flag um State ohne Reload zurückzusetzen
) {
  const storageKey = getOnboardingStorageKey(initialProfile.id || undefined);

  const [state, setState] = useState<OnboardingState>(() => {
    // Bei forceReset: frischer State ohne localStorage
    if (forceReset) {
      console.log('[Onboarding] Force reset triggered - starting fresh');
      return createInitialOnboardingState(initialProfile);
    }
    return isPreview
      ? createInitialOnboardingState(initialProfile)
      : loadPersistedState(initialProfile, storageKey);
  });

  // Persist state to localStorage on every change (only if not in preview mode AND not force reset)
  useEffect(() => {
    if (isPreview || forceReset) return; // Don't persist in preview or force-reset mode
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save onboarding state to localStorage', e);
    }
  }, [state, isPreview, forceReset, storageKey]);

  // Reset state when entering preview mode or force reset
  useEffect(() => {
    if (isPreview || forceReset) {
      setState(createInitialOnboardingState(initialProfile));
    }
  }, [isPreview, forceReset, initialProfile]);
  
  // Hydrate akademie from external data (called by component with DB data)
  const hydrateAkademieFromDb = useCallback((dbModules: AkademieHauptmodul[]) => {
    if (!dbModules || dbModules.length === 0) return;
    
    setState(prev => {
      const currentHauptmodule = prev.akademieHauptmodule || [];
      const hasValidIds = hasValidAkademieIds(currentHauptmodule);
      
      // Only hydrate if: empty, or IDs mismatch (schema changed)
      const dbIds = dbModules.flatMap(m => [m.id, ...m.unterpunkte.map(u => u.id)]).sort().join(',');
      const stateIds = currentHauptmodule.flatMap(m => [m.id, ...(m.unterpunkte || []).map(u => u.id)]).sort().join(',');
      
      if (currentHauptmodule.length === 0 || !hasValidIds || dbIds !== stateIds) {
        console.log('[Onboarding] Hydrating akademie from database...');
        
        // Merge: use DB structure but preserve local progress
        const mergedModules = dbModules.map(dbHm => {
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
        
        return {
          ...prev,
          akademieHauptmodule: mergedModules,
        };
      }
      
      return prev; // No change needed
    });
  }, []);

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

  const setBestellungenFromDb = useCallback((paidKeys: string[]) => {
    setState(prev => ({
      ...prev,
      bestellungenBestaetigt: paidKeys,
    }));
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
          state.profil.vorname?.trim() &&
          state.profil.nachname?.trim() &&
          state.profil.email?.trim() &&
          state.profil.avatarUrl &&
          // Adresse ist auch Pflicht
          state.profil.strasse?.trim() &&
          state.profil.hausnummer?.trim() &&
          state.profil.plz?.trim() &&
          state.profil.ort?.trim()
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
    setBestellungenFromDb,
    setOberteilAuswahl,
    
    // Schritt 4
    updateEquipmentStatus,
    
    // Schritt 5 (NEU)
    completeAkademieUnterpunkt,
    completeAkademieModul,
    setAkademieTestBestanden,
    hydrateAkademieFromDb,
    
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
