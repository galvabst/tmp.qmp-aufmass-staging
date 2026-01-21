import { Order } from '@/types/order';
import { OrderCard } from './OrderCard';
import { ClipboardList } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  showCompleted?: boolean;
}

export function OrderList({ orders, onOrderClick, showCompleted = false }: OrderListProps) {
  const filteredOrders = orders.filter(order => {
    if (showCompleted) {
      return order.status === 'completed' || order.status === 'rejected';
    }
    // Show only accepted orders in "Meine Aufträge"
    return order.status === 'accepted';
  });

  // Sort by scheduled date (nearest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background safe-area-top">
        <div className="p-4 pb-3">
          <h1 className="text-2xl font-bold text-foreground">
            {showCompleted ? 'Erledigte Aufträge' : 'Meine Aufträge'}
          </h1>
          {!showCompleted && (
            <p className="text-sm text-muted-foreground mt-1">
              {sortedOrders.length} {sortedOrders.length === 1 ? 'Auftrag' : 'Aufträge'} angenommen
            </p>
          )}
        </div>
      </header>

      {/* Order List */}
      <div className="px-4 space-y-3">
        {sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Keine Aufträge</h3>
            <p className="text-sm text-muted-foreground">
              {showCompleted 
                ? 'Du hast noch keine erledigten Aufträge.' 
                : 'Du hast noch keine Aufträge angenommen. Schau im Pool nach!'}
            </p>
          </div>
        ) : (
          sortedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => onOrderClick(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}
