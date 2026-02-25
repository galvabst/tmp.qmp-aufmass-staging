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

export function PvAnlageSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = form;
  const hatPv = watch('hat_pv_anlage');

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4 border border-border space-y-2">
        <p className="text-sm">📋 Es wird ein Protokoll erstellt, das die Bedingungen für eine mögliche Solaranlage dokumentiert.</p>
        <p className="text-xs text-muted-foreground">💶 Komplett kostenlos – keine Verpflichtungen.</p>
      </div>

      <div className="space-y-2">
        <Label>Haben Sie bereits eine PV-Anlage? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('hat_pv_anlage', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                hatPv === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
        <p className="text-xs text-amber-800 dark:text-amber-200">⚠️ Bei falschen Angaben entfällt die Vergütung des ThermoChecks.</p>
      </div>

      {hatPv && (
        <PhotoUploadField
          kategorie="pv_anlage"
          existingBilder={filterBilderByKategorie(bilder, 'pv_anlage')}
          votFormularId={votFormularId}
          leadName={leadName} leadId={leadId} auftragId={auftragId}
          disabled={disabled}
        />
      )}

      {hatPv === false && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-primary font-medium">📋 Das PV-Aufmaß-Formular wird in den nächsten Schritten erfasst.</p>
          <p className="text-xs text-muted-foreground mt-1">8 weitere Schritte für Dach, Ziegel, Gerüst, Kabel, Unterkonstruktion, Blitzschutz und Abschluss.</p>
        </div>
      )}
    </div>
  );
}
