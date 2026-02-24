import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export function UnbegehbareRaeumeSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue, register } = form;
  const anzahl = watch('anzahl_unbegehbare_raeume') ?? 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Wie viele Räume konntest du nicht scannen? *</Label>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 4, 5].map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('anzahl_unbegehbare_raeume', val)}
              className={`w-12 h-12 rounded-lg border text-sm font-bold transition-colors ${
                anzahl === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val}</button>
          ))}
        </div>
      </div>

      {/* Note: The actual room data (name, qm, photos) would be saved to thermocheck_vot_unbegehbare_raeume.
           For now, we render the photo uploads with category 'unbegehbarer_raum' and index per room. */}
      {Array.from({ length: anzahl }, (_, i) => i + 1).map((roomNr) => (
        <div key={roomNr} className="bg-card rounded-xl p-4 border border-border space-y-3">
          <p className="font-medium text-sm">Unbegehbarer Raum {roomNr}</p>
          <p className="text-xs text-muted-foreground">Bitte Raum benennen und Foto + Quadratmeter angeben</p>
          <PhotoUploadField
            kategorie="unbegehbarer_raum"
            existingBilder={filterBilderByKategorie(bilder, 'unbegehbarer_raum').filter((_, idx) => {
              // Simple grouping: each room gets its own set
              return true; // all unbegehbar photos shown together for now
            })}
            votFormularId={votFormularId}
            leadName={leadName} leadId={leadId} auftragId={auftragId}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}
