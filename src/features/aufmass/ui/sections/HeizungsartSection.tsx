import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { numberFieldProps } from '../../data/aufmass-field-bounds';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { LabelMitHilfe, hilfeDescribedBy } from '../components/LabelMitHilfe';
import { TypenschildScanButton } from '../components/TypenschildScanButton';

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
        <LabelMitHilfe hilfeKey="heizungsart">Art der alten Heizung *</LabelMitHilfe>
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
        {/* Das eine verlässliche KI-Foto-Feature: Typenschild scannen → Heizungsart vorschlagen. */}
        <TypenschildScanButton disabled={disabled} onHeizungsart={(kat) => setValue('heizungsart', kat)} />
      </div>

      {isSonstige && (
        <div className="space-y-2">
          <LabelMitHilfe hilfeKey="heizungsart_sonstige" htmlFor="heizungsart_sonstige">Welche Heizungsart? *</LabelMitHilfe>
          <Input id="heizungsart_sonstige" aria-describedby={hilfeDescribedBy('heizungsart_sonstige')} {...register('heizungsart_sonstige')} disabled={disabled} />
          {errors.heizungsart_sonstige && <p className="text-xs text-destructive">{errors.heizungsart_sonstige.message}</p>}
        </div>
      )}

      {isOel && (
        <div className="space-y-4 bg-card rounded-xl p-4 border border-border">
          <p className="font-medium text-sm">Öltank-Details</p>
          <div className="space-y-2">
            <LabelMitHilfe hilfeKey="oeltank_liter_gesamt" htmlFor="oeltank_liter_gesamt">Liter alle Öltanks zusammen *</LabelMitHilfe>
            <Input id="oeltank_liter_gesamt" aria-describedby={hilfeDescribedBy('oeltank_liter_gesamt')} {...numberFieldProps('oeltank_liter_gesamt')} {...register('oeltank_liter_gesamt', { valueAsNumber: true })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <LabelMitHilfe hilfeKey="oeltank_anzahl" htmlFor="oeltank_anzahl">Anzahl Öltanks *</LabelMitHilfe>
            <Input id="oeltank_anzahl" aria-describedby={hilfeDescribedBy('oeltank_anzahl')} {...numberFieldProps('oeltank_anzahl')} {...register('oeltank_anzahl', { valueAsNumber: true })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <LabelMitHilfe hilfeKey="oeltank_liter_aktuell" htmlFor="oeltank_liter_aktuell">Liter Öl aktuell in Tanks *</LabelMitHilfe>
            <Input id="oeltank_liter_aktuell" aria-describedby={hilfeDescribedBy('oeltank_liter_aktuell')} {...numberFieldProps('oeltank_liter_aktuell')} {...register('oeltank_liter_aktuell', { valueAsNumber: true })} disabled={disabled} />
          </div>
          <div className="space-y-2">
            <LabelMitHilfe hilfeKey="oeltank_transport_beschreibung" htmlFor="oeltank_transport_beschreibung">Wie kann man den Tank raustransportieren? *</LabelMitHilfe>
            <Textarea id="oeltank_transport_beschreibung" aria-describedby={hilfeDescribedBy('oeltank_transport_beschreibung')} {...register('oeltank_transport_beschreibung')} disabled={disabled} placeholder="Detailliert beschreiben..." />
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
