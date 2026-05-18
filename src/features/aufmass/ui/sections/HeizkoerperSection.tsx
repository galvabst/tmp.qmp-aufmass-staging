import { UseFormReturn } from 'react-hook-form';
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

export function HeizkoerperSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = form;
  const typ = watch('heizkoerper_typ');
  const showVerteiler = typ === 'fussbodenheizung' || typ === 'beides';
  const showHeizkoerperPhotos = typ === 'heizkoerper' || typ === 'beides';

  return (
    <div className="space-y-4">
      {showHeizkoerperPhotos && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">⚠️ Achtung: Alle Heizkörper fotografieren! Keiner darf fehlen!</p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Heizkörper-Typ *</Label>
        <div className="flex gap-2">
          {(['heizkoerper', 'fussbodenheizung', 'beides'] as const).map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('heizkoerper_typ', val)}
              className={`flex-1 py-3 px-2 rounded-lg border text-xs font-medium transition-colors ${
                typ === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >
              {val === 'heizkoerper' ? 'Heizkörper' : val === 'fussbodenheizung' ? 'Fußboden' : 'Beides'}
            </button>
          ))}
        </div>
      </div>

      {showVerteiler && (
        <PhotoUploadField
          kategorie="heizkreisverteiler"
          existingBilder={filterBilderByKategorie(bilder, 'heizkreisverteiler')}
          votFormularId={votFormularId}
          leadName={leadName} leadId={leadId} auftragId={auftragId}
          disabled={disabled}
        />
      )}

      {showHeizkoerperPhotos && (
        <PhotoUploadField
          kategorie="heizkoerper"
          existingBilder={filterBilderByKategorie(bilder, 'heizkoerper')}
          votFormularId={votFormularId}
          leadName={leadName} leadId={leadId} auftragId={auftragId}
          disabled={disabled}
        />
      )}

      {typ === 'fussbodenheizung' && (
        <p className="text-xs text-muted-foreground">
          Nur Fußbodenheizung – Heizkörper-Fotos entfallen. Bitte den Heizkreisverteiler fotografieren.
        </p>
      )}
    </div>
  );
}
