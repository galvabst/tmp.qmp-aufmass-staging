import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StripeReconcileButton() {
  const [loading, setLoading] = useState(false);

  const handleReconcile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reconcile-stripe-orders', {
        body: { trigger: 'admin_manual' },
      });

      if (error) {
        console.error('[reconcile] error:', error);
        toast.error(`Abgleich fehlgeschlagen: ${error.message}`);
        return;
      }

      const checked = data?.checked ?? 0;
      const paid = data?.updated_to_paid ?? 0;
      const failed = data?.updated_to_failed ?? 0;

      if (paid === 0 && failed === 0) {
        toast.success(`Stripe-Abgleich: ${checked} Bestellungen geprüft, alle aktuell.`);
      } else {
        toast.success(
          `Stripe-Abgleich: ${paid} auf bezahlt gesetzt${failed > 0 ? `, ${failed} auf fehlgeschlagen` : ''} (${checked} geprüft).`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Abgleich fehlgeschlagen: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleReconcile}
      disabled={loading}
      title="Stripe-Bestellungen abgleichen"
      className="text-muted-foreground hover:text-primary"
    >
      <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
    </Button>
  );
}
