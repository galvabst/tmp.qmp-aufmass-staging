import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

/**
 * Throttled DB persistence for video progress.
 * Upserts video_progress_seconds into contractor_akademie_lektions_fortschritt
 * every 15 seconds + on visibilitychange + beforeunload.
 * 
 * Skips saving for completed lessons (allowSeeking=true) or missing IDs.
 * Skips for intro-video (no DB row possible — FK constraint on lektion_id).
 */

const thermocheckClient = createClient(
  'https://keplsvhudmfaagixttql.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlcGxzdmh1ZG1mYWFnaXh0dHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTQ4MzIsImV4cCI6MjA3MjA3MDgzMn0.pfrd37wSwqnofDinrv60YOtCqnYTc9BXq08m_TSVTNY',
  { db: { schema: 'thermocheck' } }
);

const DB_SAVE_INTERVAL_MS = 15_000;

interface UseSaveVideoProgressParams {
  contractorId: string | null | undefined;
  lektionId: string | null | undefined;
  watchedSeconds: number;
  maxReachedTime: number;
  isCompleted: boolean;
}

export function useSaveVideoProgress({
  contractorId,
  lektionId,
  watchedSeconds,
  maxReachedTime,
  isCompleted,
}: UseSaveVideoProgressParams) {
  const lastDbSaveRef = useRef(0);
  const latestValuesRef = useRef({ watchedSeconds, maxReachedTime });
  latestValuesRef.current = { watchedSeconds, maxReachedTime };

  const saveToDb = useCallback(async () => {
    const cId = contractorId;
    const lId = lektionId;
    if (!cId || !lId || isCompleted) return;
    // Skip intro-video (not a real lektion UUID in DB)
    if (lId === 'intro-video') return;

    const progressSeconds = Math.round(latestValuesRef.current.maxReachedTime);
    if (progressSeconds <= 0) return;

    try {
      const { error } = await thermocheckClient
        .from('contractor_akademie_lektions_fortschritt')
        .upsert(
          {
            contractor_id: cId,
            lektion_id: lId,
            video_progress_seconds: progressSeconds,
            status: 'in_progress' as const,
            started_at: new Date().toISOString(),
          },
          { onConflict: 'contractor_id,lektion_id' }
        );

      if (error) {
        console.warn('[SaveVideoProgress] DB upsert failed:', error.message);
      } else {
        console.log('[SaveVideoProgress] Saved', progressSeconds, 'sec to DB for lektion', lId);
      }
    } catch (e) {
      console.warn('[SaveVideoProgress] Unexpected error:', e);
    }
  }, [contractorId, lektionId, isCompleted]);

  // Periodic save every 15 seconds
  useEffect(() => {
    if (!contractorId || !lektionId || isCompleted || lektionId === 'intro-video') return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastDbSaveRef.current >= DB_SAVE_INTERVAL_MS) {
        lastDbSaveRef.current = now;
        saveToDb();
      }
    }, DB_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [contractorId, lektionId, isCompleted, saveToDb]);

  // Save on visibilitychange + beforeunload
  useEffect(() => {
    if (!contractorId || !lektionId || isCompleted || lektionId === 'intro-video') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveToDb();
      }
    };

    const handleBeforeUnload = () => {
      saveToDb();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [contractorId, lektionId, isCompleted, saveToDb]);
}
