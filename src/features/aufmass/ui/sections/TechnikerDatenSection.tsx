import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { AufmassDatePicker } from '../components/AufmassDatePicker';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function TechnikerDatenSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { register, watch, setValue, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">⚠️ Achtung</p>
        <p className="text-sm text-amber-700 dark:text-amber-300">Ohne diese Dokumentation wird keine Auszahlung erfolgen. Bei Fehlern erfolgt kein Honorar!</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="techniker_name">Name Aufmaßtechniker *</Label>
          <Input id="techniker_name" {...register('techniker_name')} disabled={disabled} placeholder="Dein vollständiger Name" />
          {errors.techniker_name && <p className="text-xs text-destructive">{errors.techniker_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="techniker_telefon">Telefonnummer *</Label>
          <Input id="techniker_telefon" type="tel" {...register('techniker_telefon')} disabled={disabled} placeholder="Erreichbare Nummer" />
          {errors.techniker_telefon && <p className="text-xs text-destructive">{errors.techniker_telefon.message}</p>}
        </div>

        <div className="bg-card rounded-xl p-4 border border-border space-y-3">
          <p className="text-sm font-medium">👟 Hausschuhe = Pflicht beim Kunden! 🏠</p>
          <p className="text-xs text-muted-foreground">Bring eigene saubere Hausschuhe mit und mach ein Foto davon 📸</p>
          <PhotoUploadField
            kategorie="hausschuhe"
            existingBilder={filterBilderByKategorie(bilder, 'hausschuhe')}
            votFormularId={votFormularId}
            leadName={leadName}
            leadId={leadId}
            auftragId={auftragId}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label>Datum ThermoCheck *</Label>
          <AufmassDatePicker
            value={watch('thermocheck_datum') || ''}
            onChange={(v) => setValue('thermocheck_datum', v)}
            disabled={disabled}
            placeholder="Datum wählen"
          />
          {errors.thermocheck_datum && <p className="text-xs text-destructive">{errors.thermocheck_datum.message}</p>}
        </div>
      </div>
    </div>
  );
}
