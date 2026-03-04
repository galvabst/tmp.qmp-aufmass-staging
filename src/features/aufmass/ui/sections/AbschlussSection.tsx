import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild } from '../../hooks/useVotBilder';
import { SignatureField } from '../components/SignatureField';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { useUploadVotBild } from '../../hooks/useVotBilder';
import { BILD_KATEGORIEN } from '../../data/bild-kategorien';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function AbschlussSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = form;
  const agb = watch('agb_akzeptiert');
  const uploadMutation = useUploadVotBild();

  const handleSignature = async (blob: Blob) => {
    if (!votFormularId) return;
    const file = new File([blob], 'unterschrift_kunde_final.png', { type: 'image/png' });
    await uploadMutation.mutateAsync({
      file, votFormularId, kategorie: 'unterschrift_kunde_final',
      leadName, leadId, auftragId, reihenfolge: 1,
    });
  };

  const bewertungConfig = BILD_KATEGORIEN.bewertung_nachweis;

  return (
    <div className="space-y-6">
      {/* Bewertungsnachweis (optional) */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="font-semibold text-foreground mb-1">📸 {bewertungConfig.label}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          {bewertungConfig.hinweis} — Optional, aber es gibt Bonus!
          <br />
          <span className="font-medium">10 € pro Bewertung, 50 € bei Google + Trustpilot</span>
        </p>
        <PhotoUploadField
          kategorie="bewertung_nachweis"
          bilder={bilder}
          votFormularId={votFormularId}
          leadName={leadName}
          leadId={leadId}
          auftragId={auftragId}
          disabled={disabled}
        />
      </div>

      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm text-muted-foreground">
          Du kannst über den Button "Daten prüfen" deine Eingabe nochmal überprüfen.
          Falsche Angaben (auch Tippfehler!) können zu Verzögerungen und Mehrkosten führen.
        </p>
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="agb_akzeptiert"
          checked={agb === true}
          onCheckedChange={(checked) => setValue('agb_akzeptiert', checked === true)}
          disabled={disabled}
        />
        <label htmlFor="agb_akzeptiert" className="text-sm text-foreground leading-tight">
          Alle Angaben wurden nach bestem Wissen und Gewissen korrekt zusammengestellt.
          Ich akzeptiere die Bedingungen. *
        </label>
      </div>

      <SignatureField
        label="Unterschrift des Kunden"
        onSignatureReady={handleSignature}
        disabled={disabled}
      />
    </div>
  );
}
