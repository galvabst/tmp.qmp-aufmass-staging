import { useState } from 'react';
import { BottomNav, Tab } from '@/components/BottomNav';
import { PoolView } from '@/components/PoolView';
import { OrderList } from '@/components/OrderList';
import { OrderDetail } from '@/components/OrderDetail';
import { ProfileView } from '@/components/ProfileView';
import { mockOrders } from '@/data/mockOrders';
import { Order, OrderStatus } from '@/types/order';
import { toast } from 'sonner';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pool');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const poolCount = orders.filter(o => o.status === 'published').length;
  const ordersCount = orders.filter(o => o.status === 'accepted').length;

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );

    const statusMessages: Record<OrderStatus, string> = {
      accepted: 'Auftrag angenommen! 🎉',
      rejected: 'Auftrag abgelehnt',
      completed: 'Auftrag als erledigt markiert ✓',
      published: '',
    };

    toast.success(statusMessages[newStatus]);
    setSelectedOrder(null);
    
    // Navigate to orders tab when accepting
    if (newStatus === 'accepted') {
      setActiveTab('orders');
    }
  };

  // Show order detail if selected
  if (selectedOrder) {
    const currentOrder = orders.find(o => o.id === selectedOrder.id) || selectedOrder;
    return (
      <OrderDetail
        order={currentOrder}
        onBack={handleBack}
        onStatusChange={handleStatusChange}
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
      
      {activeTab === 'orders' && (
        <OrderList 
          orders={orders} 
          onOrderClick={handleOrderClick}
          showCompleted={false}
        />
      )}
      
      {activeTab === 'completed' && (
        <OrderList 
          orders={orders} 
          onOrderClick={handleOrderClick}
          showCompleted={true}
        />
      )}
      
      {activeTab === 'profile' && (
        <ProfileView />
      )}

      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        poolCount={poolCount}
        ordersCount={ordersCount}
      />
    </div>
  );
};

export default Index;
