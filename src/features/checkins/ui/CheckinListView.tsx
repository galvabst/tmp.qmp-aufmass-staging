import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, User, Clock } from 'lucide-react';

// Placeholder data - wird später durch Supabase-Query ersetzt
const mockCheckins = [
  { 
    id: '1', 
    contractorName: 'Max Mustermann',
    address: 'Musterstraße 123, Berlin',
    checkInAt: '2025-01-20T09:05:00',
    checkOutAt: '2025-01-20T10:45:00',
    status: 'completed',
  },
  { 
    id: '2', 
    contractorName: 'Erika Musterfrau',
    address: 'Beispielweg 45, München',
    checkInAt: '2025-01-20T14:02:00',
    checkOutAt: null,
    status: 'in_progress',
  },
];

const statusConfig = {
  in_progress: { label: 'Vor Ort', className: 'bg-status-new-bg text-status-new' },
  completed: { label: 'Abgeschlossen', className: 'bg-status-completed-bg text-status-completed' },
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function calculateDuration(checkIn: string, checkOut: string | null) {
  const start = new Date(checkIn);
  const end = checkOut ? new Date(checkOut) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
}

export function CheckinListView() {
  const activeCount = mockCheckins.filter(c => c.status === 'in_progress').length;
  
  return (
    <AdminLayout 
      title="Check-in/out" 
      subtitle={`${activeCount} aktuell vor Ort`}
    >
      <div className="space-y-3">
        {mockCheckins.map((checkin) => {
          const config = statusConfig[checkin.status as keyof typeof statusConfig];
          
          return (
            <Card key={checkin.id} className="shadow-card">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{checkin.contractorName}</p>
                      <p className="text-xs text-muted-foreground">{checkin.address}</p>
                    </div>
                  </div>
                  <Badge className={config?.className}>
                    {config?.label}
                  </Badge>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-status-accepted">
                    <LogIn className="w-4 h-4" />
                    <span>{formatTime(checkin.checkInAt)}</span>
                  </div>
                  
                  {checkin.checkOutAt ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <LogOut className="w-4 h-4" />
                      <span>{formatTime(checkin.checkOutAt)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-status-new">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span>Läuft...</span>
                    </div>
                  )}
                  
                  <div className="ml-auto text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {calculateDuration(checkin.checkInAt, checkin.checkOutAt)}
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
