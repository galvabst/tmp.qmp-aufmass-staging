import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useLayoutEffect, useState } from 'react';
import { ArrowLeft, Check, Clock, BookOpen, FileText, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAkademieUnterpunkt } from '@/hooks/useAkademieContent';
import { MultiSourceVideoPlayer } from '@/components/akademie/MultiSourceVideoPlayer';
import { isUuid } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const STORAGE_KEY = 'thermocheck_onboarding_state_v2';

function handleResetAkademieCache() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const state = JSON.parse(saved);
      // Only reset akademie fields, keep other onboarding progress
      state.akademieHauptmodule = [];
      state.akademieModule = [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch (e) {
    console.warn('Failed to reset akademie cache', e);
  }
}

export default function AkademieModul() {
  const { modulId } = useParams<{ modulId: string }>();
  const navigate = useNavigate();
  
  // Refs for measuring header/footer heights
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const [cssVarsReady, setCssVarsReady] = useState(false);
  
  // Guard: Check if modulId is a valid UUID before making API call
  const isValidUuid = isUuid(modulId);
  
  const { data: unterpunkt, isLoading, error } = useAkademieUnterpunkt(
    isValidUuid ? modulId : undefined // Only fetch if valid UUID
  );
  
  // Measure header and footer heights, set CSS variables
  useLayoutEffect(() => {
    const updateCssVars = () => {
      const headerHeight = headerRef.current?.offsetHeight ?? 60;
      const footerHeight = footerRef.current?.offsetHeight ?? 72;
      
      document.documentElement.style.setProperty('--akademie-header-h', `${headerHeight}px`);
      document.documentElement.style.setProperty('--akademie-footer-h', `${footerHeight}px`);
      setCssVarsReady(true);
    };
    
    // Initial measurement
    updateCssVars();
    
    // Re-measure on resize
    const resizeObserver = new ResizeObserver(updateCssVars);
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    if (footerRef.current) resizeObserver.observe(footerRef.current);
    
    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty('--akademie-header-h');
      document.documentElement.style.removeProperty('--akademie-footer-h');
    };
  }, []);
  
  // Invalid UUID - show legacy link warning
  if (!isValidUuid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Veralteter Link</AlertTitle>
            <AlertDescription>
              Dieser Link verweist auf eine alte Version der Akademie. 
              Die Daten wurden aktualisiert und müssen neu geladen werden.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => {
                handleResetAkademieCache();
                navigate('/');
                // Force page reload to trigger fresh DB hydration
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Daten aktualisieren & zurück
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Nur zurück zum Onboarding
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  // Error or not found state
  if (error || !unterpunkt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Modul nicht gefunden</h1>
          <p className="text-muted-foreground mt-2">
            Das gewünschte Modul konnte nicht geladen werden.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/')}
          >
            Zurück zum Onboarding
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkComplete = () => {
    navigate('/', { 
      state: { 
        completedHauptmodulId: unterpunkt.hauptmodulId,
        completedUnterpunktId: unterpunkt.id,
      } 
    });
  };

  const hasTextContent = unterpunkt.textInhalt && unterpunkt.textInhalt.trim().length > 0;
  const hasZusatzmaterial = unterpunkt.zusatzmaterialUrls && unterpunkt.zusatzmaterialUrls.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Compact with measured height */}
      <header 
        ref={headerRef}
        className="sticky top-0 z-50 bg-card border-b border-border safe-area-top"
      >
        <div className="flex items-start gap-2 px-3 py-2 max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-muted-foreground truncate leading-tight">
              {unterpunkt.hauptmodulTitel}
            </p>
            <h1 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
              {unterpunkt.titel}
            </h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{unterpunkt.dauerMinuten} Minuten</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Video Container - Full Width Hero (edge-to-edge, fills available space) */}
        {cssVarsReady && (
          <MultiSourceVideoPlayer videoUrl={unterpunkt.videoUrl} heightMode="hero" />
        )}

        {/* Content Container - Constrained for readability */}
        <div className="w-full max-w-3xl mx-auto">
          {/* Tabs: Lerninhalt / Zusammenfassung / Material */}
          <div className="p-4">
            <Tabs defaultValue="inhalt" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="inhalt" className="gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Lerninhalt</span>
                </TabsTrigger>
                <TabsTrigger value="zusammenfassung" className="gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Zusammenfassung</span>
                </TabsTrigger>
                <TabsTrigger value="material" className="gap-1.5" disabled={!hasZusatzmaterial}>
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden sm:inline">Material</span>
                </TabsTrigger>
              </TabsList>

              {/* Lerninhalt Tab */}
              <TabsContent value="inhalt" className="mt-0">
                {hasTextContent ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                    <ReactMarkdown>{unterpunkt.textInhalt!}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Kein Lerninhalt verfügbar.</p>
                    <p className="text-sm">Schaue dir das Video an.</p>
                  </div>
                )}
              </TabsContent>

              {/* Zusammenfassung Tab */}
              <TabsContent value="zusammenfassung" className="mt-0">
                {unterpunkt.textZusammenfassung ? (
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Key Takeaways
                    </h3>
                    <p className="text-muted-foreground">{unterpunkt.textZusammenfassung}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Keine Zusammenfassung verfügbar.</p>
                  </div>
                )}
              </TabsContent>

              {/* Material Tab */}
              <TabsContent value="material" className="mt-0">
                {hasZusatzmaterial ? (
                  <div className="space-y-2">
                    {unterpunkt.zusatzmaterialUrls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground truncate">
                          {url}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ExternalLink className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Kein Zusatzmaterial verfügbar.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Footer mit Abschluss-Button - Measured height */}
      <footer 
        ref={footerRef}
        className="sticky bottom-0 bg-card border-t border-border p-4 safe-area-bottom"
      >
        <div className="max-w-3xl mx-auto">
          <Button 
            className="w-full h-12 text-base"
            onClick={handleMarkComplete}
          >
            <Check className="w-5 h-5 mr-2" />
            Als abgeschlossen markieren
          </Button>
        </div>
      </footer>
    </div>
  );
}
