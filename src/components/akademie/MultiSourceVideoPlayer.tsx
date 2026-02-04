import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Play } from 'lucide-react';

export interface VideoPlayerHandle {
  getIframeRef: () => HTMLIFrameElement | null;
}

interface MultiSourceVideoPlayerProps {
  videoUrl: string | null | undefined;
  /** Height mode: 'hero' fills available space, 'contained' uses aspect ratio */
  heightMode?: 'hero' | 'contained';
}

/**
 * Detects the video source type from a URL
 * Videos now come from Bunny Stream, YouTube, or direct MP4 URLs
 */
export function detectVideoSource(url: string): 'bunny-stream' | 'youtube' | 'direct-mp4' {
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
 * Normalizes Bunny Stream URLs for optimal iframe embedding:
 * - Converts /play/ to /embed/ (better responsive behavior)
 * - Adds responsive=true parameter
 * - Preserves existing query parameters
 */
function normalizeBunnyUrl(url: string): string {
  try {
    // Convert /play/ to /embed/
    let normalizedUrl = url.replace('/play/', '/embed/');
    
    const urlObj = new URL(normalizedUrl);
    
    // Add responsive=true if not present
    if (!urlObj.searchParams.has('responsive')) {
      urlObj.searchParams.set('responsive', 'true');
    }
    
    // Ensure autoplay is off by default for better UX
    if (!urlObj.searchParams.has('autoplay')) {
      urlObj.searchParams.set('autoplay', 'false');
    }
    
    // Ensure preload is set for faster loading
    if (!urlObj.searchParams.has('preload')) {
      urlObj.searchParams.set('preload', 'true');
    }
    
    return urlObj.toString();
  } catch (e) {
    // If URL parsing fails, return original with simple replacement
    console.warn('Failed to parse Bunny URL, using fallback:', e);
    let fallback = url.replace('/play/', '/embed/');
    if (!fallback.includes('responsive=')) {
      fallback += (fallback.includes('?') ? '&' : '?') + 'responsive=true';
    }
    return fallback;
  }
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

// Bunny Stream iframe player with normalized URL and DIRECT ref forwarding
// Fix: Previously used useImperativeHandle which broke the ref chain
const BunnyStreamPlayer = forwardRef<HTMLIFrameElement, { url: string }>(
  function BunnyStreamPlayer({ url }, ref) {
    const normalizedUrl = normalizeBunnyUrl(url);
    
    return (
      <iframe
        ref={ref}  // Direct ref forwarding to parent
        id="bunny-player-iframe"
        src={normalizedUrl}
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0 block"
        style={{ backgroundColor: 'black' }}
        title="Video Player"
      />
    );
  }
);

// YouTube iframe player
function YouTubePlayer({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url);
  
  return (
    <iframe
      src={embedUrl}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      allowFullScreen
      className="absolute inset-0 w-full h-full border-0 block"
      style={{ backgroundColor: 'black' }}
      title="YouTube Video Player"
    />
  );
}

// Direct MP4/video file player
function DirectVideoPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  return (
    <video
      ref={videoRef}
      src={url}
      controls
      className="absolute inset-0 w-full h-full object-contain"
      style={{ backgroundColor: 'black' }}
      controlsList="nodownload"
      playsInline
    >
      Dein Browser unterstützt keine Videos.
    </video>
  );
}

// No video placeholder
function NoVideoPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 bg-black">
      <Play className="w-12 h-12 mb-2" />
      <p className="text-sm">Kein Video verfügbar</p>
    </div>
  );
}

/**
 * Multi-source video player that automatically detects and renders
 * the appropriate player based on the video URL type.
 * 
 * Uses CSS variable --akademie-header-h set by parent for hero mode sizing.
 * Exposes iframe ref via imperative handle for Player.js integration.
 */
export const MultiSourceVideoPlayer = forwardRef<VideoPlayerHandle, MultiSourceVideoPlayerProps>(
  function MultiSourceVideoPlayer({ videoUrl, heightMode = 'hero' }, ref) {
    const bunnyIframeRef = useRef<HTMLIFrameElement>(null);
    
    // Expose iframe ref to parent
    useImperativeHandle(ref, () => ({
      getIframeRef: () => bunnyIframeRef.current
    }), []);
    
    // No video URL provided
    if (!videoUrl || videoUrl.trim() === '') {
      return (
        <div className="relative w-full bg-black overflow-hidden" style={{ 
          height: heightMode === 'hero' 
            ? 'calc(100svh - var(--akademie-header-h, 60px) - var(--akademie-footer-h, 72px))' 
            : undefined,
          aspectRatio: heightMode === 'contained' ? '16/9' : undefined,
          maxHeight: heightMode === 'hero' ? '75vh' : undefined,
        }}>
          <NoVideoPlaceholder />
        </div>
      );
    }
    
    const sourceType = detectVideoSource(videoUrl);
    
    const renderPlayer = () => {
      switch (sourceType) {
        case 'bunny-stream':
          return <BunnyStreamPlayer ref={bunnyIframeRef} url={videoUrl} />;
        case 'youtube':
          return <YouTubePlayer url={videoUrl} />;
        case 'direct-mp4':
          return <DirectVideoPlayer url={videoUrl} />;
        default:
          return <NoVideoPlaceholder />;
      }
    };
    
    return (
      <div className="w-full bg-black overflow-hidden">
        {/* Video container with dynamic height based on mode */}
        {/* REMOVED maxHeight: 75vh to allow portrait videos to fill container like YouTube */}
        <div 
          className="relative w-full bg-black"
          style={{ 
            height: heightMode === 'hero' 
              ? 'calc(100svh - var(--akademie-header-h, 60px) - var(--akademie-footer-h, 72px))' 
              : undefined,
            aspectRatio: heightMode === 'contained' ? '16/9' : undefined,
            minHeight: heightMode === 'hero' ? '300px' : undefined,
          }}
        >
          {renderPlayer()}
        </div>
      </div>
    );
  }
);
