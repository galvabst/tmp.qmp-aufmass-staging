import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild } from '../../hooks/useVotBilder';
import { SignatureField } from '../components/SignatureField';
import { useUploadVotBild } from '../../hooks/useVotBilder';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

const CHECKS = [
  { key: 'check_raeume_gescannt', label: 'Wurden alle Räume richtig gescannt?' },
  { key: 'check_anzahl_raeume', label: 'Anzahl der Räume stimmt?' },
  { key: 'check_aufstellort_besprochen', label: 'Außenaufstellort besprochen?' },
  { key: 'check_alle_bilder', label: 'Forms-Formular: Alle Bilder ausgefüllt?' },
  { key: 'check_heizkoerper_aufgenommen', label: 'Alle Heizkörper richtig aufgenommen?' },
] as const;

export function ChecklisteSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { register, watch, setValue } = form;
  const uploadMutation = useUploadVotBild();

  const handleSignature = async (blob: Blob) => {
    if (!votFormularId) return;
    const file = new File([blob], 'unterschrift_techniker.png', { type: 'image/png' });
    await uploadMutation.mutateAsync({
      file, votFormularId, kategorie: 'unterschrift_techniker',
      leadName, leadId, auftragId, reihenfolge: 1,
    });
  };

  return (
    <div className="space-y-4">
      <p className="font-medium text-foreground">Technisches Aufmaß & Außenaufstellung</p>

      {CHECKS.map(({ key, label }) => (
        <div key={key} className="flex items-start gap-3">
          <Checkbox
            id={key}
            checked={watch(key as any) === true}
            onCheckedChange={(checked) => setValue(key as any, checked === true)}
            disabled={disabled}
          />
          <label htmlFor={key} className="text-sm text-foreground leading-tight">{label}</label>
        </div>
      ))}

      <div className="space-y-2">
        <Label htmlFor="bemerkungen">Bemerkungen / Infos</Label>
        <Textarea id="bemerkungen" {...register('bemerkungen')} disabled={disabled} placeholder="Optionale Hinweise..." />
      </div>

      <SignatureField
        label="Unterschrift Thermocheckler"
        onSignatureReady={handleSignature}
        disabled={disabled}
      />
    </div>
  );
}
