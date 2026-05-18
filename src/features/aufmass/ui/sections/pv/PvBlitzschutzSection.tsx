import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
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

export function PvBlitzschutzSection({ pvForm, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const blitzschutz = watch('blitzschutz_vorhanden');
  const photoProps = { votFormularId, leadName, leadId, auftragId, disabled };

  return (
    <div className="space-y-5">
      {/* Blitzschutz vorhanden */}
      <div className="space-y-2">
        <Label>Blitzschutzanlage vorhanden? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('blitzschutz_vorhanden', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                blitzschutz === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {/* Hauszuführung (optional) */}
      <div className="space-y-2">
        <Label>Hauszuführung <span className="text-xs text-muted-foreground font-normal">(falls bekannt)</span></Label>
        <div className="flex gap-3">
          {(['keller', 'freileitung'] as const).map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('hauszufuehrung', watch('hauszufuehrung') === val ? undefined : val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                watch('hauszufuehrung') === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val === 'keller' ? 'Erdkabel / Keller' : 'Freileitung'}</button>
          ))}
        </div>
      </div>

      {blitzschutz && (
        <>
          <div className="space-y-2">
            <Label>Blitzschutz geprüft?</Label>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button key={String(val)} type="button" disabled={disabled}
                  onClick={() => setValue('blitzschutz_geprueft', val)}
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    watch('blitzschutz_geprueft') === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                  }`}
                >{val ? 'Ja' : 'Nein'}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Blitzschutz abbaubar?</Label>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button key={String(val)} type="button" disabled={disabled}
                  onClick={() => setValue('blitzschutz_abbaubar', val)}
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    watch('blitzschutz_abbaubar') === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                  }`}
                >{val ? 'Ja' : 'Nein'}</button>
              ))}
            </div>
          </div>

          <PhotoUploadField kategorie="pv_blitzschutz" existingBilder={filterBilderByKategorie(bilder, 'pv_blitzschutz')} {...photoProps} />
        </>
      )}
    </div>
  );
}
