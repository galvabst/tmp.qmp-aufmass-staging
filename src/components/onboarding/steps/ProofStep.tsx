import { useState } from 'react';
import { CheckSquare, Upload, Camera, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ProofStepProps {
  checkliste: Record<string, boolean>;
  onChecklistChange: (key: string, value: boolean) => void;
  gesamtfotoUrl?: string;
  onGesamtfotoUpload: (file: File) => void;
  onRemoveGesamtfoto: () => void;
}

const CHECKLIST_ITEMS = [
  { key: 'kleidung-erhalten', label: 'Arbeitskleidung erhalten (Zipper, Hausschuhe)' },
  { key: 'utensilien-komplett', label: 'Alle Pflichtutensilien vollständig' },
  { key: 'drohnen-fuehrerschein', label: 'EU-Drohnenführerschein vorhanden' },
];

export function ProofStep({
  checkliste,
  onChecklistChange,
  gesamtfotoUrl,
  onGesamtfotoUpload,
  onRemoveGesamtfoto,
}: ProofStepProps) {
  const [dragActive, setDragActive] = useState(false);

  const allChecked = CHECKLIST_ITEMS.every(item => checkliste[item.key]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onGesamtfotoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onGesamtfotoUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex gap-3">
          <CheckSquare className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Ausstattung bestätigen</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Bestätige, dass du alle Artikel erhalten hast und lade ein Gesamtfoto hoch.
            </p>
          </div>
        </div>
      </div>

      {/* Checkliste */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-4">Checkliste</h3>
        
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.key}
              className={cn(
                'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                checkliste[item.key] 
                  ? 'border-status-accepted bg-status-accepted/5' 
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => onChecklistChange(item.key, !checkliste[item.key])}
            >
              <Checkbox
                id={item.key}
                checked={checkliste[item.key] || false}
                onCheckedChange={(checked) => onChecklistChange(item.key, !!checked)}
              />
              <Label htmlFor={item.key} className="flex-1 cursor-pointer">
                {item.label}
              </Label>
              {checkliste[item.key] && (
                <CheckCircle2 className="w-5 h-5 text-status-accepted" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gesamtfoto Upload */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-2">Gesamtfoto hochladen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ein Foto mit allen Utensilien (Kleidung, Drohne, iPhone, Scanner)
        </p>

        {gesamtfotoUrl ? (
          <div className="relative">
            <img
              src={gesamtfotoUrl}
              alt="Ausstattung Gesamtfoto"
              className="w-full rounded-lg object-cover max-h-64"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={onRemoveGesamtfoto}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 mt-3 p-3 bg-status-accepted/5 border border-status-accepted rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-status-accepted" />
              <span className="text-sm text-foreground">Foto hochgeladen</span>
            </div>
          </div>
        ) : (
          <label
            className={cn(
              'flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all',
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/30 hover:border-primary/50'
            )}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Foto aufnehmen oder hochladen</p>
            <p className="text-sm text-muted-foreground mt-1">JPG oder PNG</p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
}
