import { Play, CheckCircle2, GraduationCap, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AkademieHauptmodul, AkademieUnterpunkt } from '@/types/onboarding';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { PraxistestSection } from './PraxistestSection';

interface ContractorOption {
  profileId: string;
  name: string;
}

interface AcademyStepProps {
  hauptmodule: AkademieHauptmodul[];
  onUnterpunktComplete: (hauptmodulId: string, unterpunktId: string) => void;
  testBestanden: boolean;
  onStartTest: () => void;
  isPreview?: boolean;
  isTrainer?: boolean;
  // Praxistest
  praxistestScanUrl?: string;
  praxistestVideoUrl?: string;
  praxistestEingereicht?: boolean;
  praxistestFreigabe?: boolean;
  onPraxistestScanUrlChange?: (url: string) => void;
  onPraxistestVideoUpload?: (file: File) => Promise<void>;
  onPraxistestEinreichen?: () => Promise<void>;
  isPraxistestUploading?: boolean;
  // Admin preview contractor targeting
  previewContractors?: ContractorOption[];
  selectedContractorId?: string;
  onSelectContractor?: (id: string) => void;
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

function isHauptmodulUnlocked(index: number, hauptmodule: AkademieHauptmodul[]): boolean {
  if (index === 0) return true;
  return isHauptmodulComplete(hauptmodule[index - 1]);
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

// Unterpunkt-Sperre entfernt — Sperre greift auf Modul-Ebene via AccordionItem disabled

/** Renders a single clickable lesson inside an expanded accordion */
function LektionInnerRow({
  unterpunkt,
  onStart,
}: {
  unterpunkt: AkademieUnterpunkt;
  onStart: (up: AkademieUnterpunkt) => void;
}) {
  const isComplete = unterpunkt.abgeschlossen;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
        isComplete
          ? 'bg-status-accepted/10 border-status-accepted/30'
          : 'hover:bg-muted/50 border-border/50'
      )}
      onClick={() => onStart(unterpunkt)}
    >
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
        isComplete ? 'bg-status-accepted text-white' : 'bg-primary/20 text-primary'
      )}>
        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-3 h-3 ml-0.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          <span className="text-muted-foreground mr-1.5">{unterpunkt.code?.replace(/-/g, '.')}</span>
          {unterpunkt.titel}
        </p>
      </div>
    </div>
  );
}

/** Unified accordion for every lesson — single or group */
function LektionAccordion({
  unterpunkt,
  onStart,
}: {
  unterpunkt: AkademieUnterpunkt;
  onStart: (up: AkademieUnterpunkt) => void;
}) {
  const isGroup = unterpunkt.isGroup && unterpunkt.children?.length;
  const children = isGroup ? unterpunkt.children! : [unterpunkt];
  const completedCount = children.filter(c => c.abgeschlossen).length;
  const allComplete = children.length > 0 && completedCount === children.length;

  return (
    <Accordion type="single" collapsible>
      <AccordionItem
        value={unterpunkt.id}
        className={cn(
          'border rounded-lg overflow-hidden',
          allComplete && 'bg-status-accepted/10 border-status-accepted/30',
        )}
      >
        <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              allComplete ? 'bg-status-accepted text-white' : 'bg-primary/20 text-primary'
            )}>
              {allComplete ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground">
                <span className="text-muted-foreground mr-1.5">{unterpunkt.code?.replace(/-/g, '.')}</span>
                {unterpunkt.titel}
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
              <LektionInnerRow key={child.id} unterpunkt={child} onStart={onStart} />
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
  isPreview = false,
  isTrainer = false,
  praxistestScanUrl = '',
  praxistestVideoUrl = '',
  praxistestEingereicht = false,
  praxistestFreigabe = false,
  onPraxistestScanUrlChange,
  onPraxistestVideoUpload,
  onPraxistestEinreichen,
  isPraxistestUploading = false,
  previewContractors = [],
  selectedContractorId,
  onSelectContractor,
}: AcademyStepProps) {
  const navigate = useNavigate();
  const totalProgress = getTotalAkademieProgress(hauptmodule);
  const allModulesComplete = totalProgress.completed === totalProgress.total;
  const testGateOpen = testBestanden || isPreview;

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
      {/* Trainer Info Banner */}
      {isTrainer && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Trainer-Modus</p>
            <p className="text-sm text-muted-foreground">
              Als Trainer kannst du die Akademie überspringen oder optional durcharbeiten. Alle Module sind freigeschaltet.
            </p>
          </div>
        </div>
      )}

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
          const isUnlocked = isTrainer || isPreview || isHauptmodulUnlocked(hauptmodulIndex, hauptmodule);
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
                  {hauptmodul.unterpunkte.map((unterpunkt) => (
                    <LektionAccordion
                      key={unterpunkt.id}
                      unterpunkt={unterpunkt}
                      onStart={handleStartUnterpunkt}
                    />
                  ))}
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
      {allModulesComplete && !testBestanden && !isPreview && (
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

      {isPreview && !testBestanden && (
        <div className="bg-muted rounded-xl p-3 border border-border text-sm text-muted-foreground">
          Vorschau-Modus: Abschlusstest ist simuliert, damit du den Praxistest-Upload direkt testen kannst.
        </div>
      )}

      {testBestanden && (
        <div className="bg-status-accepted/10 rounded-xl p-4 border border-status-accepted/30 text-center">
          <CheckCircle2 className="w-8 h-8 text-status-accepted mx-auto mb-2" />
          <p className="font-semibold text-foreground">Abschlusstest bestanden! 🎉</p>
        </div>
      )}

      {/* Praxistest Section - nach dem theoretischen Test */}
      {!isTrainer && (
        <PraxistestSection
          testBestanden={testGateOpen}
          scanUrl={praxistestScanUrl}
          videoUrl={praxistestVideoUrl}
          eingereicht={praxistestEingereicht}
          freigabe={praxistestFreigabe}
          onScanUrlChange={onPraxistestScanUrlChange || (() => {})}
          onVideoUpload={onPraxistestVideoUpload || (async () => {})}
          onEinreichen={onPraxistestEinreichen || (async () => {})}
          isUploading={isPraxistestUploading}
        />
      )}
    </div>
  );
}
