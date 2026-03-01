import { useState, useEffect, useCallback, useId, type ChangeEvent } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { BILD_KATEGORIEN, VotBildKategorie } from '../../data/bild-kategorien';
import { VotBild, useUploadVotBild, useDeleteVotBild, getSignedImageUrl } from '../../hooks/useVotBilder';
import { toast } from 'sonner';

interface PhotoUploadFieldProps {
  kategorie: VotBildKategorie;
  existingBilder: VotBild[];
  votFormularId: string | undefined;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

/** Client-side image compression to max ~2MB */
async function compressImage(file: File, maxSizeKB = 2048): Promise<File> {
  if (file.size <= maxSizeKB * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        const maxDim = 2048;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoUploadField({
  kategorie,
  existingBilder,
  votFormularId,
  leadName,
  leadId,
  auftragId,
  disabled = false,
}: PhotoUploadFieldProps) {
  const config = BILD_KATEGORIEN[kategorie];
  const uploadMutation = useUploadVotBild();
  const deleteMutation = useDeleteVotBild();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Unique IDs for label-input association (iOS Safari safe)
  const reactId = useId();
  const fileInputId = `file-${reactId}`;
  const cameraInputId = `camera-${reactId}`;

  // Load signed URLs for thumbnails — merge incrementally, skip already-loaded
  useEffect(() => {
    let stale = false;
    const loadUrls = async () => {
      const missing = existingBilder.filter(b => !thumbnails[b.id]);
      if (missing.length === 0) return;
      const newUrls: Record<string, string> = {};
      for (const bild of missing) {
        if (stale) return;
        const url = await getSignedImageUrl(bild.storage_path);
        if (url) newUrls[bild.id] = url;
      }
      if (!stale) setThumbnails(prev => ({ ...prev, ...newUrls }));
    };
    if (existingBilder.length > 0) loadUrls();
    return () => { stale = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingBilder]);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0 || !votFormularId) return;

    let uploadedCount = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist kein Bild`);
        continue;
      }

      try {
        const compressed = await compressImage(file);
        const nextIndex = existingBilder.length + uploadedCount + 1;

        await uploadMutation.mutateAsync({
          file: compressed,
          votFormularId,
          kategorie,
          leadName,
          leadId,
          auftragId,
          reihenfolge: nextIndex,
        });
        uploadedCount++;
      } catch (err) {
        console.error(`Upload fehlgeschlagen für ${file.name}:`, err);
        // toast already shown by mutation onError – continue with remaining files
      }
    }
  }, [votFormularId, existingBilder.length, kategorie, leadName, leadId, auftragId, uploadMutation]);

  const handleDelete = useCallback(async (bild: VotBild) => {
    await deleteMutation.mutateAsync({ bild });
  }, [deleteMutation]);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    // Copy FileList to stable array BEFORE resetting the input
    const fileArray = Array.from(event.target.files ?? []);
    event.target.value = ''; // Reset so same file can be re-selected
    void handleFileUpload(fileArray);
  }, [handleFileUpload]);

  const isUploading = uploadMutation.isPending;
  const missingCount = Math.max(0, config.minAnzahl - existingBilder.length);
  const inputsDisabled = isUploading || !votFormularId;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground text-sm">{config.label} *</p>
          {config.hinweis && <p className="text-xs text-muted-foreground">{config.hinweis}</p>}
        </div>
        {missingCount > 0 && (
          <span className="text-xs text-destructive font-medium">
            Min. {config.minAnzahl} Fotos
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {existingBilder.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingBilder.map((bild) => (
            <div key={bild.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              {thumbnails[bild.id] ? (
                <img src={thumbnails[bild.id]} alt={bild.dateiname} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted animate-pulse" />
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(bild)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-full"
                  disabled={deleteMutation.isPending}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons — uses native <label htmlFor> instead of programmatic .click()
           This is the ONLY reliable method on iOS Safari. */}
      {!disabled && (
        <div className="flex gap-2">
          {/* Hidden file inputs — must be in the DOM for <label> association */}
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            disabled={inputsDisabled}
            className="sr-only"
            tabIndex={-1}
          />
          <input
            id={cameraInputId}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            disabled={inputsDisabled}
            className="sr-only"
            tabIndex={-1}
          />

          {/* Label styled as button — native tap triggers file picker on all browsers */}
          <label
            htmlFor={inputsDisabled ? undefined : fileInputId}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
              inputsDisabled
                ? 'opacity-50 pointer-events-none'
                : 'cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80'
            }`}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Datei
          </label>
          <label
            htmlFor={inputsDisabled ? undefined : cameraInputId}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
              inputsDisabled
                ? 'opacity-50 pointer-events-none'
                : 'cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80'
            }`}
          >
            <Camera className="w-4 h-4" />
            Kamera
          </label>
        </div>
      )}
    </div>
  );
}
