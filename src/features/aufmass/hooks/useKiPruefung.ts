// Generischer KI-Prüfungs-Hook (Upload-Flow → Edge-Function → Poll) für die
// Aufmaß-KI-Assistenten. Beide konkreten Hooks (useUWertePruefung /
// useAufstellortPruefung) sind dünne, typisierte Wrapper um diesen Kern — die
// Domänen-Logik (create → upload → PATCH status → invoke → poll → reset/delete)
// lebt damit an EINER Stelle statt dupliziert in zwei 200-Zeilen-Hooks.
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { typedFrom } from '../data/supabase-typed-from';

/** Minimal-Form der Prüfung, die der generische Flow selbst braucht (Status-Maschine). */
export interface KiPruefungBase {
  id: string;
  status: string;
}

export interface KiPruefungConfig<TPruefung extends KiPruefungBase> {
  /** Supabase-Client, dessen Schema die Tabellen enthält (thermocheck vs. public). */
  client: SupabaseClient;
  tablePruef: string;
  tableFotos: string;
  bucket: string;
  edgeFn: string;
  /** pruefung_typ-Diskriminator ('u_werte' | 'aufstellort'). */
  pruefungTyp: string;
  /** Query-Key der aktiven Prüfung (für Cache + Invalidate). */
  pruefungQueryKey: readonly unknown[];
  /** WHERE-Filter, der die aktive Prüfung dieses Kontexts findet (auftrag_id bzw. lead_id+variant). */
  matchFilter: Record<string, unknown>;
  /** Zusätzliche Felder beim INSERT (z. B. { auftrag_id } oder { lead_id, variant }). */
  insertParent: Record<string, unknown>;
  allowedMime: string[];
  maxSizeBytes: number;
  /** Toast-Präfix für Analyse-Fehler ('KI-Start' vs. 'AI-Start'). */
  analyseLabel: string;
  /** Foto vor dem Upload aufbereiten (Resize bzw. EXIF-Strip). */
  verarbeiteFoto: (raw: File) => Promise<{ blob: Blob; contentType: string; sizeBytes: number; fileName: string }>;
  /** Storage-Pfad aus Prüfung + Schritt ableiten (unterschiedliche Schemata je Hook). */
  buildStoragePath: (args: { pruefungId: string; step: number; fileName: string; userId: string }) => string;
  /** true bei aktivem Polling-Status (analyzing / waiting_for_photos). */
  isPollingStatus: (status: string) => boolean;
}

export interface UseKiPruefungResult<TPruefung, TFoto> {
  pruefung: TPruefung | null;
  fotos: TFoto[];
  isLoading: boolean;
  isUploading: boolean;
  isStarting: boolean;
  createPruefung: () => Promise<TPruefung | null>;
  uploadFotos: (files: File[], opts?: { aiRequestedView?: string; aiRequestReason?: string }) => Promise<boolean>;
  startAnalysis: (eingaben?: unknown) => Promise<boolean>;
  resetPruefung: () => Promise<void>;
  getSignedUrl: (path: string) => Promise<string | null>;
  deleteFoto: (fotoId: string) => Promise<void>;
}

interface FotoRow { id: string; storage_path: string }

export function useKiPruefung<TPruefung extends KiPruefungBase, TFoto extends FotoRow>(
  cfg: KiPruefungConfig<TPruefung>,
  enabled: boolean,
): UseKiPruefungResult<TPruefung, TFoto> {
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const fromPruef = useCallback(() => typedFrom<TPruefung>(cfg.client, cfg.tablePruef), [cfg.client, cfg.tablePruef]);
  const fromFotos = useCallback(() => typedFrom<TFoto>(cfg.client, cfg.tableFotos), [cfg.client, cfg.tableFotos]);

  const { data: pruefung, isLoading: pLoading } = useQuery<TPruefung | null>({
    queryKey: cfg.pruefungQueryKey,
    enabled,
    queryFn: async () => {
      let q = fromPruef().select('*');
      for (const [col, val] of Object.entries(cfg.matchFilter)) q = q.eq(col, val);
      const { data, error } = await q
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as TPruefung | null;
    },
    refetchInterval: (query) => {
      const s = (query.state.data as TPruefung | null)?.status;
      return s != null && cfg.isPollingStatus(s) ? 3000 : false;
    },
  });

  const { data: fotos, isLoading: fLoading } = useQuery<TFoto[]>({
    queryKey: [...cfg.pruefungQueryKey, 'fotos', pruefung?.id],
    enabled: !!pruefung?.id,
    queryFn: async () => {
      const { data, error } = await fromFotos().select('*')
        .eq('pruefung_id', pruefung!.id)
        .order('uploaded_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as TFoto[];
    },
  });

  const invalidate = useCallback(async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: cfg.pruefungQueryKey }),
      qc.invalidateQueries({ queryKey: [...cfg.pruefungQueryKey, 'fotos'] }),
    ]);
  }, [qc, cfg.pruefungQueryKey]);

  const createPruefung = useCallback(async (): Promise<TPruefung | null> => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) { toast.error('Nicht eingeloggt'); return null; }
    const { data, error } = await fromPruef().insert({
      ...cfg.insertParent, created_by: userId, pruefung_typ: cfg.pruefungTyp,
      status: 'draft', current_step: 1,
    }).select('*').single();
    if (error) { toast.error(`Prüfung konnte nicht erstellt werden: ${error.message}`); return null; }
    await invalidate();
    return data as TPruefung;
  }, [fromPruef, cfg.insertParent, cfg.pruefungTyp, invalidate]);

  const uploadFotos = useCallback(async (
    files: File[], opts: { aiRequestedView?: string; aiRequestReason?: string } = {},
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
    // current_step liegt nur auf dem konkreten Row-Typ → typsicher über das Pruef-Objekt lesen.
    const currentStep = (p as unknown as { current_step?: number }).current_step ?? 1;

    setIsUploading(true);
    try {
      for (const raw of files) {
        if (!cfg.allowedMime.includes(raw.type)) { toast.error(`${raw.name}: nur PNG/JPG/WebP/HEIC`); continue; }
        if (raw.size > cfg.maxSizeBytes) { toast.error(`${raw.name} zu groß (max 50MB)`); continue; }
        let prepared: { blob: Blob; contentType: string; sizeBytes: number; fileName: string };
        try {
          prepared = await cfg.verarbeiteFoto(raw);
        } catch {
          toast.error(`${raw.name}: Bild konnte nicht verarbeitet werden (HEIC? bitte JPG/PNG)`); continue;
        }
        const path = cfg.buildStoragePath({ pruefungId: p.id, step: currentStep, fileName: prepared.fileName, userId });
        const { error: upErr } = await supabase.storage.from(cfg.bucket)
          .upload(path, prepared.blob, { contentType: prepared.contentType, upsert: false });
        if (upErr) { toast.error(`Upload fehlgeschlagen: ${upErr.message}`); continue; }
        const { error: insErr } = await fromFotos().insert({
          pruefung_id: p.id, step: currentStep, storage_path: path,
          mime_type: prepared.contentType, size_bytes: prepared.sizeBytes, original_filename: raw.name,
          is_ai_requested: !!opts.aiRequestedView,
          ai_requested_view: opts.aiRequestedView ?? null,
          ai_request_reason: opts.aiRequestReason ?? null,
          uploaded_by: userId,
        });
        if (insErr) { toast.error(`DB-Eintrag fehlgeschlagen: ${insErr.message}`); continue; }
      }
      if (p.status === 'draft' || p.status === 'waiting_for_photos') {
        await fromPruef().update({ status: 'photo_uploaded' }).eq('id', p.id)
          .in('status', ['draft', 'waiting_for_photos']);
      }
      await invalidate();
      return true;
    } finally { setIsUploading(false); }
  }, [pruefung, createPruefung, fromFotos, fromPruef, cfg, invalidate]);

  const startAnalysis = useCallback(async (eingaben?: unknown): Promise<boolean> => {
    if (!pruefung) { toast.error('Keine Prüfung vorhanden'); return false; }
    if (!['photo_uploaded', 'waiting_for_photos'].includes(pruefung.status)) {
      toast.error(`Analyse im Status '${pruefung.status}' nicht möglich`); return false;
    }
    setIsStarting(true);
    try {
      const body = eingaben !== undefined
        ? { pruefung_id: pruefung.id, eingaben }
        : { pruefung_id: pruefung.id };
      const { data, error } = await supabase.functions.invoke(cfg.edgeFn, { body });
      if (error) { toast.error(`${cfg.analyseLabel} fehlgeschlagen: ${error.message}`); return false; }
      const respErr = (data as { error?: string } | null)?.error;
      if (respErr) { toast.error(`${cfg.analyseLabel} fehlgeschlagen: ${respErr}`); return false; }
      toast.success(`${cfg.analyseLabel === 'KI-Start' ? 'KI' : 'AI'}-Analyse gestartet`);
      await invalidate();
      return true;
    } finally { setIsStarting(false); }
  }, [pruefung, cfg.edgeFn, cfg.analyseLabel, invalidate]);

  const resetPruefung = useCallback(async () => {
    if (pruefung) {
      await fromPruef().update({ status: 'cancelled' }).eq('id', pruefung.id);
    }
    await createPruefung();
  }, [pruefung, fromPruef, createPruefung]);

  const getSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from(cfg.bucket).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, [cfg.bucket]);

  const deleteFoto = useCallback(async (fotoId: string) => {
    const foto = (fotos ?? []).find((f) => f.id === fotoId);
    if (!foto) return;
    await supabase.storage.from(cfg.bucket).remove([foto.storage_path]);
    await fromFotos().delete().eq('id', fotoId);
    await invalidate();
  }, [fotos, cfg.bucket, fromFotos, invalidate]);

  return {
    pruefung: pruefung ?? null,
    fotos: fotos ?? [],
    isLoading: pLoading || fLoading,
    isUploading, isStarting,
    createPruefung, uploadFotos, startAnalysis, resetPruefung,
    getSignedUrl, deleteFoto,
  };
}
