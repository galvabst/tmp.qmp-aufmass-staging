import { Pencil, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminQuizFrage } from '../../hooks/useAdminAkademieModule';

interface Props {
  frage: AdminQuizFrage;
  onEdit: (frage: AdminQuizFrage) => void;
  onToggleActive: (frage: AdminQuizFrage) => void;
}

export function QuizFrageListItem({ frage, onEdit, onToggleActive }: Props) {
  return (
    <div className="py-2 px-3 rounded-md border bg-card text-card-foreground space-y-1.5">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{frage.frage}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs font-mono text-muted-foreground">#{frage.reihenfolge}</span>
            {!frage.ist_aktiv && (
              <Badge variant="secondary" className="text-[10px] h-4">Inaktiv</Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onToggleActive(frage)}>
          {frage.ist_aktiv ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => onEdit(frage)}>
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
      <ul className="space-y-0.5 pl-1">
        {(frage.antworten as any[]).map((a: any, idx: number) => (
          <li key={idx} className={`flex items-center gap-1.5 text-xs ${a.korrekt ? 'text-green-700' : 'text-muted-foreground'}`}>
            {a.korrekt ? <Check className="w-3 h-3 flex-shrink-0" /> : <X className="w-3 h-3 flex-shrink-0" />}
            <span>{a.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}