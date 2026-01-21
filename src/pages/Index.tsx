import { useState } from 'react';
import { BottomNav, Tab } from '@/components/BottomNav';
import { PoolView } from '@/components/PoolView';
import { BookingsView } from '@/components/BookingsView';
import { ActiveOrdersView } from '@/components/ActiveOrdersView';
import { ReviewView } from '@/components/ReviewView';
import { ProfileView } from '@/components/ProfileView';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { TechnicianOrderDetail } from '@/components/TechnicianOrderDetail';
import { mockTechnicianOrders, mockTechnicianProfile, mockOnboardingProgress } from '@/data/mockTechnicianData';
import { TechnicianOrder, CheckinPhase } from '@/types/technician';
import { ObjectOrderStatusEnum } from '@/lib/enums';
import { toast } from 'sonner';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pool');
  const [selectedOrder, setSelectedOrder] = useState<TechnicianOrder | null>(null);
  const [orders, setOrders] = useState<TechnicianOrder[]>(mockTechnicianOrders);
  const [profile] = useState(mockTechnicianProfile);
  
  // For demo: toggle onboarding completion
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState(mockOnboardingProgress);

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

  const handleBookTraining = (stepId: string) => {
    toast.info(`Termin für ${stepId} buchen...`);
  };

  // Show onboarding screen if not complete
  if (!onboardingComplete) {
    return (
      <OnboardingScreen 
        progress={onboardingProgress}
        onBookTraining={handleBookTraining}
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
    return (
      <TechnicianOrderDetail
        order={currentOrder}
        onBack={handleBack}
        onAccept={() => handleStatusChange(currentOrder.id, 'booked')}
        onReject={() => handleStatusChange(currentOrder.id, 'cancelled')}
        onStartCheckin={(phase) => handleCheckin(currentOrder.id, phase)}
        onCheckout={(phase) => handleCheckout(currentOrder.id, phase)}
        onStartRework={() => handleStartRework(currentOrder.id)}
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
        <ProfileView profile={profile} />
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
