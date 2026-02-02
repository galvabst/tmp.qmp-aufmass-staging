import { useState, useEffect, useCallback, RefObject } from 'react';

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
