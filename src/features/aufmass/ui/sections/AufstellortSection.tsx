import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
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

export function AufstellortSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue, register, formState: { errors } } = form;
  const alt1 = watch('alternative_1_vorhanden');
  const alt2 = watch('alternative_2_vorhanden');
  const bestaetigt = watch('kunde_aufstellort_bestaetigt');
  const uploadMutation = useUploadVotBild();

  const handleSignature = async (blob: Blob) => {
    if (!votFormularId) return;
    const file = new File([blob], 'unterschrift_aufstellort.png', { type: 'image/png' });
    await uploadMutation.mutateAsync({
      file, votFormularId, kategorie: 'unterschrift_aufstellort',
      leadName, leadId, auftragId, reihenfolge: 1,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Option */}
      <PhotoUploadField kategorie="aufstellort_option_1" existingBilder={filterBilderByKategorie(bilder, 'aufstellort_option_1')}
        votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
      <PhotoUploadField kategorie="aufstellort_umgebung_1" existingBilder={filterBilderByKategorie(bilder, 'aufstellort_umgebung_1')}
        votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />

      {/* 1. Alternative */}
      <div className="space-y-2">
        <Label>1. Alternative Aufstellort</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('alternative_1_vorhanden', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                alt1 === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ist gegeben' : 'Keine weitere'}</button>
          ))}
        </div>
      </div>

      {alt1 && (
        <>
          <PhotoUploadField kategorie="aufstellort_alt_1" existingBilder={filterBilderByKategorie(bilder, 'aufstellort_alt_1')}
            votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
          <PhotoUploadField kategorie="aufstellort_umgebung_alt_1" existingBilder={filterBilderByKategorie(bilder, 'aufstellort_umgebung_alt_1')}
            votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />

          {/* 2. Alternative */}
          <div className="space-y-2">
            <Label>2. Alternative Aufstellort</Label>
            <div className="flex gap-3">
              {[true, false].map((val) => (
                <button key={String(val)} type="button" disabled={disabled}
                  onClick={() => setValue('alternative_2_vorhanden', val)}
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    alt2 === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                  }`}
                >{val ? 'Ist gegeben' : 'Keine weitere'}</button>
              ))}
            </div>
          </div>

          {alt2 && (
            <>
              <PhotoUploadField kategorie="aufstellort_alt_2" existingBilder={filterBilderByKategorie(bilder, 'aufstellort_alt_2')}
                votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
              <PhotoUploadField kategorie="aufstellort_umgebung_alt_2" existingBilder={filterBilderByKategorie(bilder, 'aufstellort_umgebung_alt_2')}
                votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
            </>
          )}
        </>
      )}

      {/* Kundenbestätigung */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-4">
        <p className="font-medium text-sm">Bestätigung Aufstellort durch den Kunden</p>
        <p className="text-xs text-muted-foreground">
          Der Kunde bestätigt, dass ihm die möglichen Aufstellorte erläutert wurden und er einverstanden ist.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="kunde_bestaetigung_vorname">Vorname *</Label>
            <Input id="kunde_bestaetigung_vorname" {...register('kunde_bestaetigung_vorname')} disabled={disabled} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="kunde_bestaetigung_nachname">Nachname *</Label>
            <Input id="kunde_bestaetigung_nachname" {...register('kunde_bestaetigung_nachname')} disabled={disabled} />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="kunde_aufstellort_bestaetigt"
            checked={bestaetigt === true}
            onCheckedChange={(checked) => setValue('kunde_aufstellort_bestaetigt', checked === true)}
            disabled={disabled}
          />
          <label htmlFor="kunde_aufstellort_bestaetigt" className="text-xs text-muted-foreground leading-tight">
            Ich habe den Hinweis bzgl. des Aufstellorts gelesen und bin einverstanden.
          </label>
        </div>

        <SignatureField
          label="Unterschrift Kunde (Aufstellort)"
          onSignatureReady={handleSignature}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
