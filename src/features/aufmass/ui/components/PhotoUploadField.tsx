import { useState, useEffect, useCallback } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  // Load signed URLs for thumbnails
  useEffect(() => {
    const loadUrls = async () => {
      const urls: Record<string, string> = {};
      for (const bild of existingBilder) {
        const url = await getSignedImageUrl(bild.storage_path);
        if (url) urls[bild.id] = url;
      }
      setThumbnails(urls);
    };
    if (existingBilder.length > 0) loadUrls();
  }, [existingBilder]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !votFormularId) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} ist kein Bild`);
        continue;
      }

      const compressed = await compressImage(file);
      const nextIndex = existingBilder.length + i + 1;

      await uploadMutation.mutateAsync({
        file: compressed,
        votFormularId,
        kategorie,
        leadName,
        leadId,
        auftragId,
        reihenfolge: nextIndex,
      });
    }
  }, [votFormularId, existingBilder.length, kategorie, leadName, leadId, auftragId, uploadMutation]);

  const handleDelete = useCallback(async (bild: VotBild) => {
    await deleteMutation.mutateAsync({ bild });
  }, [deleteMutation]);

  const isUploading = uploadMutation.isPending;
  const missingCount = Math.max(0, config.minAnzahl - existingBilder.length);

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

      {/* Upload buttons */}
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || !votFormularId}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.multiple = true;
              input.onchange = () => handleFileUpload(input.files);
              input.click();
            }}
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Datei
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || !votFormularId}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.capture = 'environment';
              input.onchange = () => handleFileUpload(input.files);
              input.click();
            }}
          >
            <Camera className="w-4 h-4" />
            Kamera
          </Button>
        </div>
      )}
    </div>
  );
}
