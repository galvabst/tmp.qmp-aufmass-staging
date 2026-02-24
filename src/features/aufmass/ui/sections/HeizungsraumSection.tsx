import { UseFormReturn } from 'react-hook-form';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { Label } from '@/components/ui/label';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function HeizungsraumSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = form;
  const mehrBilder = watch('mehr_bilder_heizungsraum');

  return (
    <div className="space-y-4">
      <PhotoUploadField
        kategorie="heizungsraum"
        existingBilder={filterBilderByKategorie(bilder, 'heizungsraum')}
        votFormularId={votFormularId}
        leadName={leadName} leadId={leadId} auftragId={auftragId}
        disabled={disabled}
      />

      <div className="space-y-2">
        <Label>Mehr Bilder vom Heizungsraum? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('mehr_bilder_heizungsraum', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                mehrBilder === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {mehrBilder && (
        <PhotoUploadField
          kategorie="heizungsraum_extra"
          existingBilder={filterBilderByKategorie(bilder, 'heizungsraum_extra')}
          votFormularId={votFormularId}
          leadName={leadName} leadId={leadId} auftragId={auftragId}
          disabled={disabled}
        />
      )}
    </div>
  );
}
