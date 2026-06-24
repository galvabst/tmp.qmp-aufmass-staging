import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { STORAGE_BUCKET, buildImageStoragePath, sanitizeLeadName } from '../data/storage-path';
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
      const { data, error } = await supabaseTC
        .from('thermocheck_vot_bilder' as any)
        .select('*')
        .eq('vot_formular_id', votFormularId!)
        .order('kategorie')
        .order('reihenfolge');

      if (error) throw error;
      return (data ?? []) as unknown as VotBild[];
    },
  });
}

/** Get images filtered by category */
export function filterBilderByKategorie(bilder: VotBild[], kategorie: VotBildKategorie): VotBild[] {
  return bilder.filter(b => b.kategorie === kategorie);
}

export interface DuplikatTreffer {
  kategorie: string;
  kunde: string;
  datum: string;
  /** 10 bei Hausschuhe-Duplikat (Abzug), sonst null (nur Warnung). */
  abzug: number | null;
}

export interface UploadResult {
  bild: VotBild;
  duplikat: DuplikatTreffer | null;
}

/** Upload an image to storage + insert metadata (+ Hash/Dedup, falls Migration aktiv) */
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
      sha256,
      phash,
      fileSizeBytes,
    }: {
      file: File;
      votFormularId: string;
      kategorie: VotBildKategorie;
      leadName: string;
      leadId: string;
      auftragId: string;
      reihenfolge: number;
      sha256?: string;
      phash?: string;
      fileSizeBytes?: number;
    }): Promise<UploadResult> => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const storagePath = buildImageStoragePath(leadName, leadId, auftragId, kategorie, reihenfolge, ext);

      // Upload to storage (uses default client – storage is in public schema)
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // DB-weiter Duplikat-Check (best effort; fehlt die Funktion → übersprungen).
      let duplikat: DuplikatTreffer | null = null;
      if (sha256 || phash) {
        try {
          const { data: dup } = await (supabaseTC as any).rpc('check_foto_duplikat', {
            p_sha256: sha256 ?? null,
            p_phash: phash ?? null,
            p_aktuelles_formular: votFormularId,
          });
          const row = Array.isArray(dup) ? dup[0] : null;
          if (row) {
            duplikat = {
              kategorie: row.original_kategorie,
              kunde: row.original_kunde,
              datum: row.original_datum,
              abzug: kategorie === 'hausschuhe' ? 10 : null,
            };
          }
        } catch {
          // Migration noch nicht angewandt → Dedup still überspringen.
        }
      }

      const dateiname = `kunde_${sanitizeLeadName(leadName)}_${kategorie}_${String(reihenfolge).padStart(3, '0')}.${ext}`;
      const basis: Record<string, unknown> = {
        vot_formular_id: votFormularId,
        kategorie,
        storage_path: storagePath,
        dateiname,
        reihenfolge,
      };
      const mitHash: Record<string, unknown> = {
        ...basis,
        sha256: sha256 ?? null,
        phash: phash ?? null,
        file_size_bytes: fileSizeBytes ?? null,
        ist_duplikat: !!duplikat,
        duplikat_quelle: duplikat ? `${duplikat.kunde} · ${duplikat.kategorie} · ${String(duplikat.datum).slice(0, 10)}` : null,
        abzug_betrag: duplikat?.abzug ?? null,
      };

      // Mit Hash-Spalten versuchen; fehlen sie (Migration nicht angewandt) → Fallback.
      let res = await supabaseTC.from('thermocheck_vot_bilder' as any).insert(mitHash).select().single();
      if (res.error && /column .* does not exist|could not find/i.test(res.error.message ?? '')) {
        res = await supabaseTC.from('thermocheck_vot_bilder' as any).insert(basis).select().single();
      }
      if (res.error) throw res.error;

      return { bild: res.data as unknown as VotBild, duplikat };
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
      // Delete from storage (default client)
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([bild.storage_path]);

      if (storageError) console.warn('Storage-Löschfehler (ignoriert):', storageError);

      // Delete metadata (thermocheck client)
      const { error: deleteError } = await supabaseTC
        .from('thermocheck_vot_bilder' as any)
        .delete()
        .eq('id', bild.id);

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
