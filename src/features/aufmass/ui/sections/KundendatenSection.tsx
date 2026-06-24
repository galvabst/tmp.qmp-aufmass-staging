import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { AufmassDatePicker } from '../components/AufmassDatePicker';
import { Input } from '@/components/ui/input';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  kundenName: string;
  disabled?: boolean;
}

export function KundendatenSection({ form, kundenName, disabled }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name des Kunden</Label>
        <Input value={kundenName} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Aus Lead-Daten (nicht änderbar)</p>
      </div>

      <div className="space-y-2">
        <Label>Inbetriebnahme Datum der bestehenden Heizung *</Label>
        <AufmassDatePicker
          value={watch('heizung_inbetriebnahme_datum') || ''}
          onChange={(v) => setValue('heizung_inbetriebnahme_datum', v)}
          disabled={disabled}
          toDate={new Date()}
          placeholder="Datum wählen"
        />
        {errors.heizung_inbetriebnahme_datum && <p className="text-xs text-destructive">{errors.heizung_inbetriebnahme_datum.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Ist die bestehende Heizung funktionstüchtig? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              disabled={disabled}
              onClick={() => setValue('heizung_funktionstuechtig', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                watch('heizung_funktionstuechtig') === val
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              {val ? 'Ja' : 'Nein'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Datum des Bauantrags des Gebäudes *</Label>
        <AufmassDatePicker
          value={watch('bauantrag_datum') || ''}
          onChange={(v) => setValue('bauantrag_datum', v)}
          disabled={disabled}
          toDate={new Date()}
          placeholder="Datum wählen"
        />
        {errors.bauantrag_datum && <p className="text-xs text-destructive">{errors.bauantrag_datum.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Wird nach dem Austausch noch mit fossilen Brennstoffen geheizt? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              type="button"
              disabled={disabled}
              onClick={() => setValue('fossile_brennstoffe_nach_austausch', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                watch('fossile_brennstoffe_nach_austausch') === val
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground'
              }`}
            >
              {val ? 'Ja' : 'Nein'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
