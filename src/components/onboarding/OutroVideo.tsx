import { useEffect, useRef } from 'react';
import { MultiSourceVideoPlayer, VideoPlayerHandle } from '@/components/akademie/MultiSourceVideoPlayer';
import { useBunnyPlayerProgress } from '@/hooks/useVideoProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';

const OUTRO_VIDEO_URL = 'https://iframe.mediadelivery.net/embed/591760/37bee5ad-1e93-454a-b48a-e10dd0b90e38';

interface OutroVideoProps {
  onComplete: () => void;
  /** Wenn true, kann der Button sofort geklickt werden (Bestandskandidaten / Wiederaufruf) */
  allowSkip?: boolean;
}

export function OutroVideo({ onComplete, allowSkip = false }: OutroVideoProps) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    percentComplete,
    timeRemainingFormatted,
    isVideoEnded,
  } = useBunnyPlayerProgress(30, iframeRef, { lessonId: 'outro-video' });

  // iframe-Ref einfangen, sobald der Player sie bereitstellt – als Effekt,
  // nicht als Seiteneffekt im Render-Body (React-Render-Purity).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const iframe = playerRef.current?.getIframeRef();
      if (iframe && iframe !== iframeRef.current) {
        iframeRef.current = iframe;
      }
    });
    return () => cancelAnimationFrame(raf);
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Title */}
      <div className="flex flex-col items-center pt-6 pb-2">
        <h1 className="text-white text-lg font-semibold">Praxis-Phase abgeschlossen! 🎉</h1>
        <p className="text-white/60 text-sm mt-1">Schau dir dieses Video an, bevor es weitergeht.</p>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center px-2 min-h-0">
        <div className="w-full max-w-4xl">
          <MultiSourceVideoPlayer
            ref={playerRef}
            videoUrl={OUTRO_VIDEO_URL}
            heightMode="contained"
            hideSeekbar={true}
          />
        </div>
      </div>

      {/* Progress + Button */}
      <div className="px-6 pb-8 pt-4 space-y-4">
        {!isVideoEnded && !allowSkip && (
          <div className="space-y-2">
            <Progress value={percentComplete} className="h-2 bg-white/20 [&>div]:bg-primary" />
            <p className="text-white/60 text-sm text-center">
              {timeRemainingFormatted}
            </p>
          </div>
        )}

        <Button
          onClick={onComplete}
          disabled={!isVideoEnded && !allowSkip}
          className="w-full h-12 text-base font-semibold disabled:opacity-30"
          size="lg"
        >
          Weiter zum Coaching
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!isVideoEnded && !allowSkip && (
          <p className="text-white/40 text-xs text-center">
            Bitte schaue das Video vollständig an, um fortzufahren.
          </p>
        )}
      </div>
    </div>
  );
}
