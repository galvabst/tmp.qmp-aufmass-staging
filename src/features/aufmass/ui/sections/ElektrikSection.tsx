import { UseFormReturn } from 'react-hook-form';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { LabelMitHilfe } from '../components/LabelMitHilfe';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function ElektrikSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = form;
  const hatErdung = watch('hat_erdung');

  return (
    <div className="space-y-6">
      <PhotoUploadField kategorie="zaehlerschrank" existingBilder={filterBilderByKategorie(bilder, 'zaehlerschrank')}
        votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />

      <PhotoUploadField kategorie="sicherungen" existingBilder={filterBilderByKategorie(bilder, 'sicherungen')}
        votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />

      <PhotoUploadField kategorie="zaehler" existingBilder={filterBilderByKategorie(bilder, 'zaehler')}
        votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />

      <div className="space-y-2">
        <LabelMitHilfe hilfeKey="hat_erdung">Hat der Kunde eine Erdung? *</LabelMitHilfe>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('hat_erdung', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                hatErdung === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {hatErdung && (
        <PhotoUploadField kategorie="erdung" existingBilder={filterBilderByKategorie(bilder, 'erdung')}
          votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
      )}

      <PhotoUploadField kategorie="hausanschlusskasten" existingBilder={filterBilderByKategorie(bilder, 'hausanschlusskasten')}
        votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
    </div>
  );
}
