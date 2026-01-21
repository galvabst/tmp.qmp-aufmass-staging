import { useState } from 'react';
import { Plane, Smartphone, Upload, ExternalLink, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface EquipmentStatus {
  hatEigenes: boolean;
  nachweisUrl?: string;
}

interface EquipmentStepProps {
  drohneStatus: EquipmentStatus;
  iphoneStatus: EquipmentStatus;
  onDrohneChange: (status: EquipmentStatus) => void;
  onIphoneChange: (status: EquipmentStatus) => void;
  drohneMietLink?: string;
  iphoneKaufLink?: string;
}

export function EquipmentStep({
  drohneStatus,
  iphoneStatus,
  onDrohneChange,
  onIphoneChange,
  drohneMietLink = 'https://drohnen-mieten.de',
  iphoneKaufLink = 'https://apple.com/de/shop/buy-iphone',
}: EquipmentStepProps) {
  const [drohneDragActive, setDrohneDragActive] = useState(false);

  const handleDrohneFileUpload = (file: File) => {
    // Mock URL - in production würde hier ein echter Upload stattfinden
    const mockUrl = URL.createObjectURL(file);
    onDrohneChange({ ...drohneStatus, nachweisUrl: mockUrl });
  };

  const handleDrohneFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrohneDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleDrohneFileUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Drohne */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Drohne mit Kamera</h3>
            <p className="text-sm text-muted-foreground">Für Dachaufnahmen erforderlich</p>
          </div>
        </div>

        <RadioGroup
          value={drohneStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onDrohneChange({ 
            ...drohneStatus, 
            hatEigenes: value === 'ja',
            nachweisUrl: value === 'nein' ? undefined : drohneStatus.nachweisUrl,
          })}
          className="space-y-3"
        >
          <div className={cn(
            'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors',
            drohneStatus.hatEigenes ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="ja" id="drohne-ja" />
            <Label htmlFor="drohne-ja" className="flex-1 cursor-pointer">
              Ja, ich habe bereits eine Drohne
            </Label>
          </div>
          
          <div className={cn(
            'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors',
            !drohneStatus.hatEigenes ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="nein" id="drohne-nein" />
            <Label htmlFor="drohne-nein" className="flex-1 cursor-pointer">
              Nein, ich brauche eine Drohne
            </Label>
          </div>
        </RadioGroup>

        {/* Nachweis Upload wenn Drohne vorhanden */}
        {drohneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto/Kaufbeleg)</p>
            
            {drohneStatus.nachweisUrl ? (
              <div className="flex items-center gap-3 p-3 bg-status-accepted/5 border border-status-accepted rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-status-accepted" />
                <span className="flex-1 text-sm text-foreground">Nachweis hochgeladen</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDrohneChange({ ...drohneStatus, nachweisUrl: undefined })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label
                className={cn(
                  'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all',
                  drohneDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
                )}
                onDragOver={(e) => { e.preventDefault(); setDrohneDragActive(true); }}
                onDragLeave={() => setDrohneDragActive(false)}
                onDrop={handleDrohneFileDrop}
              >
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Foto oder PDF hochladen</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDrohneFileUpload(file);
                  }}
                />
              </label>
            )}
          </div>
        )}

        {/* Miet-Link wenn keine Drohne */}
        {!drohneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(drohneMietLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Drohne mieten
            </Button>
          </div>
        )}
      </div>

      {/* iPhone mit LiDAR */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">iPhone mit LiDAR</h3>
            <p className="text-sm text-muted-foreground">iPhone 12 Pro oder neuer für 3D-Scans</p>
          </div>
        </div>

        <RadioGroup
          value={iphoneStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onIphoneChange({ hatEigenes: value === 'ja' })}
          className="space-y-3"
        >
          <div className={cn(
            'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors',
            iphoneStatus.hatEigenes ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="ja" id="iphone-ja" />
            <Label htmlFor="iphone-ja" className="flex-1 cursor-pointer">
              Ja, ich habe ein kompatibles iPhone
            </Label>
          </div>
          
          <div className={cn(
            'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors',
            !iphoneStatus.hatEigenes ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="nein" id="iphone-nein" />
            <Label htmlFor="iphone-nein" className="flex-1 cursor-pointer">
              Nein, ich brauche ein iPhone
            </Label>
          </div>
        </RadioGroup>

        {/* Kauf-Link wenn kein iPhone */}
        {!iphoneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Du benötigst mindestens ein iPhone 12 Pro mit LiDAR-Scanner.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(iphoneKaufLink, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              iPhone kaufen
            </Button>
          </div>
        )}

        {iphoneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-3 p-3 bg-status-accepted/5 border border-status-accepted rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-status-accepted" />
              <span className="text-sm text-foreground">iPhone bestätigt</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
