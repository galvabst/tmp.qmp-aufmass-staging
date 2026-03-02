import { Video, FileText, Eye, EyeOff, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdminLektion } from '../../hooks/useAdminAkademieModule';

interface LektionListItemProps {
  lektion: AdminLektion;
  onEdit: (lektion: AdminLektion) => void;
  onToggleActive: (lektion: AdminLektion) => void;
}

export function LektionListItem({ lektion, onEdit, onToggleActive }: LektionListItemProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors',
        lektion.ist_aktiv
          ? 'bg-card border-border'
          : 'bg-muted/50 border-border/50 opacity-70'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {lektion.video_url ? (
          <Video className="w-4 h-4 text-primary" />
        ) : (
          <FileText className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{lektion.code}</span>
          {!lektion.ist_aktiv && (
            <Badge variant="secondary" className="text-[10px] h-4">Inaktiv</Badge>
          )}
        </div>
        <p className="text-sm font-medium truncate">{lektion.titel}</p>
        {lektion.video_dauer_minuten && (
          <span className="text-xs text-muted-foreground">{lektion.video_dauer_minuten} Min.</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleActive(lektion)}
          title={lektion.ist_aktiv ? 'Deaktivieren' : 'Aktivieren'}
        >
          {lektion.ist_aktiv ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(lektion)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
