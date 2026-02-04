import { useState, useEffect, useCallback, RefObject, useRef } from 'react';

interface UseVideoProgressOptions {
  /** Percentage of video that must be watched (0-1). Default: 0.9 (90%) */
  requiredWatchPercent?: number;
  /** Fallback timeout in seconds if video fails to load. Default: 60 */
  fallbackTimeoutSeconds?: number;
  /** Callback when video can be marked complete */
  onCanComplete?: () => void;
}

interface UseVideoProgressReturn {
  /** Whether the video has been watched enough to complete */
  canComplete: boolean;
  /** Total seconds watched (only counts forward progress) */
  watchedSeconds: number;
  /** Total duration of the video in seconds */
  duration: number;
  /** Percentage of video watched (0-100) */
  percentWatched: number;
  /** Whether the fallback timeout was triggered */
  isFallbackActive: boolean;
  /** Event handlers to attach to video element */
  handlers: {
    onLoadedMetadata: () => void;
    onTimeUpdate: () => void;
    onEnded: () => void;
  };
}

/**
 * Hook to track video progress for unskippable video logic.
 * Only counts forward progress - seeking doesn't artificially increase watched time.
 */
export function useVideoProgress(
  videoRef: RefObject<HTMLVideoElement>,
  options: UseVideoProgressOptions = {}
): UseVideoProgressReturn {
  const {
    requiredWatchPercent = 0.9,
    fallbackTimeoutSeconds = 60,
    onCanComplete,
  } = options;

  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastKnownTime, setLastKnownTime] = useState(0);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Calculate derived values
  const requiredWatchTime = duration * requiredWatchPercent;
  const canComplete = isFallbackActive || watchedSeconds >= requiredWatchTime;
  const percentWatched = duration > 0 
    ? Math.min(100, Math.round((watchedSeconds / duration) * 100))
    : 0;

  // Fallback timer for when video doesn't load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (duration === 0) {
        console.log('[VideoProgress] Fallback timeout triggered - video did not load');
        setIsFallbackActive(true);
      }
    }, fallbackTimeoutSeconds * 1000);

    return () => clearTimeout(timer);
  }, [fallbackTimeoutSeconds, duration]);

  // Notify when completion is possible
  useEffect(() => {
    if (canComplete && !hasCompleted) {
      setHasCompleted(true);
      onCanComplete?.();
    }
  }, [canComplete, hasCompleted, onCanComplete]);

  // Handle video metadata loaded
  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      console.log('[VideoProgress] Video loaded, duration:', video.duration);
    }
  }, [videoRef]);

  // Handle time updates - only count forward progress
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const currentTime = video.currentTime;
    
    // Only add time if we're moving forward naturally (not seeking)
    // Allow small jumps (< 2 seconds) for normal playback variations
    if (currentTime > lastKnownTime && currentTime - lastKnownTime < 2) {
      const timeDelta = currentTime - lastKnownTime;
      setWatchedSeconds(prev => prev + timeDelta);
    }
    
    setLastKnownTime(currentTime);
  }, [lastKnownTime, videoRef]);

  // Handle video ended
  const onEnded = useCallback(() => {
    console.log('[VideoProgress] Video ended, watched:', watchedSeconds);
    // If video ends, they've watched enough
    if (duration > 0) {
      setWatchedSeconds(duration);
    }
  }, [duration, watchedSeconds]);

  return {
    canComplete,
    watchedSeconds,
    duration,
    percentWatched,
    isFallbackActive,
    handlers: {
      onLoadedMetadata,
      onTimeUpdate,
      onEnded,
    },
  };
}

/**
 * Hook for Bunny Stream videos using Player.js API.
 * Tracks actual playback time and prevents skipping ahead.
 */
export function useBunnyPlayerProgress(
  videoDurationMinutes: number,
  iframeRef: RefObject<HTMLIFrameElement | null>,
  options: { requiredWatchPercent?: number } = {}
): {
  canComplete: boolean;
  watchedSeconds: number;
  requiredSeconds: number;
  percentComplete: number;
  timeRemainingFormatted: string;
  isPlaying: boolean;
} {
  const { requiredWatchPercent = 0.9 } = options;
  
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  // Refs for tracking state without triggering re-renders
  const maxReachedTimeRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const playerRef = useRef<playerjs.Player | null>(null);
  
  const requiredSeconds = Math.round(videoDurationMinutes * 60 * requiredWatchPercent);
  const canComplete = watchedSeconds >= requiredSeconds;
  const percentComplete = requiredSeconds > 0 
    ? Math.min(100, Math.round((watchedSeconds / requiredSeconds) * 100))
    : 100;
  
  // Format: "X:XX verbleibend"
  const remaining = Math.max(0, requiredSeconds - watchedSeconds);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeRemainingFormatted = `${mins}:${secs.toString().padStart(2, '0')} verbleibend`;
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) {
      console.log('[BunnyPlayer] No iframe ref yet');
      return;
    }
    
    // Check if playerjs is available
    if (typeof playerjs === 'undefined') {
      console.warn('[BunnyPlayer] Player.js not loaded, falling back to timer');
      return;
    }
    
    console.log('[BunnyPlayer] Initializing Player.js');
    
    const initPlayer = () => {
      try {
        const player = new playerjs.Player(iframe);
        playerRef.current = player;
        
        player.on('ready', () => {
          console.log('[BunnyPlayer] Player ready');
          setIsPlayerReady(true);
        });
        
        player.on('play', () => {
          console.log('[BunnyPlayer] Playing');
          setIsPlaying(true);
        });
        
        player.on('pause', () => {
          console.log('[BunnyPlayer] Paused');
          setIsPlaying(false);
        });
        
        player.on('ended', () => {
          console.log('[BunnyPlayer] Ended');
          setIsPlaying(false);
          // Mark as fully watched when video ends naturally
          setWatchedSeconds(requiredSeconds);
        });
        
        player.on('timeupdate', (data: { seconds: number; duration: number }) => {
          const currentTime = data.seconds;
          const lastTime = lastUpdateTimeRef.current;
          const maxReached = maxReachedTimeRef.current;
          
          // Normal playback: small forward jumps (< 2 sec)
          if (currentTime > lastTime && currentTime - lastTime < 2) {
            const timeDelta = currentTime - lastTime;
            setWatchedSeconds(prev => prev + timeDelta);
            maxReachedTimeRef.current = Math.max(maxReached, currentTime);
          }
          // Skip detected: user jumped ahead of max reached position
          else if (currentTime > maxReached + 2) {
            console.log('[BunnyPlayer] Skip detected! Resetting to:', maxReached);
            player.setCurrentTime(maxReached);
          }
          // Backward seek is allowed (rewinding)
          else if (currentTime < lastTime) {
            // Just update last time, don't add to watched
          }
          
          lastUpdateTimeRef.current = currentTime;
        });
        
        player.on('error', (err: unknown) => {
          console.error('[BunnyPlayer] Error:', err);
        });
        
      } catch (err) {
        console.error('[BunnyPlayer] Failed to initialize:', err);
      }
    };
    
    // Wait for iframe to be ready
    if (iframe.contentWindow) {
      initPlayer();
    } else {
      iframe.addEventListener('load', initPlayer);
      return () => iframe.removeEventListener('load', initPlayer);
    }
    
    return () => {
      // Cleanup player listeners
      if (playerRef.current) {
        try {
          playerRef.current.off('ready');
          playerRef.current.off('play');
          playerRef.current.off('pause');
          playerRef.current.off('ended');
          playerRef.current.off('timeupdate');
          playerRef.current.off('error');
        } catch (e) {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [iframeRef, requiredSeconds]);
  
  // Fallback timer if Player.js fails to initialize after 5 seconds
  useEffect(() => {
    if (isPlayerReady) return; // Player.js is working
    
    const fallbackTimer = setTimeout(() => {
      if (!isPlayerReady) {
        console.warn('[BunnyPlayer] Player.js not ready after 5s, using fallback timer');
      }
    }, 5000);
    
    return () => clearTimeout(fallbackTimer);
  }, [isPlayerReady]);
  
  return { 
    canComplete, 
    watchedSeconds: Math.round(watchedSeconds),
    requiredSeconds, 
    percentComplete, 
    timeRemainingFormatted,
    isPlaying
  };
}

/**
 * Hook for iframe-based videos (Bunny/YouTube) where we can't track playback.
 * Uses a page-based timer with the lesson's stored duration.
 * @deprecated Use useBunnyPlayerProgress for Bunny Stream videos
 */
export function useIframeLessonProgress(
  videoDurationMinutes: number,
  options: { requiredWatchPercent?: number } = {}
): {
  canComplete: boolean;
  elapsedSeconds: number;
  requiredSeconds: number;
  percentComplete: number;
  timeRemainingFormatted: string;
} {
  const { requiredWatchPercent = 0.9 } = options;
  const [elapsed, setElapsed] = useState(0);
  
  const requiredSeconds = Math.round(videoDurationMinutes * 60 * requiredWatchPercent);
  const canComplete = elapsed >= requiredSeconds;
  const percentComplete = requiredSeconds > 0 
    ? Math.min(100, Math.round((elapsed / requiredSeconds) * 100))
    : 100;
  
  // Format: "X:XX verbleibend"
  const remaining = Math.max(0, requiredSeconds - elapsed);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeRemainingFormatted = `${mins}:${secs.toString().padStart(2, '0')} verbleibend`;
  
  useEffect(() => {
    if (canComplete) return; // Stop timer once complete
    
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [canComplete]);
  
  return { canComplete, elapsedSeconds: elapsed, requiredSeconds, percentComplete, timeRemainingFormatted };
}

/**
 * Simple hook for non-video lessons (text only)
 * Enables completion after a minimum reading time.
 */
export function useReadingProgress(
  estimatedMinutes: number,
  options: { minReadTimeSeconds?: number } = {}
): { canComplete: boolean; timeRemaining: number } {
  const { minReadTimeSeconds = 30 } = options;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const canComplete = elapsed >= minReadTimeSeconds;
  const timeRemaining = Math.max(0, minReadTimeSeconds - elapsed);

  return { canComplete, timeRemaining };
}
