import { Upload, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NachweisUploadZoneProps {
  nachweisUrl?: string;
  onRemove: () => void;
  onFileSelect: (file: File) => void;
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  isUploading: boolean;
}

export function NachweisUploadZone({
  nachweisUrl,
  onRemove,
  onFileSelect,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  isUploading,
}: NachweisUploadZoneProps) {
  if (nachweisUrl) {
    return (
      <div className="flex items-center gap-3 p-3.5 bg-status-accepted/5 border border-status-accepted/25 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-status-accepted/10 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-status-accepted" />
        </div>
        <span className="flex-1 text-sm font-medium text-foreground">Nachweis hochgeladen</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/40 rounded-xl p-6 bg-primary/3">
        <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
        <span className="text-sm text-muted-foreground">Wird hochgeladen…</span>
      </div>
    );
  }

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all duration-200',
        dragActive
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border/60 hover:border-primary/40 hover:bg-primary/3'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
        <Upload className="w-5 h-5 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-foreground">Foto oder PDF hochladen</span>
      <span className="text-xs text-muted-foreground mt-0.5">oder per Drag & Drop ablegen</span>
      <input
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </label>
  );
}
