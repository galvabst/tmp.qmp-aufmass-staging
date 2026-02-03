import { Play, CheckCircle2, Clock, GraduationCap, Award, Lock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AkademieHauptmodul, AkademieUnterpunkt } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AcademyStepProps {
  hauptmodule: AkademieHauptmodul[];
  onUnterpunktComplete: (hauptmodulId: string, unterpunktId: string) => void;
  testBestanden: boolean;
  onStartTest: () => void;
}

// Helper: Fortschritt eines Hauptmoduls berechnen
function getHauptmodulProgress(hauptmodul: AkademieHauptmodul): { completed: number; total: number } {
  const unterpunkte = hauptmodul.unterpunkte || [];
  const completed = unterpunkte.filter(u => u.abgeschlossen).length;
  return { completed, total: unterpunkte.length };
}

// Helper: Prüft ob Hauptmodul freigeschaltet ist
function isHauptmodulUnlocked(index: number, hauptmodule: AkademieHauptmodul[]): boolean {
  // TEMP: Alle Module freigeschaltet während Aufbauphase
  return true;
  
  // Original-Logik (später reaktivieren):
  // if (index === 0) return true;
  // const prev = hauptmodule[index - 1];
  // const prevUnterpunkte = prev?.unterpunkte || [];
  // return prevUnterpunkte.every(u => u.abgeschlossen);
}

// Helper: Prüft ob Hauptmodul komplett abgeschlossen ist
function isHauptmodulComplete(hauptmodul: AkademieHauptmodul): boolean {
  const unterpunkte = hauptmodul?.unterpunkte || [];
  return unterpunkte.length > 0 && unterpunkte.every(u => u.abgeschlossen);
}

// Helper: Gesamtfortschritt über alle Module
function getTotalAkademieProgress(hauptmodule: AkademieHauptmodul[]): { completed: number; total: number; percent: number } {
  const safeModules = hauptmodule || [];
  const total = safeModules.reduce((acc, m) => acc + (m.unterpunkte || []).length, 0);
  const completed = safeModules.reduce(
    (acc, m) => acc + (m.unterpunkte || []).filter(u => u.abgeschlossen).length, 0
  );
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

// Helper: Prüft ob ein Unterpunkt freigeschaltet ist
function isUnterpunktUnlocked(
  hauptmodulIndex: number, 
  unterpunktIndex: number, 
  hauptmodule: AkademieHauptmodul[]
): boolean {
  // TEMP: Alle Unterpunkte freigeschaltet während Aufbauphase
  return true;
  
  // Original-Logik (später reaktivieren):
  // if (!isHauptmodulUnlocked(hauptmodulIndex, hauptmodule)) return false;
  // if (unterpunktIndex === 0) return true;
  // const hauptmodul = hauptmodule[hauptmodulIndex];
  // const unterpunkte = hauptmodul?.unterpunkte || [];
  // return unterpunkte[unterpunktIndex - 1]?.abgeschlossen ?? false;
}

export function AcademyStep({
  hauptmodule,
  onUnterpunktComplete,
  testBestanden,
  onStartTest,
}: AcademyStepProps) {
  const navigate = useNavigate();
  const totalProgress = getTotalAkademieProgress(hauptmodule);
  const allModulesComplete = totalProgress.completed === totalProgress.total;

  const handleStartUnterpunkt = (unterpunkt: AkademieUnterpunkt) => {
    navigate(`/akademie/modul/${unterpunkt.id}`);
  };

  // Finde das erste nicht-abgeschlossene, freigeschaltete Hauptmodul für Default-Accordion
  const getDefaultOpenModul = (): string | undefined => {
    for (let i = 0; i < hauptmodule.length; i++) {
      const isUnlocked = isHauptmodulUnlocked(i, hauptmodule);
      const isComplete = isHauptmodulComplete(hauptmodule[i]);
      if (isUnlocked && !isComplete) {
        return hauptmodule[i].id;
      }
    }
    return hauptmodule[0]?.id;
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
              {totalProgress.completed} von {totalProgress.total} Unterpunkten abgeschlossen
            </p>
          </div>
          <Badge variant={allModulesComplete ? 'default' : 'secondary'}>
            {totalProgress.percent}%
          </Badge>
        </div>
        <Progress value={totalProgress.percent} className="h-2" />
      </div>

      {/* Hauptmodule als Accordion */}
      <Accordion 
        type="single" 
        collapsible 
        defaultValue={getDefaultOpenModul()}
        className="space-y-3"
      >
        {hauptmodule.map((hauptmodul, hauptmodulIndex) => {
          const isUnlocked = isHauptmodulUnlocked(hauptmodulIndex, hauptmodule);
          const isComplete = isHauptmodulComplete(hauptmodul);
          const progress = getHauptmodulProgress(hauptmodul);
          
          return (
            <AccordionItem 
              key={hauptmodul.id} 
              value={hauptmodul.id}
              className={cn(
                'bg-card rounded-xl shadow-card border-0 overflow-hidden',
                isComplete && 'ring-2 ring-status-accepted',
                !isUnlocked && 'opacity-60'
              )}
              disabled={!isUnlocked}
            >
              <AccordionTrigger 
                className={cn(
                  'px-4 py-3 hover:no-underline',
                  !isUnlocked && 'cursor-not-allowed'
                )}
                disabled={!isUnlocked}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Status Icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    isComplete ? 'bg-status-accepted text-white' :
                    !isUnlocked ? 'bg-muted text-muted-foreground' :
                    'bg-primary text-primary-foreground'
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : !isUnlocked ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      hauptmodulIndex + 1
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-medium text-foreground text-sm">
                      {hauptmodul.titel}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {hauptmodul.beschreibung}
                    </p>
                  </div>

                  {/* Progress Badge */}
                  <Badge 
                    variant={isComplete ? 'default' : 'secondary'} 
                    className={cn(
                      'shrink-0',
                      isComplete && 'bg-status-accepted'
                    )}
                  >
                    {progress.completed}/{progress.total}
                  </Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {hauptmodul.unterpunkte.map((unterpunkt, unterpunktIndex) => {
                    const isUPUnlocked = isUnterpunktUnlocked(hauptmodulIndex, unterpunktIndex, hauptmodule);
                    const isUPComplete = unterpunkt.abgeschlossen;
                    
                    return (
                      <div
                        key={unterpunkt.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          isUPComplete && 'bg-status-accepted/10 border-status-accepted/30',
                          !isUPUnlocked && 'opacity-50',
                          isUPUnlocked && !isUPComplete && 'hover:bg-muted/50 cursor-pointer'
                        )}
                        onClick={() => isUPUnlocked && handleStartUnterpunkt(unterpunkt)}
                      >
                        {/* Status */}
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                          isUPComplete ? 'bg-status-accepted text-white' :
                          !isUPUnlocked ? 'bg-muted text-muted-foreground' :
                          'bg-primary/20 text-primary'
                        )}>
                          {isUPComplete ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : !isUPUnlocked ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3 ml-0.5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {unterpunkt.titel}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{unterpunkt.dauerMinuten} Min.</span>
                          </div>
                        </div>

                        {/* Action */}
                        {isUPUnlocked && !isUPComplete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 text-primary"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Abschlusstest */}
      <div className={cn(
        'bg-card rounded-xl p-4 shadow-card transition-all',
        testBestanden && 'ring-2 ring-status-accepted',
        !allModulesComplete && 'opacity-60'
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            testBestanden ? 'bg-status-accepted text-white' :
            allModulesComplete ? 'bg-primary text-primary-foreground' :
            'bg-muted text-muted-foreground'
          )}>
            {!allModulesComplete ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Award className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-foreground">Abschlusstest</h4>
            <p className="text-sm text-muted-foreground">
              {testBestanden 
                ? 'Herzlichen Glückwunsch! Test bestanden.' 
                : allModulesComplete
                  ? 'Alle Module abgeschlossen – starte jetzt den Test!'
                  : 'Verfügbar nach Abschluss aller Module'}
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
            <strong>📝 Hinweis:</strong> Schließe alle Module der Reihe nach ab, 
            um den Abschlusstest freizuschalten. Jedes Modul wird nach Abschluss 
            des vorherigen freigeschaltet.
          </p>
        </div>
      )}
    </div>
  );
}
