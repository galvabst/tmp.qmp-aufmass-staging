import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin } from 'lucide-react';

// Placeholder data - wird später durch Supabase-Query ersetzt
const mockBookings = [
  { 
    id: '1', 
    contractorName: 'Max Mustermann',
    address: 'Musterstraße 123, 10115 Berlin',
    type: 'thermocheck',
    bookedAt: '2025-01-20T10:30:00',
    slotDate: '2025-01-22',
    slotTime: '09:00 - 11:00',
    status: 'confirmed',
  },
  { 
    id: '2', 
    contractorName: 'Erika Musterfrau',
    address: 'Beispielweg 45, 80331 München',
    type: 'pv',
    bookedAt: '2025-01-19T14:15:00',
    slotDate: '2025-01-21',
    slotTime: '14:00 - 16:00',
    status: 'pending',
  },
];

const statusConfig = {
  confirmed: { label: 'Bestätigt', className: 'bg-status-accepted-bg text-status-accepted' },
  pending: { label: 'Ausstehend', className: 'bg-status-new-bg text-status-new' },
  cancelled: { label: 'Storniert', className: 'bg-status-rejected-bg text-status-rejected' },
};

export function BookingListView() {
  return (
    <AdminLayout 
      title="Buchungen" 
      subtitle={`${mockBookings.length} aktive Buchungen`}
    >
      <div className="space-y-3">
        {mockBookings.map((booking) => {
          const config = statusConfig[booking.status as keyof typeof statusConfig];
          const bookedDate = new Date(booking.bookedAt);
          
          return (
            <Card key={booking.id} className="shadow-card">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{booking.contractorName}</p>
                      <p className="text-xs text-muted-foreground">
                        Gebucht am {bookedDate.toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <Badge className={config?.className}>
                    {config?.label}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="text-foreground">{booking.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">
                      {new Date(booking.slotDate).toLocaleDateString('de-DE', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit' 
                      })} • {booking.slotTime}
                    </span>
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
