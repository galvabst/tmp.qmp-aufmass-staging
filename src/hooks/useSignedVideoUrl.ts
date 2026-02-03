import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSignedVideoUrlResult {
  signedUrl: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to generate and manage signed URLs for private videos in Supabase Storage.
 * The signed URL is valid for 1 hour and auto-refreshes before expiration.
 * 
 * @param videoPath - The path to the video in the storage bucket (e.g., "modul-1/intro.mp4")
 * @param bucketName - The storage bucket name (defaults to "akademie-videos")
 */
export function useSignedVideoUrl(
  videoPath: string | null | undefined,
  bucketName: string = 'akademie-videos'
): UseSignedVideoUrlResult {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    if (!videoPath) {
      setSignedUrl(null);
      setError(null);
      return;
    }

    // If it's already a full URL (not a storage path), use it directly
    if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
      setSignedUrl(videoPath);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    async function fetchSignedUrl() {
      setIsLoading(true);
      setError(null);

      try {
        // Generate signed URL valid for 1 hour (3600 seconds)
        const { data, error: signError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(videoPath, 3600);

        if (isCancelled) return;

        if (signError) {
          console.error('[useSignedVideoUrl] Error creating signed URL:', signError);
          setError(signError.message);
          setSignedUrl(null);
        } else if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        if (isCancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useSignedVideoUrl] Exception:', message);
        setError(message);
        setSignedUrl(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSignedUrl();

    // Auto-refresh the signed URL before it expires (refresh after 50 minutes)
    const refreshInterval = setInterval(() => {
      fetchSignedUrl();
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      isCancelled = true;
      clearInterval(refreshInterval);
    };
  }, [videoPath, bucketName, refreshTrigger]);

  return { signedUrl, isLoading, error, refresh };
}
