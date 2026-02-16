import { useState } from 'react';
import { Plane, Smartphone, Upload, ExternalLink, CheckCircle2, X, ShoppingCart, Ruler, Star, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { NachweisUploadZone } from './equipment/NachweisUploadZone';
import { EquipmentCard } from './equipment/EquipmentCard';

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
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);

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

  const handleDrop = (e: React.DragEvent, equipId: string, onChange: (s: EquipmentStatus) => void, currentStatus: EquipmentStatus) => {
    e.preventDefault();
    setDragActiveId(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(equipId, file, onChange, currentStatus);
  };

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const completedCount = [drohneStatus, iphoneStatus, massbandStatus].filter(
    s => s.hatEigenes && s.nachweisUrl
  ).length;

  return (
    <div className="space-y-5">
      {/* Progress summary */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex gap-1.5">
          {[drohneStatus, iphoneStatus, massbandStatus].map((s, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 w-8 rounded-full transition-all duration-500',
                s.hatEigenes && s.nachweisUrl
                  ? 'bg-status-accepted'
                  : s.hatEigenes
                    ? 'bg-primary/60'
                    : 'bg-border'
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/3 bestätigt
        </span>
      </div>

      {/* Drohne */}
      <EquipmentCard
        icon={Plane}
        title="Drohne mit 4K Kamera"
        subtitle="Für Dachaufnahmen erforderlich"
        isCompleted={!!drohneStatus.nachweisUrl}
        stepNumber={1}
      >
        <RadioGroup
          value={drohneStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onDrohneChange({
            hatEigenes: value === 'ja',
            nachweisUrl: value === 'nein' ? undefined : drohneStatus.nachweisUrl,
          })}
          className="space-y-2.5"
        >
          <label className={cn(
            'flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-200',
            drohneStatus.hatEigenes
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-muted-foreground/30'
          )}>
            <RadioGroupItem value="ja" id="drohne-ja" />
            <span className="text-sm font-medium text-foreground">Ja, ich habe bereits eine Drohne</span>
          </label>
          <label className={cn(
            'flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-200',
            !drohneStatus.hatEigenes
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-muted-foreground/30'
          )}>
            <RadioGroupItem value="nein" id="drohne-nein" />
            <span className="text-sm font-medium text-foreground">Nein, ich brauche eine Drohne</span>
          </label>
        </RadioGroup>

        {drohneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto/Kaufbeleg)</p>
            <NachweisUploadZone
              nachweisUrl={drohneStatus.nachweisUrl}
              onRemove={() => onDrohneChange({ ...drohneStatus, nachweisUrl: undefined })}
              onFileSelect={(file) => handleFileUpload('drohne', file, onDrohneChange, drohneStatus)}
              dragActive={dragActiveId === 'drohne'}
              onDragOver={(e) => { e.preventDefault(); setDragActiveId('drohne'); }}
              onDragLeave={() => setDragActiveId(null)}
              onDrop={(e) => handleDrop(e, 'drohne', onDrohneChange, drohneStatus)}
              isUploading={uploadingId === 'drohne'}
            />
          </div>
        )}

        {!drohneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-sm text-muted-foreground mb-3">
              Du benötigst eine Drohne mit 4K Kamera für Dachaufnahmen.
            </p>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => openExternalLink(drohneMietLink)}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Mieten
              </Button>
              <Button className="flex-1 relative rounded-xl h-11 bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary/75" onClick={() => openExternalLink(drohneKaufLink)}>
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Kaufen
                <span className="absolute -top-2 -right-1 bg-status-accepted text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                  <Star className="w-2.5 h-2.5" fill="currentColor" />
                  Empfohlen
                </span>
              </Button>
            </div>
          </div>
        )}
      </EquipmentCard>

      {/* iPhone mit LiDAR */}
      <EquipmentCard
        icon={Smartphone}
        title="iPhone mit LiDAR"
        subtitle="iPhone 12 Pro oder neuer für 3D-Scans"
        isCompleted={!!iphoneStatus.nachweisUrl}
        stepNumber={2}
      >
        <RadioGroup
          value={iphoneStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onIphoneChange({
            hatEigenes: value === 'ja',
            nachweisUrl: value === 'nein' ? undefined : iphoneStatus.nachweisUrl,
          })}
          className="space-y-2.5"
        >
          <label className={cn(
            'flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-200',
            iphoneStatus.hatEigenes
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-muted-foreground/30'
          )}>
            <RadioGroupItem value="ja" id="iphone-ja" />
            <span className="text-sm font-medium text-foreground">Ja, ich habe ein kompatibles iPhone</span>
          </label>
          <label className={cn(
            'flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-200',
            !iphoneStatus.hatEigenes
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-muted-foreground/30'
          )}>
            <RadioGroupItem value="nein" id="iphone-nein" />
            <span className="text-sm font-medium text-foreground">Nein, ich brauche ein iPhone</span>
          </label>
        </RadioGroup>

        {iphoneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto/Screenshot)</p>
            <NachweisUploadZone
              nachweisUrl={iphoneStatus.nachweisUrl}
              onRemove={() => onIphoneChange({ ...iphoneStatus, nachweisUrl: undefined })}
              onFileSelect={(file) => handleFileUpload('iphone-lidar', file, onIphoneChange, iphoneStatus)}
              dragActive={dragActiveId === 'iphone-lidar'}
              onDragOver={(e) => { e.preventDefault(); setDragActiveId('iphone-lidar'); }}
              onDragLeave={() => setDragActiveId(null)}
              onDrop={(e) => handleDrop(e, 'iphone-lidar', onIphoneChange, iphoneStatus)}
              isUploading={uploadingId === 'iphone-lidar'}
            />
          </div>
        )}

        {!iphoneStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-sm text-muted-foreground mb-3">
              Du benötigst mindestens ein iPhone 12 Pro mit LiDAR-Scanner.
            </p>
            <div className="flex gap-2.5">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => openExternalLink(iPhoneMietLink)}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Mieten
              </Button>
              <Button className="flex-1 rounded-xl h-11" onClick={() => openExternalLink(iPhoneKaufLink)}>
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Kaufen
              </Button>
            </div>
          </div>
        )}
      </EquipmentCard>

      {/* Maßband */}
      <EquipmentCard
        icon={Ruler}
        title="Maßband"
        subtitle="Empfohlene Länge: mindestens 5m"
        isCompleted={!!massbandStatus.nachweisUrl}
        stepNumber={3}
      >
        <RadioGroup
          value={massbandStatus.hatEigenes ? 'ja' : 'nein'}
          onValueChange={(value) => onMassbandChange({
            hatEigenes: value === 'ja',
            nachweisUrl: value === 'nein' ? undefined : massbandStatus.nachweisUrl,
          })}
          className="space-y-2.5"
        >
          <label className={cn(
            'flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-200',
            massbandStatus.hatEigenes
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-muted-foreground/30'
          )}>
            <RadioGroupItem value="ja" id="massband-ja" />
            <span className="text-sm font-medium text-foreground">Ja, ich habe bereits ein Maßband</span>
          </label>
          <label className={cn(
            'flex items-center gap-3 border rounded-xl p-3.5 cursor-pointer transition-all duration-200',
            !massbandStatus.hatEigenes
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-muted-foreground/30'
          )}>
            <RadioGroupItem value="nein" id="massband-nein" />
            <span className="text-sm font-medium text-foreground">Nein, ich brauche ein Maßband</span>
          </label>
        </RadioGroup>

        {massbandStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-sm font-medium text-foreground mb-3">Nachweis hochladen (Foto)</p>
            <NachweisUploadZone
              nachweisUrl={massbandStatus.nachweisUrl}
              onRemove={() => onMassbandChange({ ...massbandStatus, nachweisUrl: undefined })}
              onFileSelect={(file) => handleFileUpload('massband', file, onMassbandChange, massbandStatus)}
              dragActive={dragActiveId === 'massband'}
              onDragOver={(e) => { e.preventDefault(); setDragActiveId('massband'); }}
              onDragLeave={() => setDragActiveId(null)}
              onDrop={(e) => handleDrop(e, 'massband', onMassbandChange, massbandStatus)}
              isUploading={uploadingId === 'massband'}
            />
          </div>
        )}

        {!massbandStatus.hatEigenes && (
          <div className="mt-4 pt-4 border-t border-border/60">
            <p className="text-sm text-muted-foreground mb-3">
              Empfohlene Länge: mindestens 5m
            </p>
            <Button className="w-full rounded-xl h-11" onClick={() => openExternalLink(massbandKaufLink)}>
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Unser empfohlenes Modell kaufen
            </Button>
          </div>
        )}
      </EquipmentCard>

      {/* Pro-Tipp */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-3 relative">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-0.5">Steuer-Tipp</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Die Drohne, das iPhone und das Maßband kannst du als Betriebsausgabe steuerlich absetzen!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
