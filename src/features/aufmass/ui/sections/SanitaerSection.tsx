import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AufmassDraftData } from '../../data/aufmass-schema';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  disabled?: boolean;
}

export function SanitaerSection({ form, disabled }: Props) {
  const { register, watch, setValue } = form;
  const hatRegendusche = watch('hat_regendusche');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="anzahl_duschen">Wie viele Duschen sind vorhanden? *</Label>
        <Input id="anzahl_duschen" type="number" min={0} {...register('anzahl_duschen', { valueAsNumber: true })} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <Label>Gibt es eine Regendusche? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('hat_regendusche', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                hatRegendusche === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anzahl_badewannen">Wie viele Badewannen sind vorhanden? *</Label>
        <Input id="anzahl_badewannen" type="number" min={0} {...register('anzahl_badewannen', { valueAsNumber: true })} disabled={disabled} />
      </div>
    </div>
  );
}
