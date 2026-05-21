/* eslint-disable @typescript-eslint/no-explicit-any */
// AI-Aufstellort-Prüfung Hook — portiert aus salesos
// Nutzt geteilte Supabase-Tabellen sales_zaehlerschrank_pruefungen / _fotos
// und Edge Function `sales-zaehlerschrank-analyze` mit pruefung_typ='aufstellort'.
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const { data: pruefung, isLoading: pLoading } = useQuery<AufstellortPruefung | null>({
    queryKey: ['aufstellort-pruefung', leadId, variant],
    enabled: enabled && !!leadId,
    queryFn: async () => {
      // Latest active prüfung for this lead+variant; ignore cancelled rows so reset() creates a fresh one.
      const { data, error } = await (supabase as any)
        .from(TABLE_PRUEF).select('*')
        .eq('lead_id', leadId).eq('pruefung_typ', TYPE).eq('variant', variant)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return (data ?? null) as AufstellortPruefung | null;
    },
    refetchInterval: (query) => {
      const s = (query.state.data as AufstellortPruefung | null)?.status;
      return s === 'analyzing' || s === 'waiting_for_photos' ? 3000 : false;
    },
  });

  const { data: fotos, isLoading: fLoading } = useQuery<AufstellortFoto[]>({
    queryKey: ['aufstellort-fotos', pruefung?.id],
    enabled: !!pruefung?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(TABLE_FOTOS).select('*')
        .eq('pruefung_id', pruefung!.id).order('uploaded_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AufstellortFoto[];
    },
  });

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['aufstellort-pruefung', leadId, variant] }),
      qc.invalidateQueries({ queryKey: ['aufstellort-fotos'] }),
    ]);
  }, [qc, leadId, variant]);

  const createPruefung = useCallback(async (): Promise<AufstellortPruefung | null> => {
    if (!leadId) { toast.error('Lead-ID fehlt'); return null; }
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) { toast.error('Nicht eingeloggt'); return null; }
    const { data, error } = await (supabase as any).from(TABLE_PRUEF).insert({
      lead_id: leadId, created_by: userId, pruefung_typ: TYPE, variant,
      status: 'draft', current_step: 1,
    }).select('*').single();
    if (error) { toast.error(`Prüfung konnte nicht erstellt werden: ${error.message}`); return null; }
    await invalidate();
    return data as AufstellortPruefung;
  }, [leadId, variant, invalidate]);

  const uploadFotos = useCallback(async (
    files: File[], opts: { aiRequestedView?: string; aiRequestReason?: string } = {}
  ): Promise<boolean> => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) { toast.error('Nicht eingeloggt'); return false; }

    let p = pruefung;
    if (!p || ['completed', 'failed', 'cancelled'].includes(p.status)) {
      const created = await createPruefung();
      if (!created) return false;
      p = created;
    }

    setIsUploading(true);
    try {
      for (const raw of files) {
        if (!ALLOWED_MIME.includes(raw.type)) { toast.error(`${raw.name}: nur PNG/JPG/WebP/HEIC`); continue; }
        if (raw.size > MAX_SIZE) { toast.error(`${raw.name} zu groß (max 50MB)`); continue; }
        const file = await stripExif(raw);
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `${userId}/${p.id}/${p.current_step}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (upErr) { toast.error(`Upload fehlgeschlagen: ${upErr.message}`); continue; }
        const { error: insErr } = await (supabase as any).from(TABLE_FOTOS).insert({
          pruefung_id: p.id, step: p.current_step, storage_path: path,
          mime_type: file.type, size_bytes: file.size, original_filename: raw.name,
          is_ai_requested: !!opts.aiRequestedView,
          ai_requested_view: opts.aiRequestedView ?? null,
          ai_request_reason: opts.aiRequestReason ?? null,
          uploaded_by: userId,
        });
        if (insErr) { toast.error(`DB-Eintrag fehlgeschlagen: ${insErr.message}`); continue; }
      }
      if (p.status === 'draft' || p.status === 'waiting_for_photos') {
        await (supabase as any).from(TABLE_PRUEF)
          .update({ status: 'photo_uploaded' }).eq('id', p.id)
          .in('status', ['draft', 'waiting_for_photos']);
      }
      await invalidate();
      return true;
    } finally { setIsUploading(false); }
  }, [pruefung, createPruefung, invalidate]);

  const startAnalysis = useCallback(async (): Promise<boolean> => {
    if (!pruefung) { toast.error('Keine Prüfung vorhanden'); return false; }
    if (!['photo_uploaded', 'waiting_for_photos'].includes(pruefung.status)) {
      toast.error(`Analyse im Status '${pruefung.status}' nicht möglich`); return false;
    }
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke(EDGE_FN, { body: { pruefung_id: pruefung.id } });
      if (error) { toast.error(`AI-Start fehlgeschlagen: ${error.message}`); return false; }
      if ((data as any)?.error) { toast.error(`AI-Start fehlgeschlagen: ${(data as any).error}`); return false; }
      toast.success('AI-Analyse gestartet');
      await invalidate();
      return true;
    } finally { setIsStarting(false); }
  }, [pruefung, invalidate]);

  const resetPruefung = useCallback(async () => {
    if (pruefung) {
      await (supabase as any).from(TABLE_PRUEF).update({ status: 'cancelled' }).eq('id', pruefung.id);
    }
    await createPruefung();
  }, [pruefung, createPruefung]);

  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  const deleteFoto = useCallback(async (fotoId: string) => {
    const foto = (fotos ?? []).find((f) => f.id === fotoId);
    if (!foto) return;
    await supabase.storage.from(BUCKET).remove([foto.storage_path]);
    await (supabase as any).from(TABLE_FOTOS).delete().eq('id', fotoId);
    await invalidate();
  }, [fotos, invalidate]);

  return {
    pruefung: pruefung ?? null,
    fotos: fotos ?? [],
    isLoading: pLoading || fLoading,
    isUploading, isStarting,
    createPruefung, uploadFotos, startAnalysis, resetPruefung,
    getSignedUrl, deleteFoto,
  };
}
