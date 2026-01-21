import { useState } from 'react';
import { FileText, Upload, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DocumentsStepProps {
  gewerbescheinUrl?: string;
  onGewerbescheinUpload: (file: File) => void;
  onRemoveGewerbeschein: () => void;
}

export function DocumentsStep({ 
  gewerbescheinUrl, 
  onGewerbescheinUpload,
  onRemoveGewerbeschein,
}: DocumentsStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onGewerbescheinUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onGewerbescheinUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex gap-3">
          <FileText className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Gewerbeschein erforderlich</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gemäß § 9 des Vertrags musst du einen gültigen Gewerbeschein hochladen, 
              der dich zur selbstständigen Tätigkeit berechtigt.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-card rounded-xl p-6 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">Gewerbeschein hochladen</h3>
        
        {gewerbescheinUrl ? (
          // Uploaded state
          <div className="border-2 border-status-accepted rounded-xl p-4 bg-status-accepted/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-status-accepted/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-status-accepted" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Gewerbeschein hochgeladen</p>
                <p className="text-sm text-muted-foreground">Dokument erfolgreich gespeichert</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onRemoveGewerbeschein}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ) : (
          // Upload dropzone
          <label
            className={cn(
              'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all',
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Datei hochladen</p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF, JPG oder PNG (max. 10 MB)
            </p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Hinweise */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h4 className="font-medium text-foreground mb-3">Bitte achte auf:</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Vollständige Lesbarkeit aller Angaben</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Gültigkeitsdatum muss aktuell sein</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Dein Name muss mit deinem Profil übereinstimmen</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
