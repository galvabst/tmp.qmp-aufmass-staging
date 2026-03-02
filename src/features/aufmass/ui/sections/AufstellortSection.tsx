import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { SignatureField } from '../components/SignatureField';
import { useUploadVotBild } from '../../hooks/useVotBilder';
import { ExternalLink } from 'lucide-react';

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
  const aufstellortAenderung = watch('aufstellort_aenderung');
  const raumscanUrl = watch('raumscan_url');
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

      {/* Distanz-Felder */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-4">
        <p className="font-medium text-sm">Distanzen & Durchbrüche</p>

        <div className="space-y-1">
          <Label htmlFor="distanz_ausseneinheit_kernloch">Distanz Außeneinheit → Kernlochbohrung (m) *</Label>
          <Input id="distanz_ausseneinheit_kernloch" type="number" step="0.1" min="0" disabled={disabled}
            {...register('distanz_ausseneinheit_kernloch', { valueAsNumber: true })} />
          {errors.distanz_ausseneinheit_kernloch && <p className="text-xs text-destructive">{errors.distanz_ausseneinheit_kernloch.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="distanz_kernloch_innengeraet">Distanz Kernlochbohrung → Innengerät (m) *</Label>
          <Input id="distanz_kernloch_innengeraet" type="number" step="0.1" min="0" disabled={disabled}
            {...register('distanz_kernloch_innengeraet', { valueAsNumber: true })} />
          {errors.distanz_kernloch_innengeraet && <p className="text-xs text-destructive">{errors.distanz_kernloch_innengeraet.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="anzahl_durchbrueche_kernloch">Anzahl Durchbrüche (Kernloch → Innengerät) *</Label>
          <Input id="anzahl_durchbrueche_kernloch" type="number" step="1" min="0" disabled={disabled}
            {...register('anzahl_durchbrueche_kernloch', { valueAsNumber: true })} />
          {errors.anzahl_durchbrueche_kernloch && <p className="text-xs text-destructive">{errors.anzahl_durchbrueche_kernloch.message}</p>}
        </div>
      </div>

      {/* Aufstellort-Änderung */}
      <div className="bg-card rounded-xl p-4 border border-border space-y-4">
        <p className="font-medium text-sm">Wird der Aufstellort geändert? *</p>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => {
                setValue('aufstellort_aenderung', val);
                if (!val) setValue('distanz_alter_neuer_aufstellort', undefined);
              }}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                aufstellortAenderung === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
        {errors.aufstellort_aenderung && <p className="text-xs text-destructive">{errors.aufstellort_aenderung.message}</p>}

        {aufstellortAenderung === true && (
          <div className="space-y-1">
            <Label htmlFor="distanz_alter_neuer_aufstellort">Distanz alter → neuer Aufstellort (m) *</Label>
            <Input id="distanz_alter_neuer_aufstellort" type="number" step="0.1" min="0" disabled={disabled}
              {...register('distanz_alter_neuer_aufstellort', { valueAsNumber: true })} />
            {errors.distanz_alter_neuer_aufstellort && <p className="text-xs text-destructive">{errors.distanz_alter_neuer_aufstellort.message}</p>}
          </div>
        )}
      </div>

      {/* Raumscan-URL */}
      <div className="space-y-1">
        <Label htmlFor="raumscan_url">Link zum Raumscan</Label>
        <div className="flex gap-2 items-center">
          <Input id="raumscan_url" type="url" placeholder="https://..." disabled={disabled}
            {...register('raumscan_url')} className="flex-1" />
          {raumscanUrl && raumscanUrl.startsWith('http') && (
            <a href={raumscanUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
              <ExternalLink className="h-4 w-4" /> Öffnen
            </a>
          )}
        </div>
      </div>

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
