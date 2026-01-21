import { Play, CheckCircle2, Clock, GraduationCap, Award, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AkademieModul } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AcademyStepProps {
  module: AkademieModul[];
  onModuleComplete: (moduleId: string) => void;
  onStartModule: (moduleId: string) => void;
  testBestanden: boolean;
  onStartTest: () => void;
}

export function AcademyStep({
  module,
  onModuleComplete,
  onStartModule,
  testBestanden,
  onStartTest,
}: AcademyStepProps) {
  const navigate = useNavigate();
  const completedCount = module.filter(m => m.abgeschlossen).length;
  const totalCount = module.length;
  const allModulesComplete = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleStartModule = (modul: AkademieModul) => {
    // Navigiere zur Mediaplayer-Seite
    navigate(`/akademie/modul/${modul.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="bg-card rounded-xl p-4 shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Akademie-Schulung</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} von {totalCount} Modulen abgeschlossen
            </p>
          </div>
          <Badge variant={allModulesComplete ? 'default' : 'secondary'}>
            {progressPercent}%
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Module Liste */}
      <div className="space-y-3">
        {module.map((modul, index) => {
          const isCompleted = modul.abgeschlossen;
          const isPrevCompleted = index === 0 || module[index - 1].abgeschlossen;
          const isLocked = !isPrevCompleted && !isCompleted;
          
          return (
            <div
              key={modul.id}
              className={cn(
                'bg-card rounded-xl p-4 shadow-card transition-all',
                isCompleted && 'border-2 border-status-accepted',
                isLocked && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                {/* Nummer/Status Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                  isCompleted ? 'bg-status-accepted text-white' :
                  isLocked ? 'bg-muted text-muted-foreground' :
                  'bg-primary text-primary-foreground'
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground">{modul.titel}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {modul.beschreibung}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {modul.dauerMinuten} Min.
                    </span>
                  </div>
                </div>

                {/* Action */}
                {!isLocked && (
                  <Button
                    size="sm"
                    variant={isCompleted ? 'outline' : 'default'}
                    onClick={() => handleStartModule(modul)}
                    disabled={isLocked}
                  >
                    {isCompleted ? (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Wiederholen
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Zur Schulung
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Abschlusstest */}
      <div className={cn(
        'bg-card rounded-xl p-4 shadow-card transition-all',
        testBestanden && 'border-2 border-status-accepted',
        !allModulesComplete && 'opacity-60'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            testBestanden ? 'bg-status-accepted text-white' :
            allModulesComplete ? 'bg-primary text-primary-foreground' :
            'bg-muted text-muted-foreground'
          )}>
            <Award className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-foreground">Abschlusstest</h4>
            <p className="text-sm text-muted-foreground">
              {testBestanden 
                ? 'Herzlichen Glückwunsch! Test bestanden.' 
                : 'Prüfe dein Wissen nach allen Modulen'}
            </p>
          </div>

          {allModulesComplete && !testBestanden && (
            <Button size="sm" onClick={onStartTest}>
              Test starten
            </Button>
          )}

          {testBestanden && (
            <Badge variant="default" className="bg-status-accepted">
              Bestanden ✓
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      {!allModulesComplete && (
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Schließe alle Module ab, um den Abschlusstest freizuschalten.
          </p>
        </div>
      )}
    </div>
  );
}
