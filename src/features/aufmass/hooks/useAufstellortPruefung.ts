// AI-Aufstellort-Prüfung Hook — portiert aus salesos
// Nutzt geteilte Supabase-Tabellen sales_zaehlerschrank_pruefungen / _fotos
// und Edge Function `sales-zaehlerschrank-analyze` mit pruefung_typ='aufstellort'.
//
// Dünner, typisierter Wrapper um useKiPruefung — die Upload-/Analyse-/Poll-Logik
// liegt zentral dort (kein dupliziertes 200-Zeilen-Flow mehr, vgl. useUWertePruefung).
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useKiPruefung, type KiPruefungConfig } from './useKiPruefung';

export type AufstellortStatus =
  | 'draft' | 'photo_uploaded' | 'analyzing'
  | 'waiting_for_photos' | 'completed' | 'failed' | 'cancelled';

export type AufstellortEmpfehlung = 'keine_anpassung' | 'teilanpassung' | 'grossanpassung' | 'sanierung';

export interface AufstellortRequestedPhoto { view: string; reason: string }

export interface AufstellortFindings {
  reasoning?: string;
  red_flags?: string[];
  components?: Record<string, string>;
  masnahmen?: string[];
  estimated_cost_eur?: number;
}

export interface AufstellortPruefung {
  id: string;
  lead_id: string;
  created_by: string;
  status: AufstellortStatus;
  current_step: number;
  empfehlung: AufstellortEmpfehlung | null;
  confidence: number | null;
  findings: AufstellortFindings | null;
  requested_photos: AufstellortRequestedPhoto[] | null;
  request_reason: string | null;
  ai_model: string | null;
  total_cost_eur: number;
  error_code: string | null;
  error_detail: string | null;
}

export interface AufstellortFoto {
  id: string;
  pruefung_id: string;
  step: number;
  storage_path: string;
  mime_type: string;
  is_ai_requested: boolean;
  ai_requested_view: string | null;
  uploaded_at: string;
}

const TABLE_PRUEF = 'sales_zaehlerschrank_pruefungen';
const TABLE_FOTOS = 'sales_zaehlerschrank_fotos';
const BUCKET = 'sales-zaehlerschrank-photos';
const EDGE_FN = 'sales-zaehlerschrank-analyze';
const TYPE = 'aufstellort';
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 50 * 1024 * 1024;

/** EXIF strippen (Canvas-Re-Encode). HEIC/HEIF unverändert lassen. */
async function stripExif(file: File): Promise<File> {
  if (/heic|heif/i.test(file.type)) return file;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export type AufstellortVariant = 'haupt' | 'alt_1' | 'alt_2';

export function useAufstellortPruefung({
  leadId,
  variant = 'haupt',
  enabled = true,
}: { leadId: string | null; variant?: AufstellortVariant; enabled?: boolean }) {
  const config = useMemo<KiPruefungConfig<AufstellortPruefung>>(() => ({
    client: supabase,
    tablePruef: TABLE_PRUEF,
    tableFotos: TABLE_FOTOS,
    bucket: BUCKET,
    edgeFn: EDGE_FN,
    pruefungTyp: TYPE,
    pruefungQueryKey: ['aufstellort-pruefung', leadId, variant],
    matchFilter: { lead_id: leadId, pruefung_typ: TYPE, variant },
    insertParent: { lead_id: leadId, variant },
    allowedMime: ALLOWED_MIME,
    maxSizeBytes: MAX_SIZE,
    analyseLabel: 'AI-Start',
    isPollingStatus: (s) => s === 'analyzing' || s === 'waiting_for_photos',
    verarbeiteFoto: async (raw) => {
      const file = await stripExif(raw);
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      return {
        blob: file, contentType: file.type, sizeBytes: file.size,
        fileName: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`,
      };
    },
    buildStoragePath: ({ pruefungId, step, fileName, userId }) =>
      `${userId}/${pruefungId}/${step}/${fileName}`,
  }), [leadId, variant]);

  return useKiPruefung<AufstellortPruefung, AufstellortFoto>(config, enabled && !!leadId);
}
