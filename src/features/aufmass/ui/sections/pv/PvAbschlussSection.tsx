import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PvAufmassDraftData } from '../../../data/pv-aufmass-schema';
import { VotBild } from '../../../hooks/useVotBilder';
import { SignatureField } from '../../components/SignatureField';

interface Props {
  pvForm: UseFormReturn<PvAufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function PvAbschlussSection({ pvForm, disabled }: Props) {
  const { watch, setValue } = pvForm;
  const bestaetigung = watch('pv_bestaetigung');

  const handleSignature = async (blob: Blob) => {
    // Convert blob to base64 data URL and store in form
    const reader = new FileReader();
    reader.onload = () => {
      setValue('pv_unterschrift', reader.result as string);
    };
    reader.readAsDataURL(blob);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          Bitte überprüfe alle PV-Angaben nochmals. Falsche Angaben können zu Verzögerungen führen.
        </p>
      </div>

      {/* Kommentar */}
      <div className="space-y-2">
        <Label>Kommentar / Besonderheiten</Label>
        <Textarea
          placeholder="Zusätzliche Hinweise zur PV-Anlage..."
          value={watch('pv_kommentar') || ''}
          onChange={(e) => setValue('pv_kommentar', e.target.value)}
          disabled={disabled}
          rows={4}
        />
      </div>

      {/* Bestätigung */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="pv_bestaetigung"
          checked={bestaetigung === true}
          onCheckedChange={(checked) => setValue('pv_bestaetigung', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="pv_bestaetigung" className="text-sm text-foreground leading-tight">
          Alle PV-Angaben wurden korrekt erfasst. *
        </label>
      </div>

      {/* Unterschrift */}
      <SignatureField
        label="Unterschrift PV-Aufmaß"
        onSignatureReady={handleSignature}
        disabled={disabled}
      />
    </div>
  );
}
