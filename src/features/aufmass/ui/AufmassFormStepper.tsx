import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ArrowLeft, ArrowRight, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AufmassDraftData } from '../data/aufmass-schema';
import { VotBild } from '../hooks/useVotBilder';

interface StepConfig {
  title: string;
  icon?: string;
}

const STEPS: StepConfig[] = [
  { title: 'Techniker-Daten', icon: '👤' },
  { title: 'Kundendaten', icon: '🏠' },
  { title: 'Treppenabgang', icon: '🪜' },
  { title: 'Eingang Heizungsraum', icon: '🚪' },
  { title: 'Heizungsraum', icon: '🔥' },
  { title: 'Heizungsart', icon: '⚡' },
  { title: 'Heizungsanlage', icon: '🔧' },
  { title: 'Heizkörper', icon: '♨️' },
  { title: 'Elektrik & Zähler', icon: '⚡' },
  { title: 'Aufstellort', icon: '📍' },
  { title: 'Sanitär', icon: '🚿' },
  { title: 'Checkliste', icon: '✅' },
  { title: 'Unbegehbare Räume', icon: '🚫' },
  { title: 'PV-Anlage', icon: '☀️' },
  { title: 'Abschluss', icon: '✍️' },
];

interface AufmassFormStepperProps {
  children: React.ReactNode[];
  onSaveDraft: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
  isReadOnly: boolean;
}

export function AufmassFormStepper({
  children,
  onSaveDraft,
  onSubmit,
  isSaving,
  isSubmitting,
  isReadOnly,
}: AufmassFormStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canGoBack = currentStep > 0;
  const canGoForward = currentStep < totalSteps - 1;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header with progress */}
      <header className="bg-primary text-primary-foreground safe-area-top sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">{STEPS[currentStep].icon}</span>
            <div className="flex-1">
              <p className="text-xs text-primary-foreground/70">
                Schritt {currentStep + 1} von {totalSteps}
              </p>
              <h1 className="text-lg font-bold">{STEPS[currentStep].title}</h1>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 bg-primary-foreground/20" />
        </div>
      </header>

      {/* Current section content */}
      <div className="p-4">
        {children[currentStep]}
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom z-10">
        <div className="p-4 flex items-center gap-2">
          {/* Back */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={!canGoBack}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Save Draft (nicht bei Read-Only) */}
          {!isReadOnly && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onSaveDraft}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Speichern
            </Button>
          )}

          {/* Forward or Submit */}
          {isLastStep && !isReadOnly ? (
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Einreichen
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canGoForward}
              className="flex-1"
            >
              Weiter
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
