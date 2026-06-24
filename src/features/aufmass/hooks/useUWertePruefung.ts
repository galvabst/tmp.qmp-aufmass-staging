// U-Werte KI-Assistent — Hook (thermocheck-Domäne, entkoppelt von salesos).
// Tabellen: thermocheck.aufmass_ki_pruefungen / aufmass_ki_fotos (via supabaseTC).
// Storage: Bucket galvanek_bau (wie die VOT-Bilder). Gekoppelt an den AUFMASS-
// AUFTRAG (auftrag_id), NICHT an einen Vertriebs-Lead.
// Edge Function: aufmass-uwerte-analyze (eigene qmp-Function).
//
// Dünner, typisierter Wrapper um useKiPruefung — die Upload-/Analyse-/Poll-Logik
// liegt zentral dort (kein dupliziertes 200-Zeilen-Flow mehr, vgl. useAufstellortPruefung).
import { useMemo } from 'react';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { verarbeiteFotoFuerUpload } from '../data/foto-verarbeitung';
import { useKiPruefung, type KiPruefungConfig } from './useKiPruefung';

export type UWerteStatus =
  | 'draft' | 'photo_uploaded' | 'analyzing'
  | 'waiting_for_photos' | 'completed' | 'failed' | 'cancelled';

// Plausibilitäts-Skala (auf die empfehlung-Werte gemappt).
export type UWertePlausi = 'keine_anpassung' | 'teilanpassung' | 'grossanpassung' | 'sanierung';

export interface UWerteRequestedPhoto { view: string; reason: string }

export interface UWerteFindings {
  reasoning?: string;
  red_flags?: string[];
  components?: Record<string, string>;
  masnahmen?: string[];
  /** Klar ableitbare Felder (dotted path → Wert), z. B. { "aussenwand.mauerwerk_cm": 36 }. */
  vorschlag_formular?: Record<string, unknown>;
}

export interface UWertePruefung {
  id: string;
  auftrag_id: string;
  created_by: string;
  status: UWerteStatus;
  current_step: number;
  empfehlung: UWertePlausi | null;
  confidence: number | null;
  findings: UWerteFindings | null;
  requested_photos: UWerteRequestedPhoto[] | null;
  request_reason: string | null;
  ai_model: string | null;
  total_cost_eur: number;
  error_code: string | null;
  error_detail: string | null;
}

export interface UWerteFoto {
  id: string;
  pruefung_id: string;
  step: number;
  storage_path: string;
  mime_type: string;
  is_ai_requested: boolean;
  ai_requested_view: string | null;
  uploaded_at: string;
}

const TABLE_PRUEF = 'aufmass_ki_pruefungen';   // thermocheck-Schema (supabaseTC)
const TABLE_FOTOS = 'aufmass_ki_fotos';
const BUCKET = 'galvanek_bau';                 // privater Storage (wie VOT-Bilder)
const EDGE_FN = 'aufmass-uwerte-analyze';
const TYPE = 'u_werte';
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE = 50 * 1024 * 1024;

export function useUWertePruefung({ auftragId, enabled = true }: { auftragId: string | null; enabled?: boolean }) {
  const config = useMemo<KiPruefungConfig<UWertePruefung>>(() => ({
    client: supabaseTC,
    tablePruef: TABLE_PRUEF,
    tableFotos: TABLE_FOTOS,
    bucket: BUCKET,
    edgeFn: EDGE_FN,
    pruefungTyp: TYPE,
    pruefungQueryKey: ['uwerte-pruefung', auftragId],
    matchFilter: { auftrag_id: auftragId, pruefung_typ: TYPE },
    insertParent: { auftrag_id: auftragId },
    allowedMime: ALLOWED_MIME,
    maxSizeBytes: MAX_SIZE,
    analyseLabel: 'KI-Start',
    isPollingStatus: (s) => s === 'analyzing' || s === 'waiting_for_photos',
    verarbeiteFoto: async (raw) => {
      // Vor dem Upload runterskalieren (max 1600px, JPEG ~0.8) — sonst überspringt
      // die Edge-Function die Fotos als >4 MB (Gemini-Payload-Schutz) → 0 brauchbare.
      const v = await verarbeiteFotoFuerUpload(raw);
      return { blob: v.blob, contentType: 'image/jpeg', sizeBytes: v.groesseBytes, fileName: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg` };
    },
    buildStoragePath: ({ pruefungId, step, fileName }) =>
      `operations/ki-aufmass/u_werte/${pruefungId}/${step}/${fileName}`,
  }), [auftragId]);

  return useKiPruefung<UWertePruefung, UWerteFoto>(config, enabled && !!auftragId);
}
