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
import { IntroVideo } from './onboarding/IntroVideo';
import { OutroVideo } from './onboarding/OutroVideo';
import { QuizModal } from './akademie/QuizModal';
import { OnboardingLoadingScreen } from '@/components/ui/OnboardingLoadingScreen';
import { useOnboardingState, clearOnboardingLocalStorage } from '@/hooks/useOnboardingState';
import { useAkademieContent } from '@/hooks/useAkademieContent';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { useContractorOrders, getPaidProductKeys } from '@/hooks/useContractorOrders';
import { useAkademieFortschritt } from '@/hooks/useAkademieFortschritt';
import { useAvailableCoachingRides, useMyBookedRide, useBookCoachingRide } from '@/hooks/useCoachingSlots';
import {
  MOCK_PRODUCTS,
  MOCK_EQUIPMENT,
  ONBOARDING_STEPS,
  createInitialOnboardingState,
} from '@/lib/onboarding-config';
import { CoachingSlot, ApplicantProfile, OnboardingStepId } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { getOnboardingStorageKey } from '@/lib/onboarding-storage';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';

interface OnboardingScreenProps {
  onComplete: () => void;
  isPreview?: boolean;
  onExitPreview?: () => void;
  dbStatus?: {
    onboardingStatus: string;
    trainerFreigabe: boolean;
    profileId?: string;
    erstelltAm?: string;
    onboardingId?: string;
    isTrainer?: boolean;
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
  const paymentRedirectRef = useRef(hasPaymentSuccess);
  // Einmal true, bleibt true für die gesamte Lebensdauer der Komponente
  if (hasPaymentSuccess) {
    paymentRedirectRef.current = true;
  }

  const dbShowsNoProgress = dbStatus?.onboardingStatus === 'invited';
  const [forceReset, setForceReset] = useState(false);

  // ForceReset-Effect ist nach useContractorProfile verschoben (braucht isOnboardingStateLoaded)

  // Profildaten aus DB laden
  const {
    data: dbProfile,
    isLoading: profileLoading,
    updateProfile: saveProfileToDb,
    uploadAvatar,
    uploadGewerbeschein,
    uploadEquipmentNachweis,
    saveGewerbeschein,
    saveProgress,
    saveEquipmentStatus,
    saveIntroVideoWatched,
    saveOutroVideoWatched,
    saveAkademieTestBestanden,
    savePraxistest,
    uploadPraxistestVideo,
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
    setAllStepsCompleted,
    hydrateAkademieFromDb,
    setIntroVideoWatched,
    setOutroVideoWatched,
    hydrateFromDb,
    isStepComplete,
    setPraxistestScanUrl,
    setPraxistestVideoUrl,
    setPraxistestEingereicht,
  } = useOnboardingState(initialProfile, isPreview, forceReset, dbStatus?.isTrainer ?? false);
  
  // Unlock "Weiter" sobald der Schritt gewechselt hat
  useEffect(() => {
    if (!nextClickLockRef.current) return;
    nextClickLockRef.current = false;
    setIsAdvancing(false);
  }, [state.currentStep]);

  // Hydrate Onboarding-State aus DB (atomare Hydration - ein einziger setState-Aufruf)
  useEffect(() => {
    if (isPreview || hasHydratedOnboardingStateRef.current || !isOnboardingStateLoaded || !dbOnboardingState) return;
    hasHydratedOnboardingStateRef.current = true;

    console.log('[Onboarding] Hydrating onboarding state from DB (atomic):', dbOnboardingState);

    hydrateFromDb({
      gewerbescheinUrl: dbOnboardingState.gewerbescheinUrl,
      gewerbescheinSpaeter: dbOnboardingState.gewerbescheinSpaeter,
      currentStep: dbOnboardingState.currentStep,
      completedSteps: dbOnboardingState.completedSteps,
      equipmentStatus: dbOnboardingState.equipmentStatus,
      akademieTestBestanden: dbOnboardingState.akademieTestBestanden,
      introVideoWatched: dbOnboardingState.introVideoWatched,
      outroVideoWatched: dbOnboardingState.outroVideoWatched,
      praxistestScanUrl: dbOnboardingState.praxistestScanUrl,
      praxistestVideoUrl: dbOnboardingState.praxistestVideoUrl,
      praxistestEingereicht: dbOnboardingState.praxistestEingereicht,
      praxistestFreigabe: dbOnboardingState.praxistestFreigabe,
    });
  }, [isPreview, isOnboardingStateLoaded, dbOnboardingState, hydrateFromDb]);

  // ForceReset-Logik: Nur bei wirklich unmöglichem Zustand UND NICHT bei payment redirect
  useEffect(() => {
    const profileId = dbStatus?.profileId;
    // paymentRedirectRef überlebt URL-Bereinigung (hasPaymentSuccess tut das NICHT)
    if (!profileId || !dbShowsNoProgress || forceReset || isPreview || paymentRedirectRef.current) return;
    // KRITISCH: Warte bis DB-State geladen ist, bevor stale-Check
    if (!isOnboardingStateLoaded) return;

    // Wenn DB-State echten Fortschritt zeigt, NIEMALS resetten
    if (dbOnboardingState) {
      const dbHasRealProgress = 
        (dbOnboardingState.completedSteps && dbOnboardingState.completedSteps.length > 0) ||
        dbOnboardingState.introVideoWatched === true;
      if (dbHasRealProgress) {
        console.log('[Onboarding] DB shows real progress, skipping forceReset');
        return;
      }
    }

    const storageKey = getOnboardingStorageKey(profileId);
    const savedState = localStorage.getItem(storageKey);
    if (!savedState) return;

    try {
      const parsed = JSON.parse(savedState);
      const isDefinitelyStale =
        parsed.coachingAbgeschlossen === true ||
        parsed.akademieTestBestanden === true ||
        (parsed.currentStep && parsed.currentStep !== 'profil') ||
        (Array.isArray(parsed.completedSteps) && parsed.completedSteps.length > 0);

      if (isDefinitelyStale) {
        console.warn('[Onboarding] Stale localStorage detected - forcing reset');
        clearOnboardingLocalStorage(profileId);
        setForceReset(true);
      }
    } catch {
      clearOnboardingLocalStorage(profileId);
      setForceReset(true);
    }
  }, [dbShowsNoProgress, forceReset, isPreview, dbStatus?.profileId, isOnboardingStateLoaded, dbOnboardingState]);

  // Bug 3 Fix: Hydration-Ref nach ForceReset zurücksetzen
  useEffect(() => {
    if (forceReset) {
      hasHydratedOnboardingStateRef.current = false;
    }
  }, [forceReset]);

  // Sync DB-Profil in State wenn geladen
  useEffect(() => {
    if (!profileLoading && dbProfile) {
      const stateHasNoAvatar = !state.profil.avatarUrl;
      const dbHasAvatar = !!dbProfile.avatarUrl;

      const stateMissingName =
        !state.profil.vorname?.trim() ||
        !state.profil.nachname?.trim();

      const dbHasName =
        !!dbProfile.vorname?.trim() &&
        !!dbProfile.nachname?.trim();

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
        (stateMissingAddress && dbHasAddress) ||
        (stateMissingName && dbHasName)
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

  // Akademie-Fortschritt aus DB laden
  const { data: completedLektionIds } = useAkademieFortschritt(dbStatus?.onboardingId || null);
  
  useEffect(() => {
    if (isPreview || hasHydratedRef.current) return;
    if (!dbLoaded || !dbAkademieModule || dbAkademieModule.length === 0) return;
    if (completedLektionIds === undefined) return; // Warten bis Fortschritt geladen
    
    hasHydratedRef.current = true;
    hydrateAkademieFromDb(dbAkademieModule, completedLektionIds, dbStatus?.onboardingStatus);
  }, [dbLoaded, dbAkademieModule, isPreview, hydrateAkademieFromDb, completedLektionIds]);

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

    // Auto-detect oberteilAuswahl from paid orders if not set (e.g. new device / cleared cache)
    if (!state.oberteilAuswahl && paidKeys.length > 0) {
      const hasTshirt = paidKeys.includes('tshirt');
      const hasPoloshirt = paidKeys.includes('poloshirt');
      if (hasTshirt && hasPoloshirt) {
        console.log('[Onboarding] Auto-detected oberteilAuswahl: beides (from paid orders)');
        setOberteilAuswahl('beides');
      } else if (hasTshirt) {
        console.log('[Onboarding] Auto-detected oberteilAuswahl: tshirt (from paid orders)');
        setOberteilAuswahl('tshirt');
      } else if (hasPoloshirt) {
        console.log('[Onboarding] Auto-detected oberteilAuswahl: poloshirt (from paid orders)');
        setOberteilAuswahl('poloshirt');
      }
    }

    // Bereinigung: Wenn Zahlungen fehlschlagen und "bestellungen" in completedSteps ist,
    // aber nicht mehr genug bezahlte Produkte vorhanden → completedSteps bereinigen
    const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6;
    if (paidKeys.length < requiredCount && state.completedSteps.includes('bestellungen')) {
      console.log('[Onboarding] Removing bestellungen from completedSteps – paid products dropped below required count');
      const cleanedSteps = state.completedSteps.filter(s => s !== 'bestellungen');
      // Auch nachfolgende Schritte entfernen, da Bestellungen Voraussetzung ist
      const stepOrder = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];
      const bestellungenIndex = stepOrder.indexOf('bestellungen');
      const finalSteps = cleanedSteps.filter(s => stepOrder.indexOf(s) < bestellungenIndex);
      
      try {
        saveProgress({
          currentStep: 'bestellungen',
          completedSteps: finalSteps,
        });
      } catch (e) {
        console.warn('[Onboarding] Failed to clean completedSteps in DB:', e);
      }
    }
  }, [ordersLoaded, dbOrders, state.bestellungenBestaetigt, setBestellungenFromDb, state.oberteilAuswahl, setOberteilAuswahl]);

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
      toast.error('Es gab ein Problem mit deiner Bestellung. Bitte versuche es erneut.');
      goToStep('bestellungen');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refetchOrders, goToStep]);

  const [selectedCoachingSlot, setSelectedCoachingSlot] = useState<string | undefined>();
  const [quizOpen, setQuizOpen] = useState(false);
  const [showOutroVideo, setShowOutroVideo] = useState(false);
  const [isPraxistestUploading, setIsPraxistestUploading] = useState(false);

  // Coaching-Rides aus DB laden
  const { data: dbCoachingRides = [] } = useAvailableCoachingRides();
  const { data: myBookedRide } = useMyBookedRide(dbStatus?.profileId || null);
  const bookCoachingRideMutation = useBookCoachingRide();

  // DB-Rides → CoachingSlot[] Format für CoachingStep
  const coachingSlots: CoachingSlot[] = (() => {
    const slots: CoachingSlot[] = [];
    
    // Gebuchter Ride zuerst
    if (myBookedRide) {
      slots.push({
        id: myBookedRide.auftrag_id,
        coachName: `${myBookedRide.trainer_vorname || ''} ${myBookedRide.trainer_nachname || ''}`.trim() || 'Trainer',
        coachAvatarUrl: myBookedRide.trainer_avatar_url,
        coachVideoUrl: myBookedRide.trainer_video_url,
        coachBio: myBookedRide.trainer_bio,
        coachTelefon: myBookedRide.trainer_telefon,
        coachEmail: myBookedRide.trainer_email,
        coachOrt: myBookedRide.trainer_ort,
        termine: myBookedRide.termine.map(t => ({
          datum: t.datum,
          ganztaegig: t.ganztaegig,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
        })),
        ort: myBookedRide.region,
        region: myBookedRide.region,
        gebucht: true,
        preis: Math.round((myBookedRide.trainer_coaching_preis ?? 0) * 1.3),
      });
    }
    
    // Verfügbare Rides
    for (const ride of dbCoachingRides) {
      slots.push({
        id: ride.auftrag_id,
        coachName: `${ride.trainer_vorname || ''} ${ride.trainer_nachname || ''}`.trim() || 'Trainer',
        coachAvatarUrl: ride.trainer_avatar_url,
        coachVideoUrl: ride.trainer_video_url,
        coachBio: ride.trainer_bio,
        coachTelefon: ride.trainer_telefon,
        coachEmail: ride.trainer_email,
        coachOrt: ride.trainer_ort,
        termine: ride.termine.map(t => ({
          datum: t.datum,
          ganztaegig: t.ganztaegig,
          zeitVon: t.zeit_von,
          zeitBis: t.zeit_bis,
        })),
        ort: ride.region,
        region: ride.region,
        gebucht: false,
        preis: Math.round((ride.trainer_coaching_preis ?? 0) * 1.3),
      });
    }
    
    return slots;
  })();

  // Handle completed unterpunkt from AkademieModul page navigation
  useEffect(() => {
    const navState = location.state as { 
      completedHauptmodulId?: string;
      completedUnterpunktId?: string;
      completedModuleId?: string;
    } | null;
    
    if (navState?.completedHauptmodulId && navState?.completedUnterpunktId) {
      completeAkademieUnterpunkt(navState.completedHauptmodulId, navState.completedUnterpunktId);
      
      // Persist completion to DB (localStorage is already updated above)
      const cId = dbStatus?.onboardingId;
      const lId = navState.completedUnterpunktId;
      if (cId && lId) {
        supabaseTC.from('contractor_akademie_lektions_fortschritt').upsert({
          contractor_id: cId,
          lektion_id: lId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          video_progress_seconds: 0,
        }, { onConflict: 'contractor_id,lektion_id' }).then(({ error }) => {
          if (error) console.warn('[AkademieComplete] DB upsert failed:', error.message);
          else console.log('[AkademieComplete] Lektion', lId, 'marked completed in DB');
        });
      }
      
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

  const isDbReady = dbStatus?.isTrainer
    ? dbStatus?.onboardingStatus === 'ready'
    : (dbStatus?.onboardingStatus === 'ready' && dbStatus?.trainerFreigabe === true);

  // Loading-Gate: Warte bis Hydration TATSÄCHLICH ausgeführt wurde (nicht nur bis Daten geladen)
  const isHydrationPending = !isPreview && !hasHydratedOnboardingStateRef.current;

  if (isHydrationPending) {
    return <OnboardingLoadingScreen message="Lade Fortschritt..." />;
  }

  // Intro-Video Gate: Zeige das unskippable Video BEVOR das Onboarding startet
  if (!state.introVideoWatched && !isPreview && !paymentRedirectRef.current) {
    const handleIntroComplete = async () => {
      setIntroVideoWatched(true);
      try {
        await saveIntroVideoWatched();
        console.log('[Onboarding] Intro video marked as watched in DB');
      } catch (error) {
        console.warn('[Onboarding] Failed to save intro video status to DB:', error);
      }
    };
    return <IntroVideo onComplete={handleIntroComplete} />;
  }

  // Outro-Video Gate: Fullscreen-Video zwischen Akademie und Coaching
  // Nur zeigen wenn showOutroVideo UND noch nicht persistent als gesehen markiert
  if (showOutroVideo && !state.outroVideoWatched) {
    const handleOutroComplete = async () => {
      setShowOutroVideo(false);
      setOutroVideoWatched(true);
      goToNextStep();
      // Fortschritt + Outro-Flag speichern
      try {
        await saveOutroVideoWatched();
        const nextCompletedSteps = state.completedSteps.includes('akademie')
          ? state.completedSteps
          : [...state.completedSteps, 'akademie'];
        await saveProgress({
          currentStep: 'coaching',
          completedSteps: nextCompletedSteps,
        });
        console.log('[Onboarding] Outro video complete, progress saved');
      } catch (error) {
        console.warn('[Onboarding] Failed to save progress after outro:', error);
      }
    };
    return <OutroVideo onComplete={handleOutroComplete} />;
  }

  if (isComplete) {
    if (isPreview) {
      toast.success('Vorschau beendet');
      onExitPreview?.();
      return null;
    }
    
    // Trainer brauchen keine Freigabe – sie SIND die Trainer
    if (isDbReady || dbStatus?.isTrainer) {
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
    setQuizOpen(true);
  };

  const handleQuizComplete = async (bestanden: boolean) => {
    if (bestanden) {
      setAkademieTestBestanden(true);
      toast.success('Abschlusstest bestanden! 🎉');
      try {
        await saveAkademieTestBestanden();
        console.log('[Onboarding] akademie_test_bestanden saved to DB');
      } catch (error) {
        console.warn('[Onboarding] Failed to save akademie_test_bestanden:', error);
      }
    } else {
      toast.error('Leider nicht bestanden. Du kannst es erneut versuchen.');
    }
  };

  const handleBookCoaching = async () => {
    if (!selectedCoachingSlot) return;
    
    try {
      const result = await bookCoachingRideMutation.mutateAsync(selectedCoachingSlot);
      setGebuchterCoachingSlot(selectedCoachingSlot);
      setCoachingAbgeschlossen(true);
      toast.success(`Coaching-Termin gebucht bei ${result.coach_name}!`);
    } catch (error: any) {
      console.error('[Onboarding] Coaching booking failed:', error);
      toast.error(error?.message || 'Buchung fehlgeschlagen. Bitte versuche es erneut.');
    }
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
      }
    }

    // Bei Equipment-Schritt: Equipment-Status in DB speichern
    if (state.currentStep === 'equipment') {
      try {
        await saveEquipmentStatus(state.equipmentStatus);
        console.log('[Onboarding] Equipment status saved to DB:', state.equipmentStatus);
      } catch (error) {
        console.warn('[Onboarding] Failed to save equipment status:', error);
      }
    }

    // Nachweise ist der letzte Schritt – Onboarding abschließen
    if (state.currentStep === 'nachweise') {
      // Alle Schritte als abgeschlossen markieren
      const allSteps = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];
      try {
        await saveProgress({
          currentStep: 'nachweise',
          completedSteps: allSteps,
        });
      } catch (error) {
        console.warn('[Onboarding] Failed to save final progress:', error);
      }
      setAllStepsCompleted();          // lokalen State synchronisieren
      setCoachingAbgeschlossen(true); // triggers isComplete
      nextClickLockRef.current = false;
      setIsAdvancing(false);
      return;
    }

    // Outro-Video Gate: Bei Akademie → Coaching Übergang Video zeigen (nur wenn noch nicht gesehen)
    if (state.currentStep === 'akademie' && !state.outroVideoWatched) {
      setShowOutroVideo(true);
      nextClickLockRef.current = false;
      setIsAdvancing(false);
      return;
    }

    // Bestellungen-Gate: Zahlungsstatus immer re-validieren (Stripe kann async fehlschlagen)
    if (state.currentStep === 'bestellungen' && !isStepComplete('bestellungen')) {
      toast.error('Bitte schließe erst alle Bestellungen ab.');
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
      
      const stepOrder = ['profil', 'dokumente', 'bestellungen', 'equipment', 'akademie', 'coaching', 'nachweise'];
      const nextStepIndex = stepOrder.indexOf(state.currentStep);
      const nextStep = stepOrder[nextStepIndex + 1];
      
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
      case 'akademie': return 'Weiter zu Coaching';
      case 'coaching': return 'Weiter zu Nachweise';
      case 'nachweise': return 'Onboarding abschließen';
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
        const massbandItem = MOCK_EQUIPMENT.find(e => e.id === 'massband');

        const handleEquipmentFileUpload = async (equipId: string, file: File): Promise<string> => {
          try {
            const url = await uploadEquipmentNachweis(equipId, file);
            toast.success('Nachweis hochgeladen');
            return url;
          } catch (error) {
            console.error('[Onboarding] Equipment nachweis upload failed:', error);
            toast.error('Fehler beim Hochladen des Nachweises');
            throw error;
          }
        };

        return (
          <EquipmentStep
            drohneStatus={state.equipmentStatus['drohne'] || { hatEigenes: false }}
            iphoneStatus={state.equipmentStatus['iphone-lidar'] || { hatEigenes: false }}
            massbandStatus={state.equipmentStatus['massband'] || { hatEigenes: false }}
            onDrohneChange={(status) => updateEquipmentStatus('drohne', status)}
            onIphoneChange={(status) => updateEquipmentStatus('iphone-lidar', status)}
            onMassbandChange={(status) => updateEquipmentStatus('massband', status)}
            onFileUpload={handleEquipmentFileUpload}
            drohneMietLink={drohneItem?.mietLink}
            drohneKaufLink={drohneItem?.kaufLink}
            iPhoneMietLink={iPhoneItem?.mietLink}
            iPhoneKaufLink={iPhoneItem?.kaufLink}
            massbandKaufLink={massbandItem?.kaufLink}
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
            isTrainer={dbStatus?.isTrainer}
            praxistestScanUrl={state.praxistestScanUrl || ''}
            praxistestVideoUrl={state.praxistestVideoUrl || ''}
            praxistestEingereicht={state.praxistestEingereicht || false}
            praxistestFreigabe={state.praxistestFreigabe || false}
            onPraxistestScanUrlChange={(url) => setPraxistestScanUrl(url)}
            onPraxistestVideoUpload={async (file) => {
              setIsPraxistestUploading(true);
              try {
                const url = await uploadPraxistestVideo(file);
                setPraxistestVideoUrl(url);
              } finally {
                setIsPraxistestUploading(false);
              }
            }}
            onPraxistestEinreichen={async () => {
              await savePraxistest({
                scanUrl: state.praxistestScanUrl || '',
                videoUrl: state.praxistestVideoUrl || '',
              });
              setPraxistestEingereicht(true);
            }}
            isPraxistestUploading={isPraxistestUploading}
          />
        );

      case 'nachweise':
        return (
          <>
            {dbStatus?.isTrainer && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2 text-sm text-blue-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Als Trainer entfällt die Freigabe-Pflicht. Du kannst diesen Schritt überspringen.</span>
              </div>
            )}
            <ProofStep
              checkliste={state.ausstattungCheckliste}
              onChecklistChange={updateCheckliste}
              gesamtfotoUrl={state.gesamtfotoUrl}
              onGesamtfotoUpload={handleGesamtfotoUpload}
              onRemoveGesamtfoto={() => setGesamtfotoUrl(undefined)}
              coachingBewertung={dbStatus?.isTrainer ? 'bestanden' : ((dbOnboardingState as any)?.coachingBewertung || 'ausstehend')}
              coachingTermin={(dbOnboardingState as any)?.coachingTermin}
              coachName={(dbOnboardingState as any)?.coachName}
            />
          </>
        );

      case 'coaching':
        return (
          <>
            {dbStatus?.isTrainer && (
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start gap-2 text-sm text-blue-800">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Als Trainer ist die Mitfahrt für dich nicht erforderlich. Du kannst diesen Schritt überspringen.</span>
              </div>
            )}
            <CoachingStep
              slots={coachingSlots}
              selectedSlotId={selectedCoachingSlot}
              onSelectSlot={setSelectedCoachingSlot}
              onBookSlot={handleBookCoaching}
            />
          </>
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
      {!isPreview && dbStatus?.isTrainer && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-2 text-emerald-800">
            <span className="text-sm font-medium">
              ✅ Du bist als Trainer freigeschaltet
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onComplete}
            className="text-emerald-800 hover:bg-emerald-200/50 h-7 px-2 font-medium"
          >
            Zur App →
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
        onForward={goToNextStep}
        onStepClick={goToStep}
        nextLabel={getNextLabel()}
        nextDisabled={!canProceed || isAdvancing || (state.currentStep === 'nachweise' && !dbStatus?.isTrainer && (dbOnboardingState as any)?.coachingBewertung !== 'bestanden')}
        progress={progress}
        erstelltAm={isPreview ? undefined : dbStatus?.erstelltAm}
        isPreview={isPreview}
        onSkipStep={isPreview ? goToNextStep : undefined}
      >
        {renderStep()}
      </OnboardingStepWrapper>

      {/* Akademie Abschlusstest Quiz Modal */}
      <QuizModal
        open={quizOpen}
        onOpenChange={setQuizOpen}
        modulTitel="Abschlussprüfung"
        contractorId={dbStatus?.onboardingId || ''}
        onQuizComplete={handleQuizComplete}
        bestehensSchwelle={100}
      />
    </div>
  );
}
