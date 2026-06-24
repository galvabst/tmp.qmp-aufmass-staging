import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PvAufmassDraftData } from '../../../data/pv-aufmass-schema';
import { numberFieldProps } from '../../../data/aufmass-field-bounds';
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

export function PvDachziegelSection({ pvForm, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const ziegelNeigung = watch('ziegel_neigung');
  const photoProps = { votFormularId, leadName, leadId, auftragId, disabled };

  return (
    <div className="space-y-5">
      {/* Ziegel lose */}
      <div className="space-y-2">
        <Label>Sind Ziegel lose? *</Label>
        <div className="flex gap-2">
          {(['ja', 'nein', 'nicht_erkennbar'] as const).map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('ziegel_lose', val)}
              className={`flex-1 py-3 px-3 rounded-lg border text-sm font-medium transition-colors ${
                watch('ziegel_lose') === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >
              {val === 'ja' ? 'Ja' : val === 'nein' ? 'Nein' : 'Nicht erkennbar'}
            </button>
          ))}
        </div>
      </div>

      {/* Dacheindeckung */}
      <div className="space-y-2">
        <Label>Art der Dacheindeckung</Label>
        <Input placeholder="z.B. Betondachstein, Tonziegel..."
          value={watch('dacheindeckung_art') || ''}
          onChange={(e) => setValue('dacheindeckung_art', e.target.value)}
          disabled={disabled} />
      </div>

      {/* Ziegel-Neigung */}
      <div className="space-y-2">
        <Label>Ziegelneigung</Label>
        <div className="flex gap-3">
          {(['positiv', 'negativ'] as const).map((val) => (
            <button key={val} type="button" disabled={disabled}
              onClick={() => setValue('ziegel_neigung', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                ziegelNeigung === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val === 'positiv' ? 'Positiv' : 'Negativ'}</button>
          ))}
        </div>
      </div>

      {ziegelNeigung && (
        <div className="space-y-2">
          <Label>Neigungsgrad (°)</Label>
          <Input {...numberFieldProps('ziegel_neigung_grad')} placeholder="z.B. 5"
            value={watch('ziegel_neigung_grad') ?? ''}
            onChange={(e) => setValue('ziegel_neigung_grad', e.target.value ? Number(e.target.value) : undefined)}
            disabled={disabled} />
        </div>
      )}

      <PhotoUploadField kategorie="pv_dachziegel" existingBilder={filterBilderByKategorie(bilder, 'pv_dachziegel')} {...photoProps} />
    </div>
  );
}
