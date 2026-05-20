import { useState } from 'react';
import { Loader2, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAdminSetOnboardingStep } from '../hooks/useAdminContractorActions';
import { STEP_LABELS } from '../hooks/useAdminContractorList';

const TARGETS: { key: string; label: string }[] = [
  { key: 'profil', label: STEP_LABELS.profil },
  { key: 'dokumente', label: STEP_LABELS.dokumente },
  { key: 'bestellungen', label: STEP_LABELS.bestellungen },
  { key: 'equipment', label: STEP_LABELS.equipment },
  { key: 'akademie', label: STEP_LABELS.akademie },
  { key: 'coaching', label: STEP_LABELS.coaching },
  { key: 'nachweise', label: STEP_LABELS.nachweise },
  { key: 'einsatzbereit', label: 'Einsatzbereit (alles abgeschlossen)' },
];

interface Props {
  profileId: string | null;
  currentStep: string | null;
  contractorName: string;
}

export function AdminStepOverride({ profileId, currentStep, contractorName }: Props) {
  const [target, setTarget] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate, isPending } = useAdminSetOnboardingStep();

  if (!profileId) return null;

  const handleConfirm = () => {
    mutate(
      { profileId, targetStep: target },
      {
        onSuccess: () => {
          toast.success(`Step gesetzt: ${TARGETS.find(t => t.key === target)?.label}`);
          setConfirmOpen(false);
          setTarget('');
        },
        onError: (err: unknown) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <MoveRight className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Onboarding-Step manuell setzen</p>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Aktueller Step: <strong>{currentStep ? (STEP_LABELS[currentStep] ?? currentStep) : '–'}</strong>.
        Vorherige Steps werden automatisch als abgeschlossen markiert.
      </p>

      <Select value={target} onValueChange={setTarget}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Ziel-Step wählen…" />
        </SelectTrigger>
        <SelectContent>
          {TARGETS.map(t => (
            <SelectItem key={t.key} value={t.key} disabled={t.key === currentStep}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button size="sm" className="w-full" disabled={!target || isPending} onClick={() => setConfirmOpen(true)}>
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Step setzen
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Step für {contractorName} ändern?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                Neuer Step: <strong>{TARGETS.find(t => t.key === target)?.label}</strong>.
              </span>
              <span className="block mt-2 text-xs text-amber-600 dark:text-amber-400">
                Alle Steps davor werden als „abgeschlossen" markiert. Bei <strong>Einsatzbereit</strong> wird der Status auf <strong>ready</strong> gesetzt.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>Setzen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
