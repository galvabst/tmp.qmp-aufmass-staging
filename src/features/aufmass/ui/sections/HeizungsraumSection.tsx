import { UseFormReturn } from 'react-hook-form';
import { AufmassDraftData } from '../../data/aufmass-schema';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const ANSCHLUSS_LEITUNGEN = [
  { key: 'vorlauf', label: 'Vorlauf' },
  { key: 'ruecklauf', label: 'Rücklauf' },
  { key: 'warmwasser', label: 'Warmwasser' },
  { key: 'kaltwasser', label: 'Kaltwasser' },
  { key: 'zirkulation', label: 'Zirkulationsleitung' },
] as const;

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId?: string;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

export function HeizungsraumSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { watch, setValue } = form;
  const mehrBilder = watch('mehr_bilder_heizungsraum');
  const heizungsraumVerlegen = watch('heizungsraum_verlegen');

  return (
    <div className="space-y-4">
      <PhotoUploadField
        kategorie="heizungsraum"
        existingBilder={filterBilderByKategorie(bilder, 'heizungsraum')}
        votFormularId={votFormularId}
        leadName={leadName} leadId={leadId} auftragId={auftragId}
        disabled={disabled}
      />

      <div className="space-y-2">
        <Label>Mehr Bilder vom Heizungsraum? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('mehr_bilder_heizungsraum', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                mehrBilder === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {mehrBilder && (
        <PhotoUploadField
          kategorie="heizungsraum_extra"
          existingBilder={filterBilderByKategorie(bilder, 'heizungsraum_extra')}
          votFormularId={votFormularId}
          leadName={leadName} leadId={leadId} auftragId={auftragId}
          disabled={disabled}
        />
      )}

      {/* Heizungsraum verlegen */}
      <div className="space-y-2">
        <Label>Heizungsraum verlegen? *</Label>
        <div className="flex gap-3">
          {[true, false].map((val) => (
            <button key={String(val)} type="button" disabled={disabled}
              onClick={() => setValue('heizungsraum_verlegen', val)}
              className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                heizungsraumVerlegen === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
              }`}
            >{val ? 'Ja' : 'Nein'}</button>
          ))}
        </div>
      </div>

      {heizungsraumVerlegen && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium text-foreground">Anschlüsse am neuen Standort</p>
          {ANSCHLUSS_LEITUNGEN.map(({ key, label }) => {
            const vorhandenKey = `anschluss_${key}_vorhanden` as keyof AufmassDraftData;
            const distanzKey = `anschluss_${key}_distanz` as keyof AufmassDraftData;
            const vorhanden = watch(vorhandenKey);
            const distanz = watch(distanzKey);

            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-foreground min-w-[110px]">{label}</span>
                <div className="flex gap-1.5">
                  {[true, false].map((val) => (
                    <button key={String(val)} type="button" disabled={disabled}
                      onClick={() => setValue(vorhandenKey as any, val)}
                      className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        vorhanden === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
                      }`}
                    >{val ? 'Ja' : 'Nein'}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    disabled={disabled}
                    value={distanz != null ? String(distanz) : ''}
                    onChange={(e) => setValue(distanzKey as any, e.target.value === '' ? undefined : Number(e.target.value))}
                    className="w-20 h-8 text-sm"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted-foreground">m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
