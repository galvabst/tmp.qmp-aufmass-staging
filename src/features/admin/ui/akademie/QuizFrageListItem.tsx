import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminQuizFrage } from '../../hooks/useAdminAkademieModule';

interface Props {
  frage: AdminQuizFrage;
  onEdit: (frage: AdminQuizFrage) => void;
  onToggleActive: (frage: AdminQuizFrage) => void;
}

export function QuizFrageListItem({ frage, onEdit, onToggleActive }: Props) {
  const correctCount = (frage.antworten as any[]).filter((a: any) => a.korrekt).length;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md border bg-card text-card-foreground">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{frage.frage}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {(frage.antworten as any[]).length} Antw. · {correctCount} korrekt
          </span>
          <span className="text-xs font-mono text-muted-foreground">#{frage.reihenfolge}</span>
          {!frage.ist_aktiv && (
            <Badge variant="secondary" className="text-[10px] h-4">Inaktiv</Badge>
          )}
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleActive(frage)}>
        {frage.ist_aktiv ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(frage)}>
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}
