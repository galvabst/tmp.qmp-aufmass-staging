import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Upload, Link as LinkIcon, Video, Clock, Loader2, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ContractorOption {
  profileId: string;
  name: string;
}

interface PraxistestSectionProps {
  testBestanden: boolean;
  scanUrl: string;
  videoUrl: string;
  eingereicht: boolean;
  freigabe: boolean;
  onScanUrlChange: (url: string) => void;
  onVideoUpload: (file: File) => Promise<void>;
  onEinreichen: () => Promise<void>;
  isUploading?: boolean;
  // Admin preview props
  isPreview?: boolean;
  contractors?: ContractorOption[];
  selectedContractorId?: string;
  onSelectContractor?: (id: string) => void;
}

const CHECKLIST_ITEMS = [
  'Autarc-Projekt für dein eigenes Haus anlegen',
  'Alle Räume mit 3D-Raumscan erfassen',
  'Kompletten Thermocheck-Durchlauf durchführen (Heizlastberechnung, Aufmaß, alle Eingaben)',
  'Drohnenflug des Gebäudes aufnehmen und als Video speichern',
];

export function PraxistestSection({
  testBestanden,
  scanUrl,
  videoUrl,
  eingereicht,
  freigabe,
  onScanUrlChange,
  onVideoUpload,
  onEinreichen,
  isUploading = false,
  isPreview = false,
  contractors = [],
  selectedContractorId,
  onSelectContractor,
}: PraxistestSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only show after theoretical test is passed
  if (!testBestanden) return null;

  // Already approved
  if (freigabe) {
    return (
      <div className="bg-status-accepted/10 rounded-xl p-4 border border-status-accepted/30 text-center">
        <CheckCircle2 className="w-8 h-8 text-status-accepted mx-auto mb-2" />
        <p className="font-semibold text-foreground">Praxistest freigegeben! ✅</p>
        <p className="text-sm text-muted-foreground mt-1">Dein 3D-Scan und Drohnenvideo wurden vom Admin geprüft und freigegeben.</p>
      </div>
    );
  }

  // Waiting for admin approval
  if (eingereicht && !isPreview) {
    return (
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-center">
        <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="font-semibold text-foreground">Praxistest eingereicht</p>
        <p className="text-sm text-muted-foreground mt-1">Warte auf Admin-Freigabe. Du wirst benachrichtigt, sobald dein Praxistest geprüft wurde.</p>
        {scanUrl && (
          <a href={scanUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline mt-2 inline-block">
            Scan-Link ansehen
          </a>
        )}
      </div>
    );
  }

  const canSubmit = scanUrl.trim().length > 0 && videoUrl.length > 0 && !isSubmitting && !isUploading
    && (!isPreview || !!selectedContractorId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onVideoUpload(file);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onEinreichen();
    } catch (err: any) {
      console.error('[Praxistest] Einreichen fehlgeschlagen:', err);
      toast.error(err?.message || 'Einreichen fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-card border-2 border-primary/50 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Video className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">🎯 Praxistest</h3>
          <p className="text-sm text-muted-foreground">
            Führe einen vollständigen Thermocheck an deinem eigenen Haus durch
          </p>
        </div>
      </div>

      {/* Anforderungen-Checkliste */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <p className="text-sm font-medium text-foreground">📋 Anforderungen:</p>
        <ul className="space-y-1.5">
          {CHECKLIST_ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CircleDot className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-2 italic">
          ⚠️ Nutze ausschließlich die Autarc-App. Der Praxistest simuliert einen echten Thermocheck-Auftrag 1:1.
        </p>
      </div>

      {/* Admin Preview: Contractor Dropdown */}
      {isPreview && contractors.length > 0 && (
        <div className="space-y-1.5 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <label className="text-sm font-medium text-foreground">
            🔧 Admin: Zuordnung zu Techniker
          </label>
          <Select value={selectedContractorId || ''} onValueChange={(v) => onSelectContractor?.(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Techniker auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {contractors.map((c) => (
                <SelectItem key={c.profileId} value={c.profileId}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Der Praxistest wird dem ausgewählten Techniker zugeordnet.
          </p>
        </div>
      )}

      {/* Scan-Link */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5" />
          Autarc-Projekt Link
        </label>
        <Input
          type="url"
          placeholder="https://... (Link zum Autarc-Projekt)"
          value={scanUrl}
          onChange={(e) => onScanUrlChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Füge den Link zu deinem fertigen Autarc-Projekt ein — inkl. Raumscans und komplettem Thermocheck-Durchlauf</p>
      </div>

      {/* Video Upload */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" />
          Drohnenflug-Video
        </label>
        {videoUrl ? (
          <div className="flex items-center gap-2 p-3 rounded-lg border border-status-accepted/30 bg-status-accepted/10">
            <CheckCircle2 className="w-5 h-5 text-status-accepted shrink-0" />
            <span className="text-sm text-foreground flex-1">Video hochgeladen</span>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              Ersetzen
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
              'hover:border-primary/50 hover:bg-muted/30',
              isUploading && 'opacity-50 pointer-events-none'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm text-muted-foreground">
              {isUploading ? 'Video wird hochgeladen...' : 'Klicke um dein Drohnenflug-Video hochzuladen'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">MP4, MOV (max. 200 MB)</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            Wird eingereicht...
          </>
        ) : (
          'Praxistest einreichen'
        )}
      </Button>
    </div>
  );
}
