import { AdminLayout } from '@/features/admin/ui/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Clock, AlertTriangle, CheckCircle2, XCircle, User } from 'lucide-react';

// Placeholder data - wird später durch Supabase-Query ersetzt
const mockQueue = [
  { 
    id: '1', 
    contractorName: 'Max Mustermann',
    address: 'Musterstraße 123, Berlin',
    type: 'thermocheck',
    submittedAt: '2025-01-20T11:00:00',
    version: 1,
    isComplete: true,
    status: 'pending',
  },
  { 
    id: '2', 
    contractorName: 'Erika Musterfrau',
    address: 'Beispielweg 45, München',
    type: 'pv',
    submittedAt: '2025-01-19T16:30:00',
    version: 2,
    isComplete: true,
    status: 'pending',
  },
  { 
    id: '3', 
    contractorName: 'Hans Schmidt',
    address: 'Testgasse 7, Hamburg',
    type: 'thermocheck',
    submittedAt: '2025-01-18T09:15:00',
    version: 1,
    isComplete: false,
    status: 'incomplete',
  },
];

const statusConfig = {
  pending: { label: 'Zur Prüfung', className: 'bg-status-new-bg text-status-new', icon: Clock },
  incomplete: { label: 'Unvollständig', className: 'bg-status-rejected-bg text-status-rejected', icon: AlertTriangle },
  approved: { label: 'Abgenommen', className: 'bg-status-accepted-bg text-status-accepted', icon: CheckCircle2 },
  rejected: { label: 'K.O.', className: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export function QGQueueView() {
  const pendingCount = mockQueue.filter(q => q.status === 'pending').length;
  
  return (
    <AdminLayout 
      title="Quality Gate" 
      subtitle={`${pendingCount} zur Prüfung`}
    >
      <div className="space-y-3">
        {mockQueue.map((item) => {
          const config = statusConfig[item.status as keyof typeof statusConfig];
          const StatusIcon = config?.icon || FileCheck;
          const submittedDate = new Date(item.submittedAt);
          
          return (
            <Card key={item.id} className="shadow-card">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.contractorName}</p>
                      <p className="text-xs text-muted-foreground">{item.address}</p>
                    </div>
                  </div>
                  <Badge className={config?.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {config?.label}
                  </Badge>
                </div>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>
                    Eingereicht: {submittedDate.toLocaleDateString('de-DE')} • v{item.version}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.type.toUpperCase()}
                  </Badge>
                </div>

                {/* Actions */}
                {item.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Prüfen
                    </Button>
                  </div>
                )}
                
                {item.status === 'incomplete' && (
                  <div className="p-2 bg-status-rejected-bg rounded-md text-sm text-status-rejected">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Vollständigkeitsprüfung fehlgeschlagen
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
