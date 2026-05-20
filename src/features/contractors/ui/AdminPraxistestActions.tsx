import { useState } from 'react';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminRejectPraxistest } from '../hooks/useAdminContractorActions';

interface Props {
  onboardingId: string;
  contractorName: string;
  praxistestEingereicht: boolean;
  praxistestFreigabe: boolean;
}

export function AdminPraxistestActions({ onboardingId, contractorName, praxistestEingereicht, praxistestFreigabe }: Props) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notiz, setNotiz] = useState('');
  const [approving, setApproving] = useState(false);
  const { mutate: reject, isPending: rejecting } = useAdminRejectPraxistest();

  const handleApprove = async () => {
    setApproving(true);
    try {
      const { error } = await (supabase.rpc as unknown as (
        fn: string, params: Record<string, unknown>
      ) => Promise<{ error: { message: string } | null }>)(
        'approve_contractor_praxistest', { p_onboarding_id: onboardingId },
      );
      if (error) throw new Error(error.message);
      toast.success(`Praxistest von ${contractorName} freigegeben`);
      qc.invalidateQueries({ queryKey: ['admin-contractors'] });
      qc.invalidateQueries({ queryKey: ['admin-qg-praxistests'] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = () => {
    reject(
      { onboardingId, notiz: notiz.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Praxistest zurückgewiesen — ${contractorName} muss neu einreichen`);
          setRejectOpen(false);
          setNotiz('');
        },
        onError: (err: unknown) => toast.error((err as Error).message),
      },
    );
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Praxistest</p>
        </div>
        {praxistestFreigabe ? (
          <Badge variant="default" className="text-[10px]">Freigegeben</Badge>
        ) : praxistestEingereicht ? (
          <Badge variant="secondary" className="text-[10px]">Eingereicht</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">Nichts eingereicht</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={approving || praxistestFreigabe}
          onClick={handleApprove}
          className="gap-1.5"
        >
          {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          Freigeben
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={rejecting || (!praxistestEingereicht && !praxistestFreigabe)}
          onClick={() => setRejectOpen(true)}
          className="gap-1.5"
        >
          {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
          Ablehnen
        </Button>
      </div>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Praxistest ablehnen?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block">
                <strong>{contractorName}</strong> muss Scan und Video neu hochladen.
              </span>
              <span className="block mt-2 text-xs text-destructive">
                Diese Aktion löscht die Verknüpfungen zu den aktuell eingereichten Dateien.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Notiz (optional)</label>
            <Textarea
              value={notiz}
              onChange={(e) => setNotiz(e.target.value)}
              placeholder="z. B. Scan unscharf, bitte Drohnenvideo wiederholen"
              rows={3}
              className="text-xs"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejecting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={rejecting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ablehnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
