import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { numberFieldProps } from '../../data/aufmass-field-bounds';
import { LabelMitHilfe, hilfeDescribedBy } from '../components/LabelMitHilfe';

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
        <LabelMitHilfe hilfeKey="anzahl_duschen" htmlFor="anzahl_duschen">Wie viele Duschen sind vorhanden? *</LabelMitHilfe>
        <Input id="anzahl_duschen" aria-describedby={hilfeDescribedBy('anzahl_duschen')} {...numberFieldProps('anzahl_duschen')} {...register('anzahl_duschen', { valueAsNumber: true })} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <LabelMitHilfe hilfeKey="hat_regendusche">Gibt es eine Regendusche? *</LabelMitHilfe>
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
        <LabelMitHilfe hilfeKey="anzahl_badewannen" htmlFor="anzahl_badewannen">Wie viele Badewannen sind vorhanden? *</LabelMitHilfe>
        <Input id="anzahl_badewannen" aria-describedby={hilfeDescribedBy('anzahl_badewannen')} {...numberFieldProps('anzahl_badewannen')} {...register('anzahl_badewannen', { valueAsNumber: true })} disabled={disabled} />
      </div>
    </div>
  );
}
