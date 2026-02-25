import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PvAufmassDraftData } from '../../../data/pv-aufmass-schema';

interface Props {
  pvForm: UseFormReturn<PvAufmassDraftData>;
  disabled?: boolean;
}

export function PvDcKabelSection({ pvForm, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const gleichesGebaeude = watch('module_gleiches_gebaeude');

  const boolField = (label: string, field: keyof PvAufmassDraftData) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-3">
        {[true, false].map((val) => (
          <button key={String(val)} type="button" disabled={disabled}
            onClick={() => setValue(field, val as any)}
            className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              watch(field) === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
            }`}
          >{val ? 'Ja' : 'Nein'}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {boolField('DC-Kabel über Fassade möglich?', 'dc_fassade_moeglich')}
      {boolField('DC-Kabel durch Dachhaut möglich?', 'dc_dachhaut_moeglich')}
      {boolField('DC-Kabelweg > 10m?', 'dc_ueber_10m')}
      {boolField('Module auf gleichem Gebäude wie WR?', 'module_gleiches_gebaeude')}

      {gleichesGebaeude === false && (
        <div className="space-y-2">
          <Label>Entfernung zwischen Gebäuden (m)</Label>
          <Input type="number" placeholder="z.B. 15"
            value={watch('gebaeude_entfernung') ?? ''}
            onChange={(e) => setValue('gebaeude_entfernung', e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled} />
        </div>
      )}
    </div>
  );
}
