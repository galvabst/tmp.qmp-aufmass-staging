import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function HeizungsartSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;
  const heizungsart = watch('heizungsart');
  const isOel = heizungsart === 'oel';
  const isSonstige = heizungsart === 'sonstige';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Art der alten Heizung *</Label>
        <div className="flex gap-2">
          {(['gas', 'oel', 'sonstige'] as const).map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('heizungsart', val)}
              className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-colors ${
                heizungsart === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >
              {val === 'gas' ? 'Gas' : val === 'oel' ? 'Öl' : 'Sonstige'}
            </button>
          ))}
        </div>
      </div>

      {isSonstige && (
        <div className="space-y-2">
          <Label htmlFor="heizungsart_sonstige">Welche Heizungsart? *</Label>
          <Input id="heizungsart_sonstige" {...register('heizungsart_sonstige')} disabled={disabled} />
          {errors.heizungsart_sonstige && <p className="text-xs text-destructive">{errors.heizungsart_sonstige.message}</p>}
        </div>
      )}

      {isOel && (
        <div className="space-y-4 bg-card rounded-xl p-4 border border-border">
          <p className="font-medium text-sm">Öltank-Details</p>
          <div className="space-y-2">
            <Label>Liter alle Öltanks zusammen *</Label>
            <Input type="number" {...register('oeltank_liter_gesamt', { valueAsNumber: true })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label>Anzahl Öltanks *</Label>
            <Input type="number" {...register('oeltank_anzahl', { valueAsNumber: true })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label>Liter Öl aktuell in Tanks *</Label>
            <Input type="number" {...register('oeltank_liter_aktuell', { valueAsNumber: true })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <Label>Wie kann man den Tank raustransportieren? *</Label>
            <Textarea {...register('oeltank_transport_beschreibung')} disabled={disabled} placeholder="Detailliert beschreiben..." />
          </div>
          <PhotoUploadField
            kategorie="oeltank"
            existingBilder={filterBilderByKategorie(bilder, 'oeltank')}
            votFormularId={votFormularId}
            leadName={leadName} leadId={leadId} auftragId={auftragId}
            disabled={disabled}
          />
        </div>
      )}

      <PhotoUploadField
        kategorie="heizanlage"
        existingBilder={filterBilderByKategorie(bilder, 'heizanlage')}
        votFormularId={votFormularId}
        leadName={leadName} leadId={leadId} auftragId={auftragId}
        disabled={disabled}
      />
    </div>
  );
}
