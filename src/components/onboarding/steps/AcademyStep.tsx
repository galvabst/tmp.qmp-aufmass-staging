import { Play, CheckCircle2, Clock, GraduationCap, Lock, ChevronRight } from 'lucide-react';
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

/** Counts all leaf unterpunkte (children count, not groups) */
function countLeafUnterpunkte(unterpunkte: AkademieUnterpunkt[]): { completed: number; total: number } {
  let completed = 0;
  let total = 0;
  for (const up of unterpunkte) {
    if (up.isGroup && up.children?.length) {
      for (const child of up.children) {
        total++;
        if (child.abgeschlossen) completed++;
      }
    } else {
      total++;
      if (up.abgeschlossen) completed++;
    }
  }
  return { completed, total };
}

function isHauptmodulUnlocked(_index: number, _hauptmodule: AkademieHauptmodul[]): boolean {
  // TEMP: Alle Module freigeschaltet während Aufbauphase
  return true;
}

function isHauptmodulComplete(hauptmodul: AkademieHauptmodul): boolean {
  const { completed, total } = countLeafUnterpunkte(hauptmodul.unterpunkte);
  return total > 0 && completed === total;
}

function getTotalAkademieProgress(hauptmodule: AkademieHauptmodul[]): { completed: number; total: number; percent: number } {
  let completed = 0;
  let total = 0;
  for (const m of hauptmodule) {
    const counts = countLeafUnterpunkte(m.unterpunkte);
    completed += counts.completed;
    total += counts.total;
  }
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

function isUnterpunktUnlocked(): boolean {
  // TEMP: Alle Unterpunkte freigeschaltet während Aufbauphase
  return true;
}

/** Renders a single lesson row (used for top-level and children) */
function LektionRow({
  unterpunkt,
  indented = false,
  onStart,
}: {
  unterpunkt: AkademieUnterpunkt;
  indented?: boolean;
  onStart: (up: AkademieUnterpunkt) => void;
}) {
  const isUPUnlocked = isUnterpunktUnlocked();
  const isUPComplete = unterpunkt.abgeschlossen;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        indented && 'ml-6 border-dashed',
        isUPComplete && 'bg-status-accepted/10 border-status-accepted/30',
        !isUPUnlocked && 'opacity-50',
        isUPUnlocked && !isUPComplete && 'hover:bg-muted/50 cursor-pointer'
      )}
      onClick={() => isUPUnlocked && onStart(unterpunkt)}
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
        <p className={cn('text-sm font-medium text-foreground', indented && 'text-xs')}>
          <span className="text-muted-foreground mr-1.5">{unterpunkt.code?.replace(/-/g, '.')}</span>
          {unterpunkt.titel}
        </p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{unterpunkt.dauerMinuten} Min.</span>
        </div>
      </div>

      {/* Action */}
      {isUPUnlocked && !isUPComplete && (
        <Button size="sm" variant="ghost" className="shrink-0 text-primary">
          <Play className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

/** Renders a group parent with its children */
function GruppenLektion({
  parent,
  onStart,
}: {
  parent: AkademieUnterpunkt;
  onStart: (up: AkademieUnterpunkt) => void;
}) {
  const children = parent.children || [];
  const completedCount = children.filter(c => c.abgeschlossen).length;
  const allComplete = children.length > 0 && completedCount === children.length;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value={parent.id}
        className={cn(
          'border rounded-lg overflow-hidden',
          allComplete && 'bg-status-accepted/10 border-status-accepted/30',
        )}
      >
        <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              allComplete ? 'bg-status-accepted text-white' : 'bg-muted text-muted-foreground'
            )}>
              {allComplete ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground mr-1.5">{parent.code?.replace(/-/g, '.')}</span>
                {parent.titel}
              </p>
            </div>
            <Badge variant={allComplete ? 'default' : 'secondary'} className={cn('shrink-0', allComplete && 'bg-status-accepted')}>
              {completedCount}/{children.length}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-3 pt-1">
          <div className="space-y-1.5">
            {children.map(child => (
              <LektionRow key={child.id} unterpunkt={child} indented onStart={onStart} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
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

  const getDefaultOpenModul = (): string | undefined => {
    for (let i = 0; i < hauptmodule.length; i++) {
      const isUnlocked = isHauptmodulUnlocked(i, hauptmodule);
      const isComplete = isHauptmodulComplete(hauptmodule[i]);
      if (isUnlocked && !isComplete) return hauptmodule[i].id;
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
              {totalProgress.completed} von {totalProgress.total} Lektionen abgeschlossen
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
          const progress = countLeafUnterpunkte(hauptmodul.unterpunkte);
          
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
                  {/* Modul-Nummer aus DB-Code */}
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
                      hauptmodul.displayNummer
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <h4 className="font-medium text-foreground text-sm">
                      {hauptmodul.titel}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {hauptmodul.beschreibung}
                    </p>
                  </div>

                  <Badge 
                    variant={isComplete ? 'default' : 'secondary'} 
                    className={cn('shrink-0', isComplete && 'bg-status-accepted')}
                  >
                    {progress.completed}/{progress.total}
                  </Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2 pt-2">
                  {hauptmodul.unterpunkte.map((unterpunkt) => {
                    if (unterpunkt.isGroup && unterpunkt.children?.length) {
                      return (
                        <GruppenLektion
                          key={unterpunkt.id}
                          parent={unterpunkt}
                          onStart={handleStartUnterpunkt}
                        />
                      );
                    }
                    return (
                      <LektionRow
                        key={unterpunkt.id}
                        unterpunkt={unterpunkt}
                        onStart={handleStartUnterpunkt}
                      />
                    );
                  })}
                </div>

                {/* Abschlusstest */}
                {isComplete && !testBestanden && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-foreground mb-2">
                      🎉 Alle Lektionen dieses Moduls abgeschlossen!
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Globaler Abschlusstest */}
      {allModulesComplete && !testBestanden && (
        <div className="bg-card rounded-xl p-4 shadow-card border-2 border-primary">
          <h3 className="font-semibold text-foreground mb-2">📝 Abschlusstest</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Du hast alle Module abgeschlossen. Starte jetzt den Abschlusstest.
          </p>
          <Button onClick={onStartTest} className="w-full">
            Test starten
          </Button>
        </div>
      )}

      {testBestanden && (
        <div className="bg-status-accepted/10 rounded-xl p-4 border border-status-accepted/30 text-center">
          <CheckCircle2 className="w-8 h-8 text-status-accepted mx-auto mb-2" />
          <p className="font-semibold text-foreground">Abschlusstest bestanden! 🎉</p>
        </div>
      )}
    </div>
  );
}
