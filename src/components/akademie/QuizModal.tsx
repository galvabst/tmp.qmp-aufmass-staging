import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Award, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useModulQuiz, useSubmitQuiz, QuizFrage } from '@/hooks/useModulQuiz';
import { cn } from '@/lib/utils';

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modulId?: string; // undefined = Abschlussprüfung (alle Fragen)
  modulTitel: string;
  contractorId: string;
  onQuizComplete: (bestanden: boolean) => void;
  bestehensSchwelle?: number;
}

type QuizState = 'loading' | 'questions' | 'result';

export function QuizModal({
  open,
  onOpenChange,
  modulId,
  modulTitel,
  contractorId,
  onQuizComplete,
  bestehensSchwelle = 100,
}: QuizModalProps) {
  const [state, setState] = useState<QuizState>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [antworten, setAntworten] = useState<Record<string, number | number[]>>({});
  const [result, setResult] = useState<{ score: number; bestanden: boolean; correct: number; total: number } | null>(null);

  const { data: fragen = [], isLoading } = useModulQuiz(modulId);
  const submitMutation = useSubmitQuiz();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setAntworten({});
      setResult(null);
      if (!isLoading && fragen.length > 0) {
        setState('questions');
      } else {
        setState('loading');
      }
    }
  }, [open]);

  // Transition to questions when loaded
  useEffect(() => {
    if (!isLoading && fragen.length > 0) {
      setState('questions');
    }
  }, [isLoading, fragen.length]);

  const currentFrage = fragen[currentIndex];
  const progress = fragen.length > 0 ? ((currentIndex + 1) / fragen.length) * 100 : 0;
  const isLastQuestion = currentIndex === fragen.length - 1;

  const hasAnswered = (() => {
    if (!currentFrage) return false;
    const answer = antworten[currentFrage.id];
    if (currentFrage.isMultipleChoice) {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined;
  })();

  const handleSelectSingle = (fragenId: string, antwortIndex: number) => {
    setAntworten(prev => ({ ...prev, [fragenId]: antwortIndex }));
  };

  const handleToggleMultiple = (fragenId: string, antwortIndex: number) => {
    setAntworten(prev => {
      const current = (prev[fragenId] as number[]) || [];
      const next = current.includes(antwortIndex)
        ? current.filter(i => i !== antwortIndex)
        : [...current, antwortIndex];
      return { ...prev, [fragenId]: next };
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await submitMutation.mutateAsync({
        contractorId,
        modulId: modulId || 'abschlusspruefung',
        fragen,
        antworten,
        bestehensSchwelle,
      });
      setResult(result);
      setState('result');
    } catch (error) {
      console.error('Quiz submission error:', error);
    }
  };

  const handleRetry = () => {
    setState('questions');
    setCurrentIndex(0);
    setAntworten({});
    setResult(null);
  };

  const handleClose = () => {
    if (result) {
      onQuizComplete(result.bestanden);
    }
    onOpenChange(false);
  };

  // No questions available
  if (!isLoading && fragen.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quiz: {modulTitel}</DialogTitle>
            <DialogDescription>
              Für dieses Modul sind noch keine Quiz-Fragen hinterlegt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Das Modul wird als abgeschlossen markiert.</p>
            </div>
          </div>
          <Button onClick={() => { onQuizComplete(true); onOpenChange(false); }}>
            Modul abschließen
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {/* Loading State */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Quiz wird geladen...</p>
          </div>
        )}

        {/* Questions State */}
        {state === 'questions' && currentFrage && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base">
                  Frage {currentIndex + 1} von {fragen.length}
                </DialogTitle>
              </div>
              <Progress value={progress} className="h-2 mt-2" />
            </DialogHeader>

            <div className="py-4">
              <p className="text-lg font-medium text-foreground mb-2">
                {currentFrage.frage}
              </p>
              {currentFrage.isMultipleChoice && (
                <p className="text-sm text-muted-foreground mb-4">
                  Mehrere Antworten möglich
                </p>
              )}

              {currentFrage.isMultipleChoice ? (
                <MultipleChoiceAnswers
                  frage={currentFrage}
                  selected={(antworten[currentFrage.id] as number[]) || []}
                  onToggle={(index) => handleToggleMultiple(currentFrage.id, index)}
                />
              ) : (
                <SingleChoiceAnswers
                  frage={currentFrage}
                  selected={antworten[currentFrage.id] as number | undefined}
                  onSelect={(index) => handleSelectSingle(currentFrage.id, index)}
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                onClick={handleNext}
                disabled={!hasAnswered || submitMutation.isPending}
              >
                {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isLastQuestion ? 'Abschicken' : 'Weiter'}
              </Button>
            </div>
          </>
        )}

        {/* Result State */}
        {state === 'result' && result && (
          <QuizResult
            result={result}
            bestehensSchwelle={bestehensSchwelle}
            onRetry={handleRetry}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components ---

function SingleChoiceAnswers({
  frage,
  selected,
  onSelect,
}: {
  frage: QuizFrage;
  selected: number | undefined;
  onSelect: (index: number) => void;
}) {
  return (
    <RadioGroup
      value={selected?.toString()}
      onValueChange={(value) => onSelect(parseInt(value))}
    >
      <div className="space-y-3">
        {frage.antworten.map((antwort, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
              selected === index
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50'
            )}
          >
            <RadioGroupItem value={index.toString()} id={`answer-${frage.id}-${index}`} />
            <Label htmlFor={`answer-${frage.id}-${index}`} className="flex-1 cursor-pointer text-sm">
              {antwort.text}
            </Label>
          </div>
        ))}
      </div>
    </RadioGroup>
  );
}

function MultipleChoiceAnswers({
  frage,
  selected,
  onToggle,
}: {
  frage: QuizFrage;
  selected: number[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      {frage.antworten.map((antwort, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer',
            selected.includes(index)
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50'
          )}
          onClick={() => onToggle(index)}
        >
          <Checkbox
            checked={selected.includes(index)}
            onCheckedChange={() => onToggle(index)}
            id={`answer-${frage.id}-${index}`}
          />
          <Label htmlFor={`answer-${frage.id}-${index}`} className="flex-1 cursor-pointer text-sm">
            {antwort.text}
          </Label>
        </div>
      ))}
    </div>
  );
}

function QuizResult({
  result,
  bestehensSchwelle,
  onRetry,
  onClose,
}: {
  result: { score: number; bestanden: boolean; correct: number; total: number };
  bestehensSchwelle: number;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-center">
          {result.bestanden ? 'Herzlichen Glückwunsch!' : 'Leider nicht bestanden'}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col items-center py-6">
        <div className={cn(
          'w-20 h-20 rounded-full flex items-center justify-center mb-4',
          result.bestanden ? 'bg-status-accepted/20' : 'bg-destructive/20'
        )}>
          {result.bestanden ? (
            <CheckCircle2 className="w-10 h-10 text-status-accepted" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </div>

        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-foreground mb-1">{result.score}%</p>
          <p className="text-muted-foreground">
            {result.correct} von {result.total} Fragen richtig
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Benötigt: {bestehensSchwelle}%
          </p>
        </div>

        {result.bestanden ? (
          <div className="text-center text-muted-foreground">
            <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p>Das nächste Modul wurde freigeschaltet!</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Du kannst das Quiz jederzeit wiederholen.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!result.bestanden && (
          <Button variant="outline" onClick={onRetry} className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Nochmal versuchen
          </Button>
        )}
        <Button onClick={onClose} className="flex-1">
          {result.bestanden ? 'Weiter' : 'Schließen'}
        </Button>
      </div>
    </>
  );
}
