import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Euro } from 'lucide-react';

// Placeholder data - wird später durch Supabase-Query ersetzt
const mockOrders = [
  { 
    id: '1', 
    address: 'Musterstraße 123', 
    city: 'Berlin', 
    postalCode: '10115',
    type: 'thermocheck',
    status: 'published',
    amount: 180,
  },
  { 
    id: '2', 
    address: 'Beispielweg 45', 
    city: 'München', 
    postalCode: '80331',
    type: 'pv',
    status: 'booked',
    amount: 150,
  },
  { 
    id: '3', 
    address: 'Testgasse 7', 
    city: 'Hamburg', 
    postalCode: '20095',
    type: 'thermocheck',
    status: 'draft',
    amount: 160,
  },
];

const statusConfig = {
  draft: { label: 'Entwurf', className: 'bg-muted text-muted-foreground' },
  published: { label: 'Im Pool', className: 'bg-primary/10 text-primary' },
  booked: { label: 'Gebucht', className: 'bg-status-accepted-bg text-status-accepted' },
  in_progress: { label: 'In Arbeit', className: 'bg-status-new-bg text-status-new' },
  submitted: { label: 'Eingereicht', className: 'bg-secondary text-secondary-foreground' },
  approved: { label: 'Abgenommen', className: 'bg-status-accepted-bg text-status-accepted' },
};

const typeLabels = {
  thermocheck: 'Thermocheck',
  pv: 'PV',
  einweisung: 'Einweisung',
};

export function ObjectOrderListView() {
  return (
    <AdminLayout 
      title="Objektaufträge" 
      subtitle="Pool-Verwaltung"
    >
      {/* Add Button */}
      <Button className="w-full mb-4 gap-2">
        <Plus className="w-4 h-4" />
        Neuer Auftrag
      </Button>

      {/* Orders List */}
      <div className="space-y-3">
        {mockOrders.map((order) => {
          const config = statusConfig[order.status as keyof typeof statusConfig];
          
          return (
            <Card key={order.id} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{order.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.postalCode} {order.city}
                      </p>
                    </div>
                  </div>
                  <Badge className={config?.className}>
                    {config?.label || order.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Badge variant="outline">
                    {typeLabels[order.type as keyof typeof typeLabels] || order.type}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Euro className="w-3.5 h-3.5" />
                    {order.amount.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
