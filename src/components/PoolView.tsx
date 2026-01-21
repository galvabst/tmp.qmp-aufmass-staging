import { useState } from 'react';
import { Order } from '@/types/order';
import { OrderCard } from './OrderCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, List } from 'lucide-react';
import { PoolMap } from './PoolMap';

interface PoolViewProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

export function PoolView({ orders, onOrderClick }: PoolViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const poolOrders = orders.filter(order => order.status === 'published');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background safe-area-top">
        <div className="p-4 pb-2">
          <h1 className="text-2xl font-bold text-foreground">
            Verfügbare Aufträge
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {poolOrders.length} {poolOrders.length === 1 ? 'Auftrag' : 'Aufträge'} in deiner Region
          </p>
        </div>
        
        <div className="px-4 pb-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'map')}>
            <TabsList className="w-full bg-secondary">
              <TabsTrigger value="list" className="flex-1 gap-2">
                <List className="w-4 h-4" />
                Liste
              </TabsTrigger>
              <TabsTrigger value="map" className="flex-1 gap-2">
                <MapPin className="w-4 h-4" />
                Karte
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="px-4 space-y-3">
          {poolOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">Keine Aufträge verfügbar</h3>
              <p className="text-sm text-muted-foreground">
                Aktuell gibt es keine neuen Aufträge in deiner Region.
              </p>
            </div>
          ) : (
            poolOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => onOrderClick(order)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="px-4 h-[calc(100vh-180px)]">
          <PoolMap 
            orders={poolOrders} 
            onOrderClick={(orderId) => {
              const order = poolOrders.find(o => o.id === orderId);
              if (order) onOrderClick(order);
            }} 
          />
        </div>
      )}
    </div>
  );
}
