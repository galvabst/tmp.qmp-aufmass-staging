import { useRef } from 'react';
import { Play } from 'lucide-react';

interface MultiSourceVideoPlayerProps {
  videoUrl: string | null | undefined;
}

/**
 * Detects the video source type from a URL
 * Videos now come from Bunny Stream, YouTube, or direct MP4 URLs
 */
function detectVideoSource(url: string): 'bunny-stream' | 'youtube' | 'direct-mp4' {
  // Bunny Stream iframe embed
  if (url.includes('iframe.mediadelivery.net') || url.includes('video.bunnycdn.com')) {
    return 'bunny-stream';
  }
  
  // YouTube (various formats)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Default: Direct video file
  return 'direct-mp4';
}

/**
 * Converts YouTube URL to embed URL
 */
function getYouTubeEmbedUrl(url: string): string {
  // Handle youtu.be format
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }
  
  // Handle youtube.com/watch?v= format
  const longMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
  if (longMatch) {
    return `https://www.youtube.com/embed/${longMatch[1]}`;
  }
  
  // Handle youtube.com/embed/ format (already correct)
  if (url.includes('/embed/')) {
    return url;
  }
  
  // Fallback
  return url;
}

// Bunny Stream iframe player
function BunnyStreamPlayer({ url }: { url: string }) {
  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] max-h-[600px] bg-black">
      <iframe
        src={url}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        title="Video Player"
      />
    </div>
  );
}

// YouTube iframe player
function YouTubePlayer({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url);
  
  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] max-h-[600px] bg-black">
      <iframe
        src={embedUrl}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        title="YouTube Video Player"
      />
    </div>
  );
}

// Direct MP4/video file player
function DirectVideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] max-h-[600px] bg-black">
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full h-full object-contain"
        controlsList="nodownload"
        playsInline
      >
        Dein Browser unterstützt keine Videos.
      </video>
    </div>
  );
}

// No video placeholder
function NoVideoPlaceholder() {
  return (
    <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center text-white/60">
      <Play className="w-12 h-12 mb-2" />
      <p className="text-sm">Kein Video verfügbar</p>
    </div>
  );
}

/**
 * Multi-source video player that automatically detects and renders
 * the appropriate player based on the video URL type
 */
export function MultiSourceVideoPlayer({ videoUrl }: MultiSourceVideoPlayerProps) {
  // No video URL provided
  if (!videoUrl || videoUrl.trim() === '') {
    return <NoVideoPlaceholder />;
  }
  
  const sourceType = detectVideoSource(videoUrl);
  
  const renderPlayer = () => {
    switch (sourceType) {
      case 'bunny-stream':
        return <BunnyStreamPlayer url={videoUrl} />;
      case 'youtube':
        return <YouTubePlayer url={videoUrl} />;
      case 'direct-mp4':
        return <DirectVideoPlayer url={videoUrl} />;
      default:
        return <NoVideoPlaceholder />;
    }
  };
  
  return (
    <div className="w-full">
      {renderPlayer()}
      {/* Mobile fullscreen hint */}
      <p className="text-xs text-center text-muted-foreground py-1.5 sm:hidden">
        Tippe auf das Video für Vollbild
      </p>
    </div>
  );
}
