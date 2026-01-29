import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Play, Clock, BookOpen, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAkademieUnterpunkt } from '@/hooks/useAkademieContent';
import ReactMarkdown from 'react-markdown';

export default function AkademieModul() {
  const { modulId } = useParams<{ modulId: string }>();
  const navigate = useNavigate();
  
  const { data: unterpunkt, isLoading, error } = useAkademieUnterpunkt(modulId);
  
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {unterpunkt.hauptmodulTitel}
            </p>
            <h1 className="font-semibold text-foreground truncate">
              {unterpunkt.titel}
            </h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{unterpunkt.dauerMinuten} Minuten</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-3xl mx-auto">
          {/* Video Container - 16:9 Aspect Ratio */}
          <div className="relative w-full aspect-video bg-black">
            {unterpunkt.videoUrl ? (
              // Real video player placeholder - in production use actual video embed
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 cursor-pointer hover:bg-white/30 transition-colors">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
                <p className="text-white/80 text-sm">Video abspielen</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                <Play className="w-12 h-12 mb-2" />
                <p className="text-sm">Kein Video verfügbar</p>
              </div>
            )}
          </div>

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

            {/* Fortschrittshinweis */}
            <div className="bg-muted/50 rounded-xl p-4 mt-4">
              <p className="text-sm text-muted-foreground">
                <strong>📝 Hinweis:</strong> Schau dir das Video vollständig an und 
                lies den Lerninhalt, um das Modul als abgeschlossen zu markieren.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer mit Abschluss-Button */}
      <footer className="sticky bottom-0 bg-card border-t border-border p-4 safe-area-bottom">
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
