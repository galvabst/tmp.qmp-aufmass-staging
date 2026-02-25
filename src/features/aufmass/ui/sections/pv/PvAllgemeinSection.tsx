import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PvAufmassDraftData } from '../../../data/pv-aufmass-schema';

interface Props {
  pvForm: UseFormReturn<PvAufmassDraftData>;
  disabled?: boolean;
}

export function PvAllgemeinSection({ pvForm, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const solarthermie = watch('solarthermie_vorhanden');
  const denkmalschutz = watch('denkmalschutz');
  const lager = watch('lagermoeglichkeit');

  return (
    <div className="space-y-5">
      {/* Solarthermie */}
      <div className="space-y-2">
        <Label>Solarthermie vorhanden? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('solarthermie_vorhanden', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                solarthermie === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {/* Denkmalschutz */}
      <div className="space-y-2">
        <Label>Denkmalschutz *</Label>
        <div className="flex gap-2">
          {(['denkmalschutz', 'ensembleschutz', 'nein'] as const).map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('denkmalschutz', val)}
              className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-colors ${
                denkmalschutz === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >
              {val === 'denkmalschutz' ? 'Denkmalschutz' : val === 'ensembleschutz' ? 'Ensembleschutz' : 'Nein'}
            </button>
          ))}
        </div>
      </div>

      {/* Lagermöglichkeit */}
      <div className="space-y-2">
        <Label>Lagermöglichkeit vorhanden? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('lagermoeglichkeit', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                lager === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {lager && (
        <div className="space-y-2">
          <Label>Beschreibung Lagermöglichkeit</Label>
          <Input
            placeholder="z.B. Garage, Carport..."
            value={watch('lagermoeglichkeit_beschreibung') || ''}
            onChange={(e) => setValue('lagermoeglichkeit_beschreibung', e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
