import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function TrainerBadge() {
  return (
    <Badge 
      variant="outline" 
      className="border-[hsl(var(--status-accepted))] text-[hsl(var(--status-accepted))] bg-[hsl(var(--status-accepted-bg))] text-[10px] gap-1 px-1.5 py-0"
    >
      <Shield className="w-3 h-3" />
      Trainer
    </Badge>
  );
}
