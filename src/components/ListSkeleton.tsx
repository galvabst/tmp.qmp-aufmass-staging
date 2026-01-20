import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface ListSkeletonProps {
  /** Anzahl der Skeleton-Karten */
  count?: number;
  /** Zeigt Avatar/Icon Platzhalter */
  showAvatar?: boolean;
  /** Zeigt Badge Platzhalter */
  showBadge?: boolean;
}

/**
 * Wiederverwendbare Loading-Skeleton Komponente für Listen
 * Konsistentes Loading-Pattern für alle Listen-Views
 */
export function ListSkeleton({ 
  count = 3, 
  showAvatar = true, 
  showBadge = true 
}: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {showAvatar && (
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              )}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              {showBadge && (
                <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton für Filter-Leiste
 */
export function FilterSkeleton() {
  return (
    <div className="bg-muted/50 p-4 rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton für Detail-Ansicht
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Cards */}
      <div className="grid gap-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
