import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, Award, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useModulQuiz, useSubmitQuiz, QuizFrage, calculateQuizScore } from '@/hooks/useModulQuiz';
import { cn } from '@/lib/utils';

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modulId: string;
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
  bestehensSchwelle = 80,
}: QuizModalProps) {
  const [state, setState] = useState<QuizState>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [antworten, setAntworten] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; bestanden: boolean; correct: number; total: number } | null>(null);

  const { data: fragen = [], isLoading } = useModulQuiz(modulId);
  const submitMutation = useSubmitQuiz();

  // Reset state when modal opens
  useMemo(() => {
    if (open) {
      setState('loading');
      setCurrentIndex(0);
      setAntworten({});
      setResult(null);
    }
  }, [open]);

  // Transition to questions when loaded
  useMemo(() => {
    if (!isLoading && fragen.length > 0) {
      setState('questions');
    }
  }, [isLoading, fragen.length]);

  const currentFrage = fragen[currentIndex];
  const progress = fragen.length > 0 ? ((currentIndex + 1) / fragen.length) * 100 : 0;
  const isLastQuestion = currentIndex === fragen.length - 1;
  const hasAnswered = currentFrage ? antworten[currentFrage.id] !== undefined : false;

  const handleSelectAnswer = (fragenId: string, antwortIndex: number) => {
    setAntworten(prev => ({ ...prev, [fragenId]: antwortIndex }));
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
        modulId,
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
              <p className="text-lg font-medium text-foreground mb-6">
                {currentFrage.frage}
              </p>

              <RadioGroup
                value={antworten[currentFrage.id]?.toString()}
                onValueChange={(value) => handleSelectAnswer(currentFrage.id, parseInt(value))}
              >
                <div className="space-y-3">
                  {currentFrage.antworten.map((antwort, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center space-x-3 p-3 rounded-lg border transition-colors',
                        antworten[currentFrage.id] === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                      <Label 
                        htmlFor={`answer-${index}`} 
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {antwort.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
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
                <p className="text-3xl font-bold text-foreground mb-1">
                  {result.score}%
                </p>
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
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nochmal versuchen
                </Button>
              )}
              <Button onClick={handleClose} className="flex-1">
                {result.bestanden ? 'Weiter' : 'Schließen'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
