import { useState } from 'react';
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

// Load profile data from onboarding state (localStorage)
const loadOnboardingProfile = () => {
  try {
    const saved = localStorage.getItem('thermocheck_onboarding_state');
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
    const saved = localStorage.getItem('thermocheck_onboarding_state');
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
  
  // Onboarding state
  const [onboardingComplete, setOnboardingComplete] = useState(false);
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

  // Show onboarding screen if not complete or in preview mode
  if (!onboardingComplete || isPreviewMode) {
    return (
      <OnboardingScreen 
        isPreview={isPreviewMode}
        onExitPreview={() => {
          setIsPreviewMode(false);
          toast.info('Vorschau beendet');
        }}
        onComplete={() => {
          if (isPreviewMode) {
            setIsPreviewMode(false);
            return;
          }
          
          setOnboardingComplete(true);
          
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
          
          toast.success('Willkommen bei Thermocheck! 🎉');
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
          onStartOnboarding={() => setOnboardingComplete(false)}
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
