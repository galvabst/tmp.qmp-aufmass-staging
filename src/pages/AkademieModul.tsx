import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MOCK_AKADEMIE_MODULE } from '@/lib/onboarding-config';

export default function AkademieModul() {
  const { modulId } = useParams<{ modulId: string }>();
  const navigate = useNavigate();
  
  const modul = MOCK_AKADEMIE_MODULE.find(m => m.id === modulId);
  
  if (!modul) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Modul nicht gefunden</h1>
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
    // In echter App: Update im State/DB
    // Für jetzt: Toast und zurück navigieren
    navigate('/', { state: { completedModuleId: modulId } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              Modul {modul.reihenfolge}: {modul.titel}
            </h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{modul.dauerMinuten} Minuten</span>
            </div>
          </div>
        </div>
      </header>

      {/* Video Player */}
      <main className="flex-1 flex flex-col">
        <div className="w-full max-w-3xl mx-auto">
          {/* Video Container - 16:9 Aspect Ratio */}
          <div className="relative w-full aspect-video bg-black">
            {/* Placeholder für Video */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 cursor-pointer hover:bg-white/30 transition-colors">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
              <p className="text-white/80 text-sm">Video wird geladen...</p>
              <p className="text-white/50 text-xs mt-2">
                {modul.videoUrl || 'Kein Video hinterlegt'}
              </p>
            </div>
            
            {/* In echter App: Video Player einbetten */}
            {/* <video 
              src={modul.videoUrl}
              controls
              className="w-full h-full"
            /> */}
          </div>

          {/* Modul Info */}
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {modul.titel}
              </h2>
              <p className="text-muted-foreground mt-2">
                {modul.beschreibung}
              </p>
            </div>

            {/* Fortschrittshinweis */}
            <div className="bg-muted/50 rounded-xl p-4">
              <p className="text-sm text-muted-foreground">
                <strong>📝 Hinweis:</strong> Schau dir das Video vollständig an, 
                um das Modul als abgeschlossen zu markieren. Dein Fortschritt wird 
                automatisch gespeichert.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer mit Abschluss-Button */}
      <footer className="sticky bottom-0 bg-card border-t border-border p-4">
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
