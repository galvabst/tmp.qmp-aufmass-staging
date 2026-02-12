import { useRef } from 'react';
import { GalvanekLogo } from '@/components/GalvanekLogo';
import { MultiSourceVideoPlayer, VideoPlayerHandle } from '@/components/akademie/MultiSourceVideoPlayer';
import { useBunnyPlayerProgress } from '@/hooks/useVideoProgress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight } from 'lucide-react';

const INTRO_VIDEO_URL = 'https://iframe.mediadelivery.net/play/591760/304c7347-3b6f-4231-988b-59e5b8082e32';

interface IntroVideoProps {
  onComplete: () => void;
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const playerRef = useRef<VideoPlayerHandle>(null);
  
  // Create a stable ref object for the iframe
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Use the same skip-protection hook as Akademie videos
  // 30 min as fallback duration – real duration comes from Player.js API
  const {
    percentComplete,
    timeRemainingFormatted,
    isVideoEnded,
  } = useBunnyPlayerProgress(30, iframeRef);

  // Sync iframe ref from MultiSourceVideoPlayer
  const syncIframeRef = () => {
    const iframe = playerRef.current?.getIframeRef();
    if (iframe && iframe !== iframeRef.current) {
      iframeRef.current = iframe;
    }
  };

  // Poll for iframe availability
  requestAnimationFrame(syncIframeRef);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Logo */}
      <div className="flex justify-center pt-8 pb-4">
        <GalvanekLogo size="md" />
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        <div className="w-full max-w-3xl">
          <MultiSourceVideoPlayer
            ref={playerRef}
            videoUrl={INTRO_VIDEO_URL}
            heightMode="contained"
          />
        </div>
      </div>

      {/* Progress + Button */}
      <div className="px-6 pb-8 pt-4 space-y-4">
        {!isVideoEnded && (
          <div className="space-y-2">
            <Progress value={percentComplete} className="h-2 bg-white/10" />
            <p className="text-white/60 text-sm text-center">
              {timeRemainingFormatted}
            </p>
          </div>
        )}

        <Button
          onClick={onComplete}
          disabled={!isVideoEnded}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          Weiter zum Onboarding
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {!isVideoEnded && (
          <p className="text-white/40 text-xs text-center">
            Bitte schaue das Video vollständig an, um fortzufahren.
          </p>
        )}
      </div>
    </div>
  );
}
