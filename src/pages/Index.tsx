import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BottomNav, Tab } from '@/components/BottomNav';
import { PoolView } from '@/components/PoolView';
import { BookingsView } from '@/components/BookingsView';
import { ActiveOrdersView } from '@/components/ActiveOrdersView';
import { ReviewView } from '@/components/ReviewView';
import { ProfileView } from '@/components/ProfileView';
import { MessagesAndForumView } from '@/features/chat/ui/MessagesAndForumView';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { TechnicianOrderDetail } from '@/components/TechnicianOrderDetail';
import { TechnicianOrder, TechnicianProfile, CheckinPhase } from '@/types/technician';
import { usePoolOrders } from '@/hooks/usePoolOrders';
import { useMyAssignedOrders } from '@/hooks/useMyAssignedOrders';
import { useMyPendingProposals } from '@/hooks/useMyPendingProposals';
import { useAngebotstermine } from '@/hooks/useAngebotstermine';
import { useTechnikerBewertungStats } from '@/hooks/useTechnikerBewertungStats';
import { RescheduleModal } from '@/components/RescheduleModal';
import { useUnreadChatCounts } from '@/features/chat/hooks/useUnreadChatCounts';
import { supabase } from '@/integrations/supabase/client';
import { ObjectOrderStatusEnum } from '@/lib/enums';
import { toast } from 'sonner';
import { useContractorOnboardingStatus } from '@/hooks/useContractorOnboardingStatus';
import { useContractorProfile } from '@/hooks/useContractorProfile';
import { useIsAdmin } from '@/hooks/useIAM';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { OnboardingLoadingScreen } from '@/components/ui/OnboardingLoadingScreen';
import { NoContractorAccessScreen } from '@/components/ui/NoContractorAccessScreen';
import { AuthRequiredScreen } from '@/components/ui/AuthRequiredScreen';
import { TechnicalErrorScreen } from '@/components/ui/TechnicalErrorScreen';
import { ONBOARDING_STEPS } from '@/lib/onboarding-config';
import { usePflichtVideos } from '@/hooks/usePflichtVideos';
import { PflichtVideoOverlay } from '@/features/akademie/ui/PflichtVideoOverlay';

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { session, isLoading: isSessionLoading } = useSupabaseSession();
  const accessToken = session?.access_token ?? null;
  
  // Grace period: track when session was first established to avoid flash of error screen
  const [sessionEstablishedAt, setSessionEstablishedAt] = useState<number | null>(null);
  const [gracePeriodElapsed, setGracePeriodElapsed] = useState(false);
  
  useEffect(() => {
    if (session && !sessionEstablishedAt) {
      setSessionEstablishedAt(Date.now());
    }
    if (!session) {
      setSessionEstablishedAt(null);
      setGracePeriodElapsed(false);
    }
  }, [session, sessionEstablishedAt]);
  
  useEffect(() => {
    if (sessionEstablishedAt && !gracePeriodElapsed) {
      const elapsed = Date.now() - sessionEstablishedAt;
      const remaining = Math.max(0, 5000 - elapsed);
      const timer = setTimeout(() => setGracePeriodElapsed(true), remaining);
      return () => clearTimeout(timer);
    }
  }, [sessionEstablishedAt, gracePeriodElapsed]);
  
  const { 
    isReady: isDbReady, 
    isLoading: isDbLoading, 
    isError: isDbError,
    errorMessage: dbErrorMessage,
    hasRecord: hasContractorRecord,
    onboardingRecord,
    isFetched: isDbFetched,
    refetch: refetchOnboardingStatus,
  } = useContractorOnboardingStatus(session?.user?.id, accessToken);
  
  const isAdmin = useIsAdmin();

  // Load real profile data from DB
  const profileId = onboardingRecord?.profile_id || null;
  const { data: dbProfile } = useContractorProfile(profileId);
  const contractorOnboardingId = onboardingRecord?.id || null;
  const { data: bewertungStats } = useTechnikerBewertungStats(contractorOnboardingId);
  
  // Pflicht-Videos for ready contractors (trainers only see lessons marked "auch_fuer_trainer")
  const { data: pflichtVideos, refetch: refetchPflichtVideos } = usePflichtVideos(
    contractorOnboardingId,
    onboardingRecord?.onboarding_status,
    onboardingRecord?.is_trainer === true
  );

  const [activeTab, setActiveTab] = useState<Tab>('pool');
  const [selectedOrder, setSelectedOrder] = useState<TechnicianOrder | null>(null);
  
  // Fetch real orders from DB
  const { data: dbPoolOrders, isLoading: isOrdersLoading } = usePoolOrders();
  const { data: dbAssignedOrders } = useMyAssignedOrders();
  const { data: pendingReschedules, refetch: refetchPending } = useMyPendingProposals();
  const [orders, setOrders] = useState<TechnicianOrder[]>([]);

  // Collect auftrag IDs and lead IDs from assigned orders
  const assignedAuftragIds = useMemo(() => 
    (dbAssignedOrders || []).map(o => o.auftragId).filter(Boolean) as string[],
    [dbAssignedOrders]
  );
  const assignedLeadIds = useMemo(() => 
    (dbAssignedOrders || []).map(o => o.leadId).filter(Boolean) as string[],
    [dbAssignedOrders]
  );
  const { data: unreadCounts } = useUnreadChatCounts(assignedAuftragIds);
  const { data: angebotstermine } = useAngebotstermine(assignedLeadIds);
  const unreadChatTotal = useMemo(() => {
    if (!unreadCounts) return 0;
    return [...unreadCounts.values()].reduce((s, v) => s + v, 0);
  }, [unreadCounts]);
  
  // Sync DB orders into local state (merge pool + assigned)
  useEffect(() => {
    const pool = dbPoolOrders || [];
    const assigned = dbAssignedOrders || [];
    // Deduplicate by id
    const merged = new Map<string, TechnicianOrder>();
    for (const o of [...pool, ...assigned]) {
      merged.set(o.id, o);
    }
    setOrders(Array.from(merged.values()));
  }, [dbPoolOrders, dbAssignedOrders]);
  
  // Build profile from DB data
  const profile = useMemo((): TechnicianProfile => {
    const name = dbProfile 
      ? `${dbProfile.vorname || ''} ${dbProfile.nachname || ''}`.trim() || '–'
      : '–';

    // Derive onboarding steps from DB record
    const completedSteps: string[] = (onboardingRecord as any)?.completed_steps || [];
    const currentStep: string | null = (onboardingRecord as any)?.current_step || null;
    const isOnboardingCompleted = onboardingRecord?.onboarding_status === 'ready';

    const onboardingSteps = ONBOARDING_STEPS.map(step => {
      const isCompleted = completedSteps.includes(step.id);
      const isCurrent = step.id === currentStep;
      return {
        id: step.id as any,
        label: step.label,
        status: (isCompleted ? 'completed' : isCurrent ? 'in_progress' : 'pending') as 'completed' | 'in_progress' | 'pending',
      };
    });

    const completedCount = onboardingSteps.filter(s => s.status === 'completed').length;
    const progressPercent = onboardingSteps.length > 0 
      ? Math.round((completedCount / onboardingSteps.length) * 100) 
      : 0;

    // "Techniker seit" from erstellt_am
    const erstelltAm = onboardingRecord?.erstellt_am;
    const memberSince = erstelltAm 
      ? new Date(erstelltAm).toISOString().slice(0, 7)
      : '–';

    const assignedCount = dbAssignedOrders?.length || 0;

    return {
      id: profileId || '',
      name,
      email: dbProfile?.email || '–',
      phone: dbProfile?.telefon || '–',
      region: dbProfile?.ort || '–',
      avatarUrl: dbProfile?.avatarUrl,
      memberSince,
      stats: {
        totalOrders: assignedCount,
        acceptanceRate: assignedCount > 0 ? 100 : 0,
        rating: bewertungStats?.average || 0,
      },
      certificates: [],
      onboarding: {
        isCompleted: isOnboardingCompleted,
        currentStep: (currentStep as any) || 'gewerbeschein',
        steps: onboardingSteps,
        progressPercent: isOnboardingCompleted ? 100 : progressPercent,
      },
      kontingent: {
        quartal: 'Q1/2026',
        angenommen: assignedCount,
        abgenommen: dbAssignedOrders?.filter(o => o.status === 'approved').length || 0,
        minimum: 24,
      },
    };
  }, [dbProfile, onboardingRecord, profileId, dbAssignedOrders]);
  
  // Preview mode for testing the onboarding flow
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Count orders per tab
  const poolCount = orders.filter(o => o.status === 'published').length;
  const bookingsCount = orders.filter(o => o.status === 'booked').length;
  const activeCount = orders.filter(o => o.status === 'in_progress').length;
  const reviewCount = orders.filter(o => ['submitted', 'in_review', 'rework_required'].includes(o.status)).length;
  const submittedCount = orders.filter(o => ['submitted', 'in_review', 'approved', 'rework_required'].includes(o.status)).length;

  const handleOrderClick = (order: TechnicianOrder) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handleStatusChange = useCallback(async (orderId: string, newStatus: ObjectOrderStatusEnum) => {
    if (newStatus === 'booked') {
      // Use RPC to atomically accept the order
      try {
        const { data, error } = await supabase.rpc('accept_pool_order', {
          p_termin_id: orderId,
        });

        if (error) {
          console.error('[handleStatusChange] RPC error:', error);
          toast.error('Fehler beim Annehmen: ' + error.message);
          return;
        }

        const result = data as { success: boolean; error?: string };
        if (!result.success) {
          toast.error(result.error || 'Auftrag konnte nicht angenommen werden');
          return;
        }

        toast.success('Auftrag angenommen! 🎉');
        setSelectedOrder(null);
        setActiveTab('bookings');
        queryClient.invalidateQueries({ queryKey: ['my-assigned-orders'] });
        queryClient.invalidateQueries({ queryKey: ['pool-orders'] });
        return;
      } catch (err) {
        console.error('[handleStatusChange] Unexpected error:', err);
        toast.error('Unerwarteter Fehler beim Annehmen');
        return;
      }
    }

    // For other status changes, keep local state update
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );

    const statusMessages: Partial<Record<ObjectOrderStatusEnum, string>> = {
      cancelled: 'Auftrag abgelehnt',
    };

    if (statusMessages[newStatus]) {
      toast.success(statusMessages[newStatus]);
    }
    
    setSelectedOrder(null);
  }, [queryClient]);

  const handleCheckin = useCallback(async (orderId: string, phase: CheckinPhase) => {
    // Find the auftragId from the order (orderId is termin.id, we need auftrag.id)
    const order = orders.find(o => o.id === orderId);
    const auftragId = order?.auftragId;
    if (!auftragId) {
      toast.error('Auftrag-ID nicht gefunden');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('checkin_thermocheck_auftrag', {
        p_auftrag_id: auftragId,
        p_phase: phase,
      });

      if (error) {
        console.error('[handleCheckin] RPC error:', error);
        toast.error('Check-in fehlgeschlagen: ' + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || 'Check-in fehlgeschlagen');
        return;
      }

      toast.success(`Check-in ${phase === 'vor_ort' ? 'Vor-Ort' : 'Nachbearbeitung'} gestartet`);
      await queryClient.invalidateQueries({ queryKey: ['my-assigned-orders'] });
    } catch (err) {
      console.error('[handleCheckin] Unexpected error:', err);
      toast.error('Unerwarteter Fehler beim Check-in');
    }
  }, [orders, queryClient]);

  const handleCheckout = useCallback(async (orderId: string, phase: CheckinPhase) => {
    const order = orders.find(o => o.id === orderId);
    const auftragId = order?.auftragId;
    if (!auftragId) {
      toast.error('Auftrag-ID nicht gefunden');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('checkout_thermocheck_auftrag', {
        p_auftrag_id: auftragId,
        p_phase: phase,
      });

      if (error) {
        console.error('[handleCheckout] RPC error:', error);
        toast.error('Check-out fehlgeschlagen: ' + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || 'Check-out fehlgeschlagen');
        return;
      }

      if (phase === 'nachbearbeitung') {
        toast.success('Auftrag zur Prüfung eingereicht! ✓');
        setActiveTab('review');
      } else {
        toast.success('Vor-Ort-Arbeit abgeschlossen');
      }
      
      await queryClient.invalidateQueries({ queryKey: ['my-assigned-orders'] });
    } catch (err) {
      console.error('[handleCheckout] Unexpected error:', err);
      toast.error('Unerwarteter Fehler beim Check-out');
    }
  }, [orders, queryClient]);

  // Admin redirect
  useEffect(() => {
    if (isAdmin === true && !hasContractorRecord && !isDbLoading && session) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, hasContractorRecord, isDbLoading, navigate, session]);

  // Early returns for auth/loading states
  if (isSessionLoading) {
    return <OnboardingLoadingScreen message="Prüfe Anmeldung..." />;
  }
  
  if (!session) {
    return <AuthRequiredScreen />;
  }
  
  if (isDbLoading || isAdmin === undefined || !isDbFetched) {
    return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
  }

  if (isDbError && dbErrorMessage) {
    return <TechnicalErrorScreen errorMessage={dbErrorMessage} onRetry={refetchOnboardingStatus} />;
  }

  if (!hasContractorRecord && !isAdmin) {
    // During grace period after login, show loading instead of error screen
    if (!gracePeriodElapsed) {
      return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
    }
    return <NoContractorAccessScreen userEmail={onboardingRecord?.ag_domain_email || session.user.email || undefined} />;
  }
  
  if (!hasContractorRecord && isAdmin) {
    return <OnboardingLoadingScreen message="Weiterleitung zum Admin-Bereich..." />;
  }

  const isTrainerBypass = onboardingRecord?.is_trainer === true;
  if ((!isDbReady && !isTrainerBypass) || isPreviewMode) {
    return (
      <OnboardingScreen 
        isPreview={isPreviewMode}
        onExitPreview={() => {
          setIsPreviewMode(false);
          toast.info('Vorschau beendet');
        }}
        dbStatus={onboardingRecord ? {
          onboardingStatus: onboardingRecord.onboarding_status || 'invited',
          trainerFreigabe: onboardingRecord.trainer_freigabe || false,
          profileId: onboardingRecord.profile_id || undefined,
          erstelltAm: onboardingRecord.erstellt_am || undefined,
          onboardingId: onboardingRecord.id || undefined,
          isTrainer: onboardingRecord.is_trainer || false,
        } : undefined}
        onComplete={() => {
          if (isPreviewMode) {
            setIsPreviewMode(false);
            return;
          }
          refetchOnboardingStatus();
          toast.success('Willkommen im Pool! 🎉');
        }}
      />
    );
  }

  // Pflicht-Video gate: block ready contractors who have unwatched mandatory videos
  if (isDbReady && pflichtVideos && pflichtVideos.length > 0 && contractorOnboardingId) {
    return (
      <PflichtVideoOverlay
        videos={pflichtVideos}
        contractorId={contractorOnboardingId}
        onAllCompleted={() => {
          refetchPflichtVideos();
          toast.success('Alle Pflicht-Videos abgeschlossen! ✓');
        }}
      />
    );
  }

  const handleStartRework = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const auftragId = order?.auftragId;
    if (!auftragId) {
      toast.error('Auftrag-ID nicht gefunden');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('checkin_thermocheck_auftrag', {
        p_auftrag_id: auftragId,
        p_phase: 'nachbearbeitung',
      });

      if (error) {
        console.error('[handleStartRework] RPC error:', error);
        toast.error('Nacharbeit fehlgeschlagen: ' + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        toast.error(result.error || 'Nacharbeit konnte nicht gestartet werden');
        return;
      }

      toast.info('Nacharbeit gestartet');
      await queryClient.invalidateQueries({ queryKey: ['my-assigned-orders'] });
    } catch (err) {
      console.error('[handleStartRework] Unexpected error:', err);
      toast.error('Unerwarteter Fehler');
    }
  };

  if (selectedOrder) {
    const currentOrder = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    const showFullDetails = currentOrder.status !== 'published';
    return (
      <TechnicianOrderDetail
        order={currentOrder}
        onBack={handleBack}
        onAccept={() => handleStatusChange(currentOrder.id, 'booked')}
        onReject={() => handleStatusChange(currentOrder.id, 'cancelled')}
        onStartCheckin={(phase) => handleCheckin(currentOrder.id, phase)}
        onCheckout={(phase) => handleCheckout(currentOrder.id, phase)}
        onStartRework={() => handleStartRework(currentOrder.id)}
        showFullDetails={showFullDetails}
        technicianName={profile.name !== '–' ? profile.name : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TechnikerBenachrichtigungenBanner />
      {activeTab === 'pool' && (
        <PoolView 
          orders={orders} 
          onOrderClick={handleOrderClick}
        />
      )}
      
      {activeTab === 'bookings' && (
        <BookingsView 
          orders={orders} 
          onOrderClick={handleOrderClick}
          unreadCounts={unreadCounts}
          angebotstermine={angebotstermine}
        />
      )}
      
      {activeTab === 'active' && (
        <ActiveOrdersView 
          orders={orders} 
          onOrderClick={handleOrderClick}
          onCheckin={handleCheckin}
          onCheckout={handleCheckout}
          unreadCounts={unreadCounts}
          angebotstermine={angebotstermine}
        />
      )}
      
      {activeTab === 'review' && (
        <ReviewView 
          orders={orders} 
          onOrderClick={handleOrderClick}
          angebotstermine={angebotstermine}
        />
      )}

      {activeTab === 'forum' && (
        <MessagesAndForumView
          auftragIds={assignedAuftragIds}
          unreadCounts={unreadCounts || new Map()}
          unreadTotal={unreadChatTotal}
        />
      )}
      
      {activeTab === 'profile' && (
        <ProfileView 
          profile={profile}
          profileId={profileId}
          totalSubmittedOrders={submittedCount}
          bewertungCount={bewertungStats?.count || 0}
          contractorOnboardingId={contractorOnboardingId}
          onSave={(updatedData) => {
            toast.success('Profil aktualisiert');
          }}
          onStartOnboardingPreview={() => {
            setIsPreviewMode(true);
            toast.info('Vorschau-Modus gestartet');
          }}
        />
      )}

      {(pendingReschedules?.length ?? 0) > 0 && (
        <RescheduleModal
          reschedules={pendingReschedules!}
          onDone={() => refetchPending()}
        />
      )}

      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        poolCount={poolCount}
        bookingsCount={bookingsCount}
        activeCount={activeCount}
        reviewCount={reviewCount}
        unreadChatTotal={unreadChatTotal}
      />
    </div>
  );
};

export default Index;
