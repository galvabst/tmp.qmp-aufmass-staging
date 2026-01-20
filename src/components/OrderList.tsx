import { Order, OrderStatus } from '@/types/order';
import { OrderCard } from './OrderCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { ClipboardList } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  showCompleted?: boolean;
}

export function OrderList({ orders, onOrderClick, showCompleted = false }: OrderListProps) {
  const [filter, setFilter] = useState<'all' | 'new' | 'accepted'>('all');
  
  const filteredOrders = orders.filter(order => {
    if (showCompleted) {
      return order.status === 'completed' || order.status === 'rejected';
    }
    if (filter === 'all') {
      return order.status === 'new' || order.status === 'accepted';
    }
    return order.status === filter;
  });

  const newCount = orders.filter(o => o.status === 'new').length;
  const acceptedCount = orders.filter(o => o.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background safe-area-top">
        <div className="p-4 pb-2">
          <h1 className="text-2xl font-bold text-foreground">
            {showCompleted ? 'Erledigte Aufträge' : 'Meine Aufträge'}
          </h1>
          {!showCompleted && (
            <p className="text-sm text-muted-foreground mt-1">
              {newCount} neue, {acceptedCount} angenommene Aufträge
            </p>
          )}
        </div>
        
        {!showCompleted && (
          <div className="px-4 pb-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="w-full bg-secondary">
                <TabsTrigger value="all" className="flex-1">Alle</TabsTrigger>
                <TabsTrigger value="new" className="flex-1">
                  Neu {newCount > 0 && `(${newCount})`}
                </TabsTrigger>
                <TabsTrigger value="accepted" className="flex-1">
                  Angenommen
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </header>

      {/* Order List */}
      <div className="px-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Keine Aufträge</h3>
            <p className="text-sm text-muted-foreground">
              {showCompleted 
                ? 'Sie haben noch keine erledigten Aufträge.' 
                : 'Aktuell keine Aufträge in dieser Kategorie.'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
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
