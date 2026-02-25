import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PvAufmassDraftData } from '../../../data/pv-aufmass-schema';

interface Props {
  pvForm: UseFormReturn<PvAufmassDraftData>;
  disabled?: boolean;
}

export function PvUnterkonstruktionSection({ pvForm, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const verschattungen = watch('verschattungen_vorhanden');

  return (
    <div className="space-y-5">
      {/* Verschattungen */}
      <div className="space-y-2">
        <Label>Verschattungen vorhanden? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('verschattungen_vorhanden', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                verschattungen === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {verschattungen && (
        <div className="space-y-2">
          <Label>Beschreibung der Verschattungen</Label>
          <Textarea placeholder="z.B. Baum im Süden, Schornstein..."
            value={watch('verschattungen_beschreibung') || ''}
            onChange={(e) => setValue('verschattungen_beschreibung', e.target.value)}
            disabled={disabled} />
        </div>
      )}

      {/* Belüftungsrohre */}
      <div className="space-y-2">
        <Label>Belüftungsrohre auf dem Dach?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('belueftungsrohre', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                watch('belueftungsrohre') === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
