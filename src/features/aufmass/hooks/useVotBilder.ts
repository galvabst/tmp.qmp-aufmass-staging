import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_BUCKET, buildImageStoragePath } from '../data/storage-path';
import { VotBildKategorie } from '../data/bild-kategorien';
import { toast } from 'sonner';

export interface VotBild {
  id: string;
  vot_formular_id: string;
  kategorie: VotBildKategorie;
  storage_path: string;
  dateiname: string;
  beschreibung: string | null;
  reihenfolge: number;
  created_at: string;
}

/** Load all images for a VOT formular */
export function useVotBilder(votFormularId: string | undefined) {
  return useQuery({
    queryKey: ['vot-bilder', votFormularId],
    enabled: !!votFormularId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thermocheck_vot_bilder' as any)
        .select('*')
        .eq('vot_formular_id', votFormularId!)
        .order('kategorie')
        .order('reihenfolge')
        .setHeader('Accept-Profile', 'thermocheck');

      if (error) throw error;
      return (data ?? []) as unknown as VotBild[];
    },
  });
}

/** Get images filtered by category */
export function filterBilderByKategorie(bilder: VotBild[], kategorie: VotBildKategorie): VotBild[] {
  return bilder.filter(b => b.kategorie === kategorie);
}

/** Upload an image to storage + insert metadata */
export function useUploadVotBild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      votFormularId,
      kategorie,
      leadName,
      leadId,
      auftragId,
      reihenfolge,
    }: {
      file: File;
      votFormularId: string;
      kategorie: VotBildKategorie;
      leadName: string;
      leadId: string;
      auftragId: string;
      reihenfolge: number;
    }) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const storagePath = buildImageStoragePath(leadName, leadId, auftragId, kategorie, reihenfolge, ext);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Insert metadata
      const { data, error: insertError } = await supabase
        .from('thermocheck_vot_bilder' as any)
        .insert({
          vot_formular_id: votFormularId,
          kategorie,
          storage_path: storagePath,
          dateiname: file.name,
          reihenfolge,
        })
        .select()
        .single()
        .setHeader('Accept-Profile', 'thermocheck')
        .setHeader('Content-Profile', 'thermocheck');

      if (insertError) throw insertError;
      return data as unknown as VotBild;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vot-bilder', variables.votFormularId] });
    },
    onError: (error) => {
      console.error('Bild-Upload Fehler:', error);
      toast.error('Fehler beim Hochladen');
    },
  });
}

/** Delete an image from storage + metadata */
export function useDeleteVotBild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bild }: { bild: VotBild }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([bild.storage_path]);

      if (storageError) console.warn('Storage-Löschfehler (ignoriert):', storageError);

      // Delete metadata
      const { error: deleteError } = await supabase
        .from('thermocheck_vot_bilder' as any)
        .delete()
        .eq('id', bild.id)
        .setHeader('Accept-Profile', 'thermocheck')
        .setHeader('Content-Profile', 'thermocheck');

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vot-bilder'] });
      toast.success('Bild gelöscht');
    },
    onError: (error) => {
      console.error('Bild-Löschfehler:', error);
      toast.error('Fehler beim Löschen');
    },
  });
}

/** Get a signed URL for a private bucket image */
export async function getSignedImageUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error) {
    console.error('Signed URL Fehler:', error);
    return null;
  }
  return data.signedUrl;
}
