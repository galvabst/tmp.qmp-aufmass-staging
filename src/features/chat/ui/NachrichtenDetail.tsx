import { ArrowLeft } from 'lucide-react';
import { AuftragChatSection } from '@/features/chat/ui/AuftragChatSection';

interface NachrichtenDetailProps {
  auftragId: string;
  kundenName: string;
  onBack: () => void;
}

export function NachrichtenDetail({ auftragId, kundenName, onBack }: NachrichtenDetailProps) {
  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card sticky top-0 z-10">
        <button onClick={onBack} className="p-1 -ml-1 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{kundenName}</p>
          <p className="text-xs text-muted-foreground">Auftragsnachrichten</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 pb-20">
        <AuftragChatSection auftragId={auftragId} />
      </div>
    </div>
  );
}
