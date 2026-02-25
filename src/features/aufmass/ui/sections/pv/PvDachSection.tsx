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

export function PvDachSection({ pvForm, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const trapezdach = watch('trapezdach');
  const attika = watch('attika_vorhanden');
  const aufdach = watch('aufdachdaemmung');
  const photoProps = { votFormularId, leadName, leadId, auftragId, disabled };

  const dachformen = ['Satteldach', 'Flachdach', 'Pultdach', 'Walmdach', 'Mansarddach', 'Sonstiges'];
  const ausrichtungen = ['Süd', 'Süd-West', 'Süd-Ost', 'West', 'Ost', 'Nord'];

  return (
    <div className="space-y-5">
      {/* Dachform */}
      <div className="space-y-2">
        <Label>Dachform *</Label>
        <div className="flex flex-wrap gap-2">
          {dachformen.map((d) => (
            <button key={d} type="button" disabled={disabled}
              onClick={() => setValue('dachform', d)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                watch('dachform') === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{d}</button>
          ))}
        </div>
      </div>

      {/* Ausrichtung */}
      <div className="space-y-2">
        <Label>Dachausrichtung *</Label>
        <div className="flex flex-wrap gap-2">
          {ausrichtungen.map((d) => (
            <button key={d} type="button" disabled={disabled}
              onClick={() => setValue('dachausrichtung', d)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                watch('dachausrichtung') === d ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{d}</button>
          ))}
        </div>
      </div>

      {/* Neigung */}
      <div className="space-y-2">
        <Label>Dachneigung (°)</Label>
        <Input type="number" placeholder="z.B. 30"
          value={watch('dachneigung') ?? ''}
          onChange={(e) => setValue('dachneigung', e.target.value ? Number(e.target.value) : undefined)}
          disabled={disabled} />
      </div>

      {/* Sparrenabstand */}
      <div className="space-y-2">
        <Label>Sparrenabstand</Label>
        <Input placeholder="z.B. 70 cm"
          value={watch('sparrenabstand') || ''}
          onChange={(e) => setValue('sparrenabstand', e.target.value)}
          disabled={disabled} />
      </div>

      {/* Trapezdach */}
      <div className="space-y-2">
        <Label>Trapezdach?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('trapezdach', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                trapezdach === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
      {trapezdach && (
        <div className="space-y-2">
          <Label>Art des Trapezdachs</Label>
          <Input placeholder="z.B. Stahltrapez..."
            value={watch('trapezdach_art') || ''}
            onChange={(e) => setValue('trapezdach_art', e.target.value)}
            disabled={disabled} />
        </div>
      )}

      {/* Attika */}
      <div className="space-y-2">
        <Label>Attika vorhanden?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('attika_vorhanden', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                attika === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
      {attika && (
        <div className="space-y-2">
          <Label>Attika-Maße</Label>
          <Input placeholder="z.B. 30 cm Höhe"
            value={watch('attika_masse') || ''}
            onChange={(e) => setValue('attika_masse', e.target.value)}
            disabled={disabled} />
        </div>
      )}

      {/* Aufdachdämmung */}
      <div className="space-y-2">
        <Label>Aufdachdämmung?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('aufdachdaemmung', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                aufdach === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>
      {aufdach && (
        <div className="space-y-2">
          <Label>Dämmstärke (mm)</Label>
          <Input type="number" placeholder="z.B. 120"
            value={watch('aufdachdaemmung_dicke') ?? ''}
            onChange={(e) => setValue('aufdachdaemmung_dicke', e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled} />
        </div>
      )}

      {/* Thermodach */}
      <div className="space-y-2">
        <Label>Thermodach?</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('thermodach', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                watch('thermodach') === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {/* Photos */}
      <PhotoUploadField kategorie="pv_dach" existingBilder={filterBilderByKategorie(bilder, 'pv_dach')} {...photoProps} />
      <PhotoUploadField kategorie="pv_drohne" existingBilder={filterBilderByKategorie(bilder, 'pv_drohne')} {...photoProps} />
      <PhotoUploadField kategorie="pv_sparrenabstand" existingBilder={filterBilderByKategorie(bilder, 'pv_sparrenabstand')} {...photoProps} />
    </div>
  );
}
