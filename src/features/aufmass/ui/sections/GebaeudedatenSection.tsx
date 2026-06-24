import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import {
  AufmassDraftData,
  GEBAEUDETYP_WERTE,
  ROHRSYSTEM_WERTE,
  VERGLASUNG_WERTE,
} from '../../data/aufmass-schema';
import { numberFieldProps } from '../../data/aufmass-field-bounds';
import { issuesByField, PlausibilityIssue } from '../../data/aufmass-plausibility';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  disabled?: boolean;
}

const GEBAEUDETYP_LABEL: Record<string, string> = {
  einfamilienhaus: 'Einfamilienhaus',
  doppelhaushaelfte: 'Doppelhaushälfte',
  reihenhaus: 'Reihenhaus',
  reihenendhaus: 'Reihenendhaus',
  mehrfamilienhaus: 'Mehrfamilienhaus',
  gewerbe: 'Gewerbe',
};
const ROHRSYSTEM_LABEL: Record<string, string> = {
  einrohr: 'Einrohr',
  zweirohr: 'Zweirohr',
  unbekannt: 'Unbekannt',
};
const VERGLASUNG_LABEL: Record<string, string> = {
  einfach: '1-fach',
  zweifach: '2-fach',
  dreifach: '3-fach',
  zweifach_waermeschutz: '2-fach + Wärmeschutz',
  dreifach_waermeschutz: '3-fach + Wärmeschutz',
};

const btnCls = (active: boolean) =>
  `py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors ${
    active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'
  }`;

function OptionRow({
  ariaLabel,
  values,
  labels,
  current,
  onSelect,
  disabled,
}: {
  ariaLabel: string;
  values: readonly string[];
  labels: Record<string, string>;
  current: string | undefined;
  onSelect: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex gap-2 flex-wrap">
      {values.map((v) => (
        <button key={v} type="button" disabled={disabled} onClick={() => onSelect(v)} className={btnCls(current === v)}>
          {labels[v]}
        </button>
      ))}
    </div>
  );
}

function JaNein({
  ariaLabel,
  current,
  onSelect,
  disabled,
}: {
  ariaLabel: string;
  current: boolean | undefined;
  onSelect: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex gap-2">
      <button type="button" disabled={disabled} onClick={() => onSelect(true)} className={`flex-1 ${btnCls(current === true)}`}>
        Ja
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelect(false)} className={`flex-1 ${btnCls(current === false)}`}>
        Nein
      </button>
    </div>
  );
}

/** Live-Plausibilität am Eingabepunkt — DRY aus checkPlausibility (block=rot, soft=amber). */
function FieldHinweise({ issues }: { issues?: PlausibilityIssue[] }) {
  if (!issues || issues.length === 0) return null;
  return (
    <div className="space-y-1">
      {issues.map((i) => (
        <p
          key={i.ruleId}
          className={`flex items-start gap-1.5 text-xs ${i.severity === 'block' ? 'text-red-600' : 'text-amber-600'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {i.message}
        </p>
      ))}
    </div>
  );
}

export function GebaeudedatenSection({ form, disabled }: Props) {
  const { register, watch, setValue } = form;
  const values = watch();
  const plausi = issuesByField(values);

  const gebaeudetyp = values.gebaeudetyp;
  const rohrsystem = values.rohrsystem;
  const verglasung = values.verglasung;
  const hatDenkmalschutz = values.hat_denkmalschutz;
  const fassade = values.fassade_gedaemmt;
  const dach = values.dach_gedaemmt;
  const kamin = values.hat_kamin;
  const solarthermie = values.hat_solarthermie;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Gebäudetyp *</Label>
        <OptionRow ariaLabel="Gebäudetyp" values={GEBAEUDETYP_WERTE} labels={GEBAEUDETYP_LABEL} current={gebaeudetyp} onSelect={(v) => setValue('gebaeudetyp', v as AufmassDraftData['gebaeudetyp'])} disabled={disabled} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="beheizte_wohnflaeche_m2">Beheizte Wohnfläche (m²) *</Label>
          <Input id="beheizte_wohnflaeche_m2" {...numberFieldProps('beheizte_wohnflaeche_m2')} {...register('beheizte_wohnflaeche_m2', { valueAsNumber: true })} disabled={disabled} />
          <FieldHinweise issues={plausi.beheizte_wohnflaeche_m2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="anzahl_etagen">Etagen *</Label>
          <Input id="anzahl_etagen" {...numberFieldProps('anzahl_etagen')} {...register('anzahl_etagen', { valueAsNumber: true })} disabled={disabled} />
          <FieldHinweise issues={plausi.anzahl_etagen} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anzahl_bewohner">Bewohnerzahl *</Label>
        <Input id="anzahl_bewohner" {...numberFieldProps('anzahl_bewohner')} {...register('anzahl_bewohner', { valueAsNumber: true })} disabled={disabled} />
        <FieldHinweise issues={plausi.anzahl_bewohner} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="durchschnittsverbrauch_3_jahre">Verbrauch Ø letzte 3 Jahre (kWh bzw. Liter) *</Label>
        <Input id="durchschnittsverbrauch_3_jahre" {...numberFieldProps('durchschnittsverbrauch_3_jahre')} {...register('durchschnittsverbrauch_3_jahre', { valueAsNumber: true })} disabled={disabled} />
        {/* Heizungsart wird erst in einem späteren Schritt erfasst → statischer Inline-Hinweis,
            damit ein Laie hier weiß, welche Einheit er eintragen muss (kein Schritt-Bezug nötig). */}
        <p className="text-xs text-muted-foreground">Gas/Wärmepumpe: Jahres-kWh · Öl: Jahres-Liter (wird intern umgerechnet)</p>
        <FieldHinweise issues={plausi.durchschnittsverbrauch_3_jahre} />
      </div>

      <div className="space-y-2">
        <Label>Denkmalschutz? *</Label>
        <JaNein ariaLabel="Denkmalschutz" current={hatDenkmalschutz} onSelect={(v) => setValue('hat_denkmalschutz', v)} disabled={disabled} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Fassade gedämmt? *</Label>
          <JaNein ariaLabel="Fassade gedämmt" current={fassade} onSelect={(v) => setValue('fassade_gedaemmt', v)} disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Dach gedämmt? *</Label>
          <JaNein ariaLabel="Dach gedämmt" current={dach} onSelect={(v) => setValue('dach_gedaemmt', v)} disabled={disabled} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rohrsystem *</Label>
        <OptionRow ariaLabel="Rohrsystem" values={ROHRSYSTEM_WERTE} labels={ROHRSYSTEM_LABEL} current={rohrsystem} onSelect={(v) => setValue('rohrsystem', v as AufmassDraftData['rohrsystem'])} disabled={disabled} />
      </div>

      <div className="space-y-2">
        <Label>Verglasung *</Label>
        <OptionRow ariaLabel="Verglasung" values={VERGLASUNG_WERTE} labels={VERGLASUNG_LABEL} current={verglasung} onSelect={(v) => setValue('verglasung', v as AufmassDraftData['verglasung'])} disabled={disabled} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Kamin vorhanden? *</Label>
          <JaNein ariaLabel="Kamin vorhanden" current={kamin} onSelect={(v) => setValue('hat_kamin', v)} disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Solarthermie vorhanden? *</Label>
          <JaNein ariaLabel="Solarthermie vorhanden" current={solarthermie} onSelect={(v) => setValue('hat_solarthermie', v)} disabled={disabled} />
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 border border-border space-y-3">
        <p className="font-medium text-sm">Heizkreis-Temperaturen</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="vorlauftemperatur">Vorlauf (°C) *</Label>
            <Input id="vorlauftemperatur" {...numberFieldProps('vorlauftemperatur')} {...register('vorlauftemperatur', { valueAsNumber: true })} disabled={disabled} />
            <FieldHinweise issues={plausi.vorlauftemperatur} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ruecklauftemperatur">Rücklauf (°C) *</Label>
            <Input id="ruecklauftemperatur" {...numberFieldProps('ruecklauftemperatur')} {...register('ruecklauftemperatur', { valueAsNumber: true })} disabled={disabled} />
            <FieldHinweise issues={plausi.ruecklauftemperatur} />
          </div>
        </div>
      </div>
    </div>
  );
}
