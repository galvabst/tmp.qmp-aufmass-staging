import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function StripeReconcileButton() {
  const [loading, setLoading] = useState(false);
  const [kittens, setKittens] = useState<{ id: number; top: number; delay: number; duration: number; size: number; dir: 1 | -1 }[]>([]);

  const launchKittens = () => {
    const now = Date.now();
    const items = Array.from({ length: 14 }, (_, i) => ({
      id: now + i,
      top: Math.random() * 80 + 5,
      delay: Math.random() * 0.4,
      duration: 1.2 + Math.random() * 0.9,
      size: 28 + Math.random() * 28,
      dir: (Math.random() > 0.5 ? 1 : -1) as 1 | -1,
    }));
    setKittens(items);
    window.setTimeout(() => setKittens([]), 2600);
  };


  const runReconcile = async (mode: 'recent' | 'backfill', days = 90) => {
    launchKittens();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reconcile-stripe-orders', {
        body: mode === 'backfill'
          ? { mode: 'backfill', days, trigger: 'admin_manual' }
          : { trigger: 'admin_manual' },
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
    <>
      {kittens.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
          <style>{`
            @keyframes kittyRunR { from { transform: translateX(-15vw) rotate(-4deg); } to { transform: translateX(115vw) rotate(4deg); } }
            @keyframes kittyRunL { from { transform: translateX(115vw) scaleX(-1) rotate(-4deg); } to { transform: translateX(-15vw) scaleX(-1) rotate(4deg); } }
          `}</style>
          {kittens.map((k) => (
            <div
              key={k.id}
              style={{
                position: 'absolute',
                top: `${k.top}%`,
                left: 0,
                fontSize: `${k.size}px`,
                filter: 'hue-rotate(310deg) saturate(1.6) drop-shadow(0 2px 6px rgba(244,114,182,0.6))',
                color: '#f9a8d4',
                animation: `${k.dir === 1 ? 'kittyRunR' : 'kittyRunL'} ${k.duration}s linear ${k.delay}s forwards`,
              }}
            >
              🐱
            </div>
          ))}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={loading}
            title="Stripe-Bestellungen abgleichen"
            className="text-muted-foreground hover:text-primary"
            onClick={launchKittens}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuItem onClick={() => runReconcile('recent')}>
            Schnell-Abgleich (letzte 7 Tage)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runReconcile('backfill', 90)}>
            Tiefer Abgleich (letzte 90 Tage)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => runReconcile('backfill', 365)}>
            Voll-Backfill (letzte 365 Tage)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
