import { useState, useRef, useCallback, useEffect } from 'react';
import { MultiSourceVideoPlayer, VideoPlayerHandle } from '@/components/akademie/MultiSourceVideoPlayer';
import { PflichtVideo } from '@/hooks/usePflichtVideos';
import { supabaseTC } from '@/integrations/supabase/thermocheck-client';
import { GraduationCap } from 'lucide-react';

interface PflichtVideoOverlayProps {
  videos: PflichtVideo[];
  contractorId: string;
  onAllCompleted: () => void;
}

/**
 * Full-screen blocking overlay that forces the contractor to watch mandatory videos.
 * Cannot be closed until all videos are watched.
 * Uses the same MultiSourceVideoPlayer with seekbar hidden on first watch.
 */
export function PflichtVideoOverlay({ videos, contractorId, onAllCompleted }: PflichtVideoOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoComplete, setIsVideoComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const playerRef = useRef<VideoPlayerHandle>(null);

  const current = videos[currentIndex];
  const total = videos.length;

  // Listen for Player.js 'ended' event from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'ended' || data?.event === 'complete') {
          setIsVideoComplete(true);
        }
        // Player.js protocol
        if (data?.method === 'addEventListener' || data?.event === 'ended') {
          setIsVideoComplete(true);
        }
        // Bunny Stream specific
        if (data?.type === 'player' && data?.event === 'videoEnd') {
          setIsVideoComplete(true);
        }
      } catch {
        // Not a JSON message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentIndex]);

  const markCompletedAndNext = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Save completion to DB
      const { error } = await supabaseTC
        .from('contractor_akademie_lektions_fortschritt')
        .upsert(
          {
            contractor_id: contractorId,
            lektion_id: current.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            started_at: new Date().toISOString(),
            video_progress_seconds: 0,
          },
          { onConflict: 'contractor_id,lektion_id' }
        );

      if (error) {
        console.error('[PflichtVideo] Save error:', error);
      }

      if (currentIndex < total - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsVideoComplete(false);
      } else {
        onAllCompleted();
      }
    } finally {
      setIsSaving(false);
    }
  }, [contractorId, current, currentIndex, total, onAllCompleted, isSaving]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/50">
        <GraduationCap className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Pflicht-Video: {current.titel}</p>
          <p className="text-xs text-muted-foreground">{current.modul_titel} • Video {currentIndex + 1} von {total}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${((currentIndex + (isVideoComplete ? 1 : 0)) / total) * 100}%` }} 
        />
      </div>

      {/* Video */}
      <div className="flex-1 relative">
        <MultiSourceVideoPlayer
          ref={playerRef}
          videoUrl={current.video_url}
          heightMode="hero"
          hideSeekbar
        />
      </div>

      {/* Bottom action */}
      <div className="px-4 py-4 border-t bg-background">
        {isVideoComplete ? (
          <button
            onClick={markCompletedAndNext}
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving
              ? 'Wird gespeichert...'
              : currentIndex < total - 1
                ? 'Weiter zum nächsten Video →'
                : 'Abschließen ✓'}
          </button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Bitte schaue das Video vollständig an, um fortzufahren.
          </p>
        )}
      </div>
    </div>
  );
}
