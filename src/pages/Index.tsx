import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav, Tab } from '@/components/BottomNav';
import { PoolView } from '@/components/PoolView';
import { BookingsView } from '@/components/BookingsView';
import { ActiveOrdersView } from '@/components/ActiveOrdersView';
import { ReviewView } from '@/components/ReviewView';
import { ProfileView } from '@/components/ProfileView';
import { ForumView } from '@/features/forum/ui/ForumView';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { TechnicianOrderDetail } from '@/components/TechnicianOrderDetail';
import { TechnicianOrder, TechnicianProfile, CheckinPhase } from '@/types/technician';
import { usePoolOrders } from '@/hooks/usePoolOrders';
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

const Index = () => {
  const navigate = useNavigate();
  
  const { session, isLoading: isSessionLoading } = useSupabaseSession();
  
  const { 
    isReady: isDbReady, 
    isLoading: isDbLoading, 
    isError: isDbError,
    errorMessage: dbErrorMessage,
    hasRecord: hasContractorRecord,
    onboardingRecord,
    refetch: refetchOnboardingStatus,
  } = useContractorOnboardingStatus();
  
  const isAdmin = useIsAdmin();

  // Load real profile data from DB
  const profileId = onboardingRecord?.profile_id || null;
  const { data: dbProfile } = useContractorProfile(profileId);

  const [activeTab, setActiveTab] = useState<Tab>('pool');
  const [selectedOrder, setSelectedOrder] = useState<TechnicianOrder | null>(null);
  
  // Fetch real orders from DB
  const { data: dbOrders, isLoading: isOrdersLoading } = usePoolOrders();
  const [orders, setOrders] = useState<TechnicianOrder[]>([]);
  
  // Sync DB orders into local state (for local mutations like accept/checkin)
  useEffect(() => {
    if (dbOrders) {
      setOrders(dbOrders);
    }
  }, [dbOrders]);
  
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
      ? new Date(erstelltAm).toISOString().slice(0, 7) // "2026-01"
      : '–';

    return {
      id: profileId || '',
      name,
      email: dbProfile?.email || '–',
      phone: dbProfile?.telefon || '–',
      region: dbProfile?.ort || '–',
      avatarUrl: dbProfile?.avatarUrl,
      memberSince,
      stats: {
        totalOrders: 0,
        acceptanceRate: 0,
        rating: 0,
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
        abgenommen: 0,
        minimum: 24,
      },
    };
  }, [dbProfile, onboardingRecord, profileId]);
  
  // Preview mode for testing the onboarding flow
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Count orders per tab
  const poolCount = orders.filter(o => o.status === 'published').length;
  const bookingsCount = orders.filter(o => o.status === 'booked').length;
  const activeCount = orders.filter(o => o.status === 'in_progress').length;
  const reviewCount = orders.filter(o => ['submitted', 'in_review', 'rework_required'].includes(o.status)).length;

  const handleOrderClick = (order: TechnicianOrder) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: ObjectOrderStatusEnum) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );

    const statusMessages: Partial<Record<ObjectOrderStatusEnum, string>> = {
      booked: 'Auftrag angenommen! 🎉',
      cancelled: 'Auftrag abgelehnt',
    };

    if (statusMessages[newStatus]) {
      toast.success(statusMessages[newStatus]);
    }
    
    setSelectedOrder(null);
    
    if (newStatus === 'booked') {
      setActiveTab('bookings');
    }
  };

  const handleCheckin = (orderId: string, phase: CheckinPhase) => {
    const now = new Date().toISOString();
    
    setOrders(prev => 
      prev.map(order => {
        if (order.id !== orderId) return order;
        
        if (phase === 'vor_ort') {
          return { 
            ...order, 
            status: 'in_progress' as ObjectOrderStatusEnum,
            checkinPhase: 'vor_ort',
            vorOrtCheckinAt: now 
          };
        } else {
          return { 
            ...order, 
            checkinPhase: 'nachbearbeitung',
            nachbearbeitungCheckinAt: now 
          };
        }
      })
    );
    
    toast.success(`Check-in ${phase === 'vor_ort' ? 'Vor-Ort' : 'Nachbearbeitung'} gestartet`);
  };

  const handleCheckout = (orderId: string, phase: CheckinPhase) => {
    const now = new Date().toISOString();
    
    setOrders(prev => 
      prev.map(order => {
        if (order.id !== orderId) return order;
        
        if (phase === 'vor_ort') {
          return { ...order, vorOrtCheckoutAt: now };
        } else {
          return { 
            ...order, 
            nachbearbeitungCheckoutAt: now,
            status: 'submitted' as ObjectOrderStatusEnum,
            submittedAt: now,
          };
        }
      })
    );
    
    if (phase === 'nachbearbeitung') {
      toast.success('Auftrag zur Prüfung eingereicht! ✓');
      setActiveTab('review');
    } else {
      toast.success('Vor-Ort-Arbeit abgeschlossen');
    }
  };

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
  
  if (isDbLoading || isAdmin === undefined) {
    return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
  }

  if (isDbError && dbErrorMessage) {
    return <TechnicalErrorScreen errorMessage={dbErrorMessage} onRetry={refetchOnboardingStatus} />;
  }

  if (!hasContractorRecord && !isAdmin) {
    return <NoContractorAccessScreen userEmail={onboardingRecord?.ag_domain_email || session.user.email || undefined} />;
  }
  
  if (!hasContractorRecord && isAdmin) {
    return <OnboardingLoadingScreen message="Weiterleitung zum Admin-Bereich..." />;
  }

  if (!isDbReady || isPreviewMode) {
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

  const handleStartRework = (orderId: string) => {
    setOrders(prev =>
      prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: 'in_progress' as ObjectOrderStatusEnum,
              checkinPhase: 'nachbearbeitung' as CheckinPhase,
              nachbearbeitungCheckinAt: new Date().toISOString(),
              nachbearbeitungCheckoutAt: undefined,
            }
          : order
      )
    );
    toast.info('Nacharbeit gestartet');
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
        />
      )}
      
      {activeTab === 'active' && (
        <ActiveOrdersView 
          orders={orders} 
          onOrderClick={handleOrderClick}
          onCheckin={handleCheckin}
          onCheckout={handleCheckout}
        />
      )}
      
      {activeTab === 'review' && (
        <ReviewView 
          orders={orders} 
          onOrderClick={handleOrderClick}
        />
      )}

      {activeTab === 'forum' && (
        <ForumView />
      )}
      
      {activeTab === 'profile' && (
        <ProfileView 
          profile={profile}
          profileId={profileId}
          onSave={(updatedData) => {
            toast.success('Profil aktualisiert');
          }}
          onStartOnboardingPreview={() => {
            setIsPreviewMode(true);
            toast.info('Vorschau-Modus gestartet');
          }}
        />
      )}

      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        poolCount={poolCount}
        bookingsCount={bookingsCount}
        activeCount={activeCount}
        reviewCount={reviewCount}
      />
    </div>
  );
};

export default Index;
