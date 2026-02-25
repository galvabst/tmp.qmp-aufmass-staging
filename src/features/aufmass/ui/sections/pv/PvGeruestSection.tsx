import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PvAufmassDraftData } from '../../../data/pv-aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../../hooks/useVotBilder';
import { PhotoUploadField } from '../../components/PhotoUploadField';

interface Props {
  pvForm: UseFormReturn<PvAufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function PvGeruestSection({ pvForm, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const hindernisse = watch('hindernisse_vorhanden');
  const fassade = watch('fassade_gedaemmt');
  const oeffentlich = watch('oeffentliche_flaeche');
  const photoProps = { votFormularId, leadName, leadId, auftragId, disabled };

  return (
    <div className="space-y-5">
      {/* Hindernisse */}
      <div className="space-y-2">
        <Label>Hindernisse für Gerüstaufbau? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('hindernisse_vorhanden', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                hindernisse === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
      {hindernisse && (
        <PhotoUploadField kategorie="pv_hindernisse" existingBilder={filterBilderByKategorie(bilder, 'pv_hindernisse')} {...photoProps} />
      )}

      {/* Fassade gedämmt */}
      <div className="space-y-2">
        <Label>Fassade gedämmt?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('fassade_gedaemmt', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                fassade === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
      {fassade && (
        <div className="space-y-2">
          <Label>Dämmstärke Fassade</Label>
          <Input placeholder="z.B. 14 cm"
            value={watch('fassade_daemmung_dicke') || ''}
            onChange={(e) => setValue('fassade_daemmung_dicke', e.target.value)}
            disabled={disabled} />
        </div>
      )}

      {/* Öffentliche Fläche */}
      <div className="space-y-2">
        <Label>Gerüst auf öffentlicher Fläche nötig?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('oeffentliche_flaeche', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                oeffentlich === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
      {oeffentlich && (
        <PhotoUploadField kategorie="pv_geruest_oeffentlich" existingBilder={filterBilderByKategorie(bilder, 'pv_geruest_oeffentlich')} {...photoProps} />
      )}
    </div>
  );
}
