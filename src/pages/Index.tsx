import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { OrderList } from '@/components/OrderList';
import { OrderDetail } from '@/components/OrderDetail';
import { ProfileView } from '@/components/ProfileView';
import { mockOrders } from '@/data/mockOrders';
import { Order, OrderStatus } from '@/types/order';
import { toast } from 'sonner';

type Tab = 'orders' | 'completed' | 'profile';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const newOrdersCount = orders.filter(o => o.status === 'new').length;

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
      accepted: 'Auftrag angenommen',
      rejected: 'Auftrag abgelehnt',
      completed: 'Auftrag als erledigt markiert',
      new: '',
    };

    toast.success(statusMessages[newStatus]);
    setSelectedOrder(null);
  };

  // Show order detail if selected
  if (selectedOrder) {
    // Get the latest version of the order from state
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
        newOrdersCount={newOrdersCount}
      />
    </div>
  );
};

export default Index;
