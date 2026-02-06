import { useState } from 'react';
import { Plane, Smartphone, Upload, ExternalLink, CheckCircle2, X, ShoppingCart, Ruler, Star, Loader2 } from 'lucide-react';
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
  massbandStatus: EquipmentStatus;
  onDrohneChange: (status: EquipmentStatus) => void;
  onIphoneChange: (status: EquipmentStatus) => void;
  onMassbandChange: (status: EquipmentStatus) => void;
  onFileUpload: (equipId: string, file: File) => Promise<string>;
  drohneMietLink?: string;
  drohneKaufLink?: string;
  iPhoneMietLink?: string;
  iPhoneKaufLink?: string;
  massbandKaufLink?: string;
}

/** Wiederverwendbare Upload-Zone für Equipment-Nachweise */
function NachweisUploadZone({
  nachweisUrl,
  onRemove,
  onFileSelect,
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
  isUploading,
}: {
  nachweisUrl?: string;
  onRemove: () => void;
  onFileSelect: (file: File) => void;
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  isUploading: boolean;
}) {
  if (nachweisUrl) {
    return (
      <div className="flex items-center gap-3 p-3 bg-status-accepted/5 border border-status-accepted rounded-lg">
        <CheckCircle2 className="w-5 h-5 text-status-accepted" />
        <span className="flex-1 text-sm text-foreground">Nachweis hochgeladen</span>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary rounded-lg p-4">
        <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
        <span className="text-sm text-muted-foreground">Wird hochgeladen…</span>
      </div>
    );
  }

  return (
    <label
      className={cn(
        'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all',
        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30',
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
      <span className="text-sm text-muted-foreground">Foto oder PDF hochladen</span>
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

export function EquipmentStep({
  drohneStatus,
  iphoneStatus,
  massbandStatus,
  onDrohneChange,
  onIphoneChange,
  onMassbandChange,
  onFileUpload,
  drohneMietLink = 'https://drohnen-mieten.de',
  drohneKaufLink = 'https://amzn.to/46kuuoo',
  iPhoneMietLink = 'https://iphone-mieten.de',
  iPhoneKaufLink = 'https://apple.com/de/shop/buy-iphone',
  massbandKaufLink = 'https://amzn.to/4afYToT',
}: EquipmentStepProps) {
  const [drohneDragActive, setDrohneDragActive] = useState(false);
  const [iphoneDragActive, setIphoneDragActive] = useState(false);
  const [massbandDragActive, setMassbandDragActive] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleFileUpload = async (equipId: string, file: File, onChange: (s: EquipmentStatus) => void, currentStatus: EquipmentStatus) => {
    setUploadingId(equipId);
    try {
      const url = await onFileUpload(equipId, file);
      onChange({ ...currentStatus, nachweisUrl: url });
    } catch {
      // Error handling via toast in parent
    } finally {
      setUploadingId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, equipId: string, onChange: (s: EquipmentStatus) => void, currentStatus: EquipmentStatus, setDrag: (v: boolean) => void) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(equipId, file, onChange, currentStatus);
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
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
            <h3 className="font-semibold text-foreground">Drohne mit 4K Kamera</h3>
            <p className="text-sm text-muted-foreground">Für Dachaufnahmen erforderlich</p>
          </div>
        </div>

        <RadioGroup
          value={drohneStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onDrohneChange({ 
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

        {drohneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto/Kaufbeleg)</p>
            <NachweisUploadZone
              nachweisUrl={drohneStatus.nachweisUrl}
              onRemove={() => onDrohneChange({ ...drohneStatus, nachweisUrl: undefined })}
              onFileSelect={(file) => handleFileUpload('drohne', file, onDrohneChange, drohneStatus)}
              dragActive={drohneDragActive}
              onDragOver={(e) => { e.preventDefault(); setDrohneDragActive(true); }}
              onDragLeave={() => setDrohneDragActive(false)}
              onDrop={(e) => handleDrop(e, 'drohne', onDrohneChange, drohneStatus, setDrohneDragActive)}
              isUploading={uploadingId === 'drohne'}
            />
          </div>
        )}

        {!drohneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Du benötigst eine Drohne mit 4K Kamera für Dachaufnahmen.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => openExternalLink(drohneMietLink)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Drohne mieten
              </Button>
              <Button variant="default" className="flex-1 relative" onClick={() => openExternalLink(drohneKaufLink)}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Drohne kaufen
                <span className="absolute -top-2.5 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" />
                  Bessere Wahl
                </span>
              </Button>
            </div>
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
          onValueChange={(value) => onIphoneChange({
            hatEigenes: value === 'ja',
            nachweisUrl: value === 'nein' ? undefined : iphoneStatus.nachweisUrl,
          })}
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

        {iphoneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto/Screenshot)</p>
            <NachweisUploadZone
              nachweisUrl={iphoneStatus.nachweisUrl}
              onRemove={() => onIphoneChange({ ...iphoneStatus, nachweisUrl: undefined })}
              onFileSelect={(file) => handleFileUpload('iphone-lidar', file, onIphoneChange, iphoneStatus)}
              dragActive={iphoneDragActive}
              onDragOver={(e) => { e.preventDefault(); setIphoneDragActive(true); }}
              onDragLeave={() => setIphoneDragActive(false)}
              onDrop={(e) => handleDrop(e, 'iphone-lidar', onIphoneChange, iphoneStatus, setIphoneDragActive)}
              isUploading={uploadingId === 'iphone-lidar'}
            />
          </div>
        )}

        {!iphoneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Du benötigst mindestens ein iPhone 12 Pro mit LiDAR-Scanner.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => openExternalLink(iPhoneMietLink)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                iPhone mieten
              </Button>
              <Button variant="default" className="flex-1" onClick={() => openExternalLink(iPhoneKaufLink)}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                iPhone kaufen
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Maßband */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Ruler className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Maßband</h3>
            <p className="text-sm text-muted-foreground">Empfohlene Länge: mindestens 5m</p>
          </div>
        </div>

        <RadioGroup
          value={massbandStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onMassbandChange({
            hatEigenes: value === 'ja',
            nachweisUrl: value === 'nein' ? undefined : massbandStatus.nachweisUrl,
          })}
          className="space-y-3"
        >
          <div className={cn(
            'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors',
            massbandStatus.hatEigenes ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="ja" id="massband-ja" />
            <Label htmlFor="massband-ja" className="flex-1 cursor-pointer">
              Ja, ich habe bereits ein Maßband
            </Label>
          </div>
          <div className={cn(
            'flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors',
            !massbandStatus.hatEigenes ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="nein" id="massband-nein" />
            <Label htmlFor="massband-nein" className="flex-1 cursor-pointer">
              Nein, ich brauche ein Maßband
            </Label>
          </div>
        </RadioGroup>

        {massbandStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto)</p>
            <NachweisUploadZone
              nachweisUrl={massbandStatus.nachweisUrl}
              onRemove={() => onMassbandChange({ ...massbandStatus, nachweisUrl: undefined })}
              onFileSelect={(file) => handleFileUpload('massband', file, onMassbandChange, massbandStatus)}
              dragActive={massbandDragActive}
              onDragOver={(e) => { e.preventDefault(); setMassbandDragActive(true); }}
              onDragLeave={() => setMassbandDragActive(false)}
              onDrop={(e) => handleDrop(e, 'massband', onMassbandChange, massbandStatus, setMassbandDragActive)}
              isUploading={uploadingId === 'massband'}
            />
          </div>
        )}

        {!massbandStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Empfohlene Länge: mindestens 5m
            </p>
            <Button variant="default" className="w-full" onClick={() => openExternalLink(massbandKaufLink)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Unser empfohlenes Modell kaufen
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong>💡 Tipp:</strong> Die Drohne, das iPhone und das Maßband kannst du auch steuerlich absetzen!
        </p>
      </div>
    </div>
  );
}
