import { useState, useRef } from 'react';
import { CheckCircle2, Upload, Link as LinkIcon, Video, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
}

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
  if (eingereicht) {
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

  const canSubmit = scanUrl.trim().length > 0 && videoUrl.length > 0 && !isSubmitting && !isUploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onVideoUpload(file);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onEinreichen();
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
            Scanne dein eigenes Haus und nimm einen Drohnenflug auf
          </p>
        </div>
      </div>

      {/* Scan-Link */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5" />
          3D-Scan Link
        </label>
        <Input
          type="url"
          placeholder="https://... (Link zum 3D-Scan)"
          value={scanUrl}
          onChange={(e) => onScanUrlChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Füge den Link zu deinem 3D-Scan ein (z.B. von Polycam, Matterport o.ä.)</p>
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
