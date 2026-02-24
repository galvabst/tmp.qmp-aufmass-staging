import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { VotBildKategorie } from '../../data/bild-kategorien';

/** Generic section that only contains a photo upload for a single category */
interface PhotoOnlySectionProps {
  kategorie: VotBildKategorie;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
  extraContent?: React.ReactNode;
}

export function PhotoOnlySection({ kategorie, bilder, votFormularId, leadName, leadId, auftragId, disabled, extraContent }: PhotoOnlySectionProps) {
  return (
    <div className="space-y-4">
      {extraContent}
      <PhotoUploadField
        kategorie={kategorie}
        existingBilder={filterBilderByKategorie(bilder, kategorie)}
        votFormularId={votFormularId}
        leadName={leadName}
        leadId={leadId}
        auftragId={auftragId}
        disabled={disabled}
      />
    </div>
  );
}
