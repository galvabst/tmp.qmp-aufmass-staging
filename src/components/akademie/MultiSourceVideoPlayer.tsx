import { useRef } from 'react';
import { Play, Loader2, ExternalLink } from 'lucide-react';
import { useSignedVideoUrl } from '@/hooks/useSignedVideoUrl';

interface MultiSourceVideoPlayerProps {
  videoUrl: string | null | undefined;
}

/**
 * Detects the video source type from a URL
 */
function detectVideoSource(url: string): 'bunny-stream' | 'youtube' | 'direct-mp4' | 'supabase-storage' {
  // Bunny Stream iframe embed
  if (url.includes('iframe.mediadelivery.net') || url.includes('video.bunnycdn.com')) {
    return 'bunny-stream';
  }
  
  // YouTube (various formats)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  
  // Direct video file (mp4, webm, etc.)
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) {
    return 'direct-mp4';
  }
  
  // Default: assume Supabase Storage path (no http)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'supabase-storage';
  }
  
  // Unknown URL with http - try as direct video
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
    <div className="relative w-full aspect-video bg-black">
      <iframe
        src={url}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
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
    <div className="relative w-full aspect-video bg-black">
      <iframe
        src={embedUrl}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
    <div className="relative w-full aspect-video bg-black">
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full h-full"
        controlsList="nodownload"
        playsInline
      >
        Dein Browser unterstützt keine Videos.
      </video>
    </div>
  );
}

// Supabase Storage player (uses signed URLs)
function SupabaseStoragePlayer({ path }: { path: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { signedUrl, isLoading, error } = useSignedVideoUrl(path);
  
  if (isLoading) {
    return (
      <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin mb-2" />
        <p className="text-white/80 text-sm">Video wird geladen...</p>
      </div>
    );
  }
  
  if (error || !signedUrl) {
    return (
      <div className="relative w-full aspect-video bg-black flex flex-col items-center justify-center text-white/60">
        <Play className="w-12 h-12 mb-2" />
        <p className="text-sm">Video konnte nicht geladen werden</p>
      </div>
    );
  }
  
  return (
    <div className="relative w-full aspect-video bg-black">
      <video
        ref={videoRef}
        src={signedUrl}
        controls
        className="w-full h-full"
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
  
  switch (sourceType) {
    case 'bunny-stream':
      return <BunnyStreamPlayer url={videoUrl} />;
    case 'youtube':
      return <YouTubePlayer url={videoUrl} />;
    case 'direct-mp4':
      return <DirectVideoPlayer url={videoUrl} />;
    case 'supabase-storage':
      return <SupabaseStoragePlayer path={videoUrl} />;
    default:
      return <NoVideoPlaceholder />;
  }
}
