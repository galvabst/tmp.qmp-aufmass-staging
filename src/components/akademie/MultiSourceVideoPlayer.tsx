import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react';
import { Play } from 'lucide-react';

export interface VideoPlayerHandle {
  getIframeRef: () => HTMLIFrameElement | null;
}

/** Detected video dimensions from the player */
export interface VideoAspectInfo {
  width: number;
  height: number;
  ratio: number; // width / height
  isPortrait: boolean;
}

interface MultiSourceVideoPlayerProps {
  videoUrl: string | null | undefined;
  /** Height mode: 'hero' fills available space, 'contained' uses aspect ratio */
  heightMode?: 'hero' | 'contained';
  /** Callback when video dimensions are detected */
  onAspectDetected?: (info: VideoAspectInfo) => void;
  /** When true, renders a CSS overlay hiding the iframe seekbar (bottom ~48px) */
  hideSeekbar?: boolean;
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

/** Bunny CDN base URL for this library — used to load thumbnails for aspect ratio detection */
const BUNNY_CDN_BASE = 'https://vz-939265f2-233.b-cdn.net';

/**
 * Extracts the video ID from a Bunny Stream URL
 * e.g. https://iframe.mediadelivery.net/play/591760/3d205096-... → 3d205096-...
 */
function extractBunnyVideoId(url: string): string | null {
  const match = url.match(/(?:play|embed)\/\d+\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
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
  function MultiSourceVideoPlayer({ videoUrl, heightMode = 'hero', onAspectDetected, hideSeekbar = false }, ref) {
    const bunnyIframeRef = useRef<HTMLIFrameElement>(null);
    const [aspectRatio, setAspectRatio] = useState('16/9');
    const [isPortrait, setIsPortrait] = useState(false);
    
    // Expose iframe ref to parent
    useImperativeHandle(ref, () => ({
      getIframeRef: () => bunnyIframeRef.current
    }), []);
    
    // Detect aspect ratio by loading the Bunny thumbnail image
    useEffect(() => {
      if (!videoUrl) return;
      
      const sourceType = detectVideoSource(videoUrl);
      if (sourceType !== 'bunny-stream') return;
      
      const videoId = extractBunnyVideoId(videoUrl);
      if (!videoId) return;
      
      const thumbnailUrl = `${BUNNY_CDN_BASE}/${videoId}/thumbnail.jpg`;
      const img = new Image();
      
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (w > 0 && h > 0) {
          const portrait = h > w;
          console.log(`[VideoPlayer] Thumbnail dimensions: ${w}x${h}, portrait: ${portrait}`);
          setAspectRatio(`${w}/${h}`);
          setIsPortrait(portrait);
          onAspectDetected?.({ width: w, height: h, ratio: w / h, isPortrait: portrait });
        }
      };
      
      img.onerror = () => {
        console.warn('[VideoPlayer] Could not load thumbnail for aspect detection, keeping 16:9');
      };
      
      img.src = thumbnailUrl;
    }, [videoUrl, onAspectDetected]);
    
    // No video URL provided
    if (!videoUrl || videoUrl.trim() === '') {
      return (
        <div className="relative w-full bg-black overflow-hidden" style={{ 
          aspectRatio: '16/9',
          width: '100%',
          maxHeight: heightMode === 'hero' ? '70vh' : undefined,
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
    
    // For portrait videos on mobile: limit height so tabs/footer stay visible
    const maxHeight = heightMode === 'hero'
      ? (isPortrait ? '65vh' : '70vh')
      : undefined;
    
    return (
      <div className="w-full bg-black overflow-hidden">
        <div 
          className="relative w-full bg-black mx-auto"
          style={{ 
            aspectRatio,
            width: '100%',
            maxHeight,
          }}
        >
          {renderPlayer()}
          {/* Seekbar overlay: blocks interaction with the iframe's native seekbar */}
          {hideSeekbar && (
            <div
              className="absolute bottom-0 left-0 right-0 z-10"
              style={{
                height: '48px',
                pointerEvents: 'auto',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))',
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </div>
    );
  }
);
