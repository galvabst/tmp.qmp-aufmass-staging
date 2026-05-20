import { useState } from 'react';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { PraxistestFeedbackDialog } from '@/features/praxistest-feedback/ui/PraxistestFeedbackDialog';

interface Props {
  onboardingId: string;
  contractorName: string;
  praxistestEingereicht: boolean;
  praxistestFreigabe: boolean;
  scanFreigegeben?: boolean;
  videoFreigegeben?: boolean;
}

export function AdminPraxistestActions({
  onboardingId, contractorName,
  praxistestEingereicht, praxistestFreigabe,
  scanFreigegeben = false, videoFreigegeben = false,
}: Props) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approving, setApproving] = useState(false);

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
      qc.invalidateQueries({ queryKey: ['contractor-onboarding-state'] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApproving(false);
    }
  };

  // Component is considered "eingereicht" if the URL was provided in this round
  // (i.e. not yet freigegeben but praxistestEingereicht=true means both were submitted together).
  // After component-wise rejection, only the rejected component is cleared.
  const scanReichbar = praxistestEingereicht || (praxistestFreigabe && !scanFreigegeben) ? false : true; // placeholder
  // Simplification: enable both checkboxes when something is submitted; backend validates kommentar.
  const eingereicht = praxistestEingereicht || praxistestFreigabe;

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
          disabled={!eingereicht}
          onClick={() => setRejectOpen(true)}
          className="gap-1.5"
        >
          <ShieldX className="w-4 h-4" />
          Feedback geben
        </Button>
      </div>

      <PraxistestFeedbackDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onboardingId={onboardingId}
        contractorName={contractorName}
        scanEingereicht={eingereicht && !scanFreigegeben}
        videoEingereicht={eingereicht && !videoFreigegeben}
      />
    </div>
  );
}
