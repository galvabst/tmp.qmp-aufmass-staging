import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav, Tab } from '@/components/BottomNav';
import { PoolView } from '@/components/PoolView';
import { BookingsView } from '@/components/BookingsView';
import { ActiveOrdersView } from '@/components/ActiveOrdersView';
import { ReviewView } from '@/components/ReviewView';
import { ProfileView } from '@/components/ProfileView';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { TechnicianOrderDetail } from '@/components/TechnicianOrderDetail';
import { mockTechnicianOrders, mockTechnicianProfile } from '@/data/mockTechnicianData';
import { TechnicianOrder, CheckinPhase } from '@/types/technician';
import { ObjectOrderStatusEnum } from '@/lib/enums';
import { toast } from 'sonner';
import { useContractorOnboardingStatus } from '@/hooks/useContractorOnboardingStatus';
import { useIsAdmin } from '@/hooks/useIAM';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { OnboardingLoadingScreen } from '@/components/ui/OnboardingLoadingScreen';
import { NoContractorAccessScreen } from '@/components/ui/NoContractorAccessScreen';
import { AuthRequiredScreen } from '@/components/ui/AuthRequiredScreen';
import { TechnicalErrorScreen } from '@/components/ui/TechnicalErrorScreen';

const STORAGE_KEY = 'thermocheck_onboarding_state_v2';

// Load profile data from onboarding state (localStorage)
const loadOnboardingProfile = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      return state.profil;
    }
  } catch (e) {
    console.warn('Failed to load onboarding profile', e);
  }
  return null;
};

// Load onboarding completion status from localStorage
const loadOnboardingStatus = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      return {
        isCompleted: state.coachingAbgeschlossen || false,
        completedSteps: state.completedSteps || [],
        currentStep: state.currentStep,
      };
    }
  } catch (e) {
    console.warn('Failed to load onboarding status', e);
  }
  return null;
};

const Index = () => {
  const navigate = useNavigate();
  
  // ============================================
  // SESSION + DB-FIRST ONBOARDING STATUS CHECK + IAM
  // ============================================
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

  const [activeTab, setActiveTab] = useState<Tab>('pool');
  const [selectedOrder, setSelectedOrder] = useState<TechnicianOrder | null>(null);
  const [orders, setOrders] = useState<TechnicianOrder[]>(mockTechnicianOrders);
  
  // Merge onboarding profile with mock data
  const [profile, setProfile] = useState(() => {
    const onboardingProfile = loadOnboardingProfile();
    const onboardingStatus = loadOnboardingStatus();
    
    // If onboarding is completed, mark it as such
    const onboarding = onboardingStatus?.isCompleted 
      ? { ...mockTechnicianProfile.onboarding, isCompleted: true, progressPercent: 100 }
      : mockTechnicianProfile.onboarding;
    
    return {
      ...mockTechnicianProfile,
      name: onboardingProfile 
        ? `${onboardingProfile.vorname} ${onboardingProfile.nachname}` 
        : mockTechnicianProfile.name,
      avatarUrl: onboardingProfile?.avatarUrl || mockTechnicianProfile.avatarUrl,
      email: onboardingProfile?.email || mockTechnicianProfile.email,
      phone: onboardingProfile?.telefon || mockTechnicianProfile.phone,
      onboarding,
    };
  });
  
  // Preview mode for testing the onboarding flow
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // NOTE: We no longer use a local "onboardingComplete" state.
  // The DB (isDbReady) is the SINGLE SOURCE OF TRUTH.
  // Local state was causing bugs where localStorage said "complete" 
  // but DB said "not ready".

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
          // Both phases complete -> submit for review
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

  // ============================================
  // ADMIN REDIRECT EFFECT (before early returns!)
  // ============================================
  useEffect(() => {
    if (isAdmin === true && !hasContractorRecord && !isDbLoading && session) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, hasContractorRecord, isDbLoading, navigate, session]);

  // ============================================
  // DB-FIRST RENDERING LOGIC + AUTH
  // ============================================
  
  // 0. Show loading screen while checking session
  if (isSessionLoading) {
    return <OnboardingLoadingScreen message="Prüfe Anmeldung..." />;
  }
  
  // 1. If no session exists, show auth required screen
  if (!session) {
    return <AuthRequiredScreen />;
  }
  
  // 2. Show loading screen while checking DB status OR IAM roles
  if (isDbLoading || isAdmin === undefined) {
    return <OnboardingLoadingScreen message="Prüfe Zugriffsrechte..." />;
  }

  // 2.5 If there was a technical error fetching onboarding status, show error screen
  if (isDbError && dbErrorMessage) {
    return <TechnicalErrorScreen errorMessage={dbErrorMessage} onRetry={refetchOnboardingStatus} />;
  }

  // 3. If no contractor record exists AND not admin, show access denied
  // (Admins get redirected by the useEffect above)
  if (!hasContractorRecord && !isAdmin) {
    return <NoContractorAccessScreen userEmail={onboardingRecord?.ag_domain_email || session.user.email || undefined} />;
  }
  
  // 4. Admin without contractor record - show brief loading while redirect happens
  if (!hasContractorRecord && isAdmin) {
    return <OnboardingLoadingScreen message="Weiterleitung zum Admin-Bereich..." />;
  }

  // 4. If DB says NOT ready (not 'ready' status OR no trainer approval), show onboarding
  // DB is the SINGLE SOURCE OF TRUTH - localStorage does NOT determine ready status!
  // Preview mode bypasses this check for testing purposes
  if (!isDbReady || isPreviewMode) {
    console.log('[Index] Showing onboarding:', { 
      isDbReady, 
      isPreviewMode,
      dbStatus: onboardingRecord?.onboarding_status,
      trainerFreigabe: onboardingRecord?.trainer_freigabe,
    });
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
        } : undefined}
        onComplete={() => {
          if (isPreviewMode) {
            setIsPreviewMode(false);
            return;
          }
          
          // NOTE: We don't set any local "complete" state anymore.
          // The DB status is the SSOT - onComplete just syncs profile data
          // and shows a success message. The actual ready-check happens 
          // on next render via isDbReady from the DB.
          
          // Sync profile with onboarding data
          const onboardingProfile = loadOnboardingProfile();
          if (onboardingProfile) {
            setProfile(prev => ({
              ...prev,
              name: `${onboardingProfile.vorname} ${onboardingProfile.nachname}`,
              avatarUrl: onboardingProfile.avatarUrl,
              email: onboardingProfile.email,
              phone: onboardingProfile.telefon,
            }));
          }
          
          toast.success('Onboarding abgeschlossen – bitte warte auf Trainer-Freigabe! 🎓');
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

  // Show order detail if selected
  if (selectedOrder) {
    const currentOrder = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    // Pool-Auftraege zeigen keine vollen Details
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
      
      {activeTab === 'profile' && (
        <ProfileView 
          profile={profile} 
          onSave={(updatedData) => {
            // For now, just show a toast - later this would persist to Supabase
            toast.success('Profil aktualisiert');
            console.log('Profile update:', updatedData);
          }}
          // NOTE: onStartOnboarding removed - DB controls onboarding state now
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
