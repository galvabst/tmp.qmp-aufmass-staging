import { UseFormReturn, type FieldPath } from 'react-hook-form';
import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Info, Layers, Calculator } from 'lucide-react';
import {
  AufmassDraftData,
  MAUERWERK_MATERIAL_WERTE,
  DAEMMSTOFF_TYP_WERTE,
  GEPRUEFT_PER_WERTE,
  DACHTYP_WERTE,
  DACH_EINDECKUNG_WERTE,
  FLACHDACH_ABDICHTUNG_WERTE,
  BODEN_ART_WERTE,
  RAHMENMATERIAL_WERTE,
} from '../../data/aufmass-schema';
import { checkUWertePlausibilitaet } from '../../data/u-werte-plausibility';
import { berechneUWerte, type UWertErgebnis } from '../../data/u-werte-berechnung';
import { PhotoUploadField } from '../components/PhotoUploadField';
import { LabelMitHilfe } from '../components/LabelMitHilfe';
import { feldHilfe } from '../../data/feld-hilfe';
import { UWerteAIPanel } from './UWerteAIPanel';
import { VotBild, filterBilderByKategorie } from '../../hooks/useVotBilder';
import type { VotBildKategorie } from '../../data/bild-kategorien';
import { toast } from 'sonner';

interface Props {
  form: UseFormReturn<AufmassDraftData>;
  bilder: VotBild[];
  votFormularId: string | undefined;
  leadName: string;
  leadId: string;
  auftragId: string;
  disabled?: boolean;
}

const MATERIAL_LABEL: Record<string, string> = {
  vollziegel: 'Vollziegel', hochlochziegel: 'Hochlochziegel', kalksandstein: 'Kalksandstein',
  ytong_porenbeton: 'Ytong / Porenbeton', beton: 'Beton', bruchstein: 'Bruchstein', gasbeton: 'Gasbeton', andere: 'Andere',
};
const DAEMM_LABEL: Record<string, string> = {
  mineralwolle: 'Mineralwolle', eps_styropor: 'EPS / Styropor', xps: 'XPS', pur_pir: 'PUR / PIR',
  holzfaser: 'Holzfaser', kork: 'Kork', schaumglas: 'Schaumglas', keine: 'Keine', andere: 'Andere',
};
const GEPRUEFT_LABEL: Record<string, string> = {
  gemessen: 'Gemessen', foto: 'Per Foto', kundenangabe: 'Kundenangabe', ki_abgeleitet: 'Aus Baualter abgeleitet',
};
const DACHTYP_LABEL: Record<string, string> = { satteldach: 'Satteldach', pultdach: 'Pultdach', walmdach: 'Walmdach', flachdach: 'Flachdach' };
const EINDECKUNG_LABEL: Record<string, string> = {
  dachziegel_ton: 'Tonziegel', dachziegel_beton: 'Betonziegel', blech: 'Blech', schiefer: 'Schiefer', bitumen: 'Bitumen', andere: 'Andere',
};
const ABDICHTUNG_LABEL: Record<string, string> = { bitumen: 'Bitumen', pvc: 'PVC', tpo: 'TPO', andere: 'Andere' };
const BODEN_LABEL: Record<string, string> = {
  bodenplatte_erdberuehrt: 'Bodenplatte (erdberührt)', kellerdecke_unbeheizt: 'Kellerdecke (Keller unbeheizt)',
  kellerdecke_beheizt: 'Kellerdecke (Keller beheizt)', unbekannt: 'Unbekannt',
};
const RAHMEN_LABEL: Record<string, string> = { kunststoff: 'Kunststoff', holz: 'Holz', aluminium: 'Aluminium', holz_alu: 'Holz-Alu', andere: 'Andere' };

const btnCls = (active: boolean) =>
  `py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`;

type Path = FieldPath<AufmassDraftData>;

export function UWerteSection({ form, bilder, votFormularId, leadName, leadId, auftragId, disabled }: Props) {
  const { register, watch, setValue } = form;
  const values = watch();
  const u = values.u_werte ?? {};
  const plausi = checkUWertePlausibilitaet(values);
  // Geschätzte U-Werte je Bauteil (rein deterministisch, R = d/λ + Rsi/Rse).
  // Reine Schätzung zur Plausibilisierung — nicht die Heizlast-Auslegung (autarc).
  const uBerechnet = berechneUWerte(u);
  const uBauteile: ReadonlyArray<{ label: string; e: UWertErgebnis | null }> = [
    { label: 'Außenwand', e: uBerechnet.aussenwand },
    { label: 'Dach', e: uBerechnet.dach },
    { label: 'Bodenplatte / Keller', e: uBerechnet.unten },
    { label: 'Anbau-Wand', e: uBerechnet.anbauwand },
  ];
  const hatBerechnung = uBauteile.some((b) => b.e != null);
  const set = (path: Path, v: unknown) => setValue(path, v as never, { shouldDirty: true });

  // KI-Vorschlag übernehmen: dotted path (z. B. "aussenwand.mauerwerk_cm") →
  // Formularfeld u_werte.<path>; betroffene Bauteile werden als „ki_abgeleitet"
  // markiert (der Kunde haftet, ist so gekennzeichnet — wie bei manueller Wahl).
  const applyVorschlag = (vorschlag: Record<string, unknown>) => {
    const bauteile = new Set<string>();
    for (const [dotted, val] of Object.entries(vorschlag)) {
      if (val == null) continue;
      set(`u_werte.${dotted}` as Path, val);
      bauteile.add(dotted.split('.')[0]);
    }
    for (const bauteil of bauteile) {
      if (['aussenwand', 'dach', 'unten'].includes(bauteil)) {
        set(`u_werte.${bauteil}.geprueft_per` as Path, 'ki_abgeleitet');
      }
    }
    toast.success('KI-Vorschlag übernommen — als „aus Baualter abgeleitet" markiert. Bitte prüfen.');
  };

  // WICHTIG: Helfer werden als FUNKTIONEN aufgerufen ({sel(...)}), NICHT als
  // Komponenten (<Sel/>) gerendert — sonst remountet React sie bei jedem Render
  // (watch() → Tastendruck) und das Eingabefeld verliert den Fokus.
  const hilfe = (t: ReactNode) => <p className="text-xs text-muted-foreground leading-snug">{t}</p>;

  // Label mit kontextueller Feld-Hilfe (Bottom-Sheet), wenn der Punkt-Pfad im
  // Hilfe-Register existiert — sonst sauberes Fallback auf ein nacktes <Label>.
  // `ohneInline`, weil dieser Abschnitt seine eigene (reichere) `help`-Microcopy
  // unter dem Feld führt; nur die Ebene-2/3-Tiefe kommt dazu.
  const feldLabel = (text: string, path: Path, htmlFor?: string) =>
    feldHilfe(path) ? (
      <LabelMitHilfe hilfeKey={path} htmlFor={htmlFor} ohneInline>{text}</LabelMitHilfe>
    ) : (
      <Label htmlFor={htmlFor}>{text}</Label>
    );

  const sel = (o: { label: string; path: Path; current: string | undefined; values: readonly string[]; labels: Record<string, string>; help?: ReactNode; notizPath?: Path }) => (
    <div className="space-y-1.5">
      {feldLabel(o.label, o.path)}
      <div role="group" aria-label={o.label} className="flex gap-2 flex-wrap">
        {o.values.map((v) => (
          <button key={v} type="button" disabled={disabled} onClick={() => set(o.path, v)} className={btnCls(o.current === v)}>{o.labels[v] ?? v}</button>
        ))}
      </div>
      {o.help && hilfe(o.help)}
      {o.current === 'andere' && o.notizPath && (
        <Input {...register(o.notizPath)} disabled={disabled} placeholder="Bitte das andere Material/Produkt genau benennen" />
      )}
    </div>
  );

  const num = (o: { label: string; path: Path; min: number; max: number; step?: number; unit?: string; help?: ReactNode }) => (
    <div className="space-y-1.5">
      {feldLabel(`${o.label}${o.unit ? ` (${o.unit})` : ''}`, o.path, o.path)}
      <Input id={o.path} type="number" inputMode="decimal" min={o.min} max={o.max} step={o.step ?? 1}
        {...register(o.path, { valueAsNumber: true })} disabled={disabled} />
      {o.help && hilfe(o.help)}
    </div>
  );

  const jaNein = (o: { label: string; path: Path; current: boolean | undefined; help?: ReactNode }) => (
    <div className="space-y-1.5">
      {feldLabel(o.label, o.path)}
      <div role="group" aria-label={o.label} className="flex gap-2">
        <button type="button" disabled={disabled} onClick={() => set(o.path, true)} className={`flex-1 ${btnCls(o.current === true)}`}>Ja</button>
        <button type="button" disabled={disabled} onClick={() => set(o.path, false)} className={`flex-1 ${btnCls(o.current === false)}`}>Nein</button>
      </div>
      {o.help && hilfe(o.help)}
    </div>
  );

  const foto = (kategorie: VotBildKategorie) => (
    <PhotoUploadField kategorie={kategorie} existingBilder={filterBilderByKategorie(bilder, kategorie)}
      votFormularId={votFormularId} leadName={leadName} leadId={leadId} auftragId={auftragId} disabled={disabled} />
  );

  const GEPRUEFT_HELP = 'Wie sicher ist die Angabe? Gemessen/Foto = belegt · Kundenangabe = vom Kunden genannt · „Aus Baualter abgeleitet" = geschätzt (dafür haftet der Kunde).';

  return (
    <div className="space-y-6">
      {/* Erklär-UI */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
        <p className="flex items-center gap-2 font-semibold text-sm text-foreground"><Layers className="w-4 h-4 text-primary" /> Gebäudehülle in Schichten erfassen</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Eine Wand ist mehr als „Stein": z. B. <strong>Außenputz → (Armierung) → Dämmstoff → Mauerwerk → Innenputz</strong>.
          Zu jedem Feld steht unten <strong>wie du es herausfindest</strong>. Gute Quellen: <strong>Energieausweis</strong>,
          <strong> Bauantrag/Baubeschreibung</strong>, <strong>Sanierungsrechnungen</strong> — und der <strong>Kunde</strong>.
          Wenn niemand es weiß: ehrlich „Aus Baualter abgeleitet" wählen (das wird so gekennzeichnet, der Kunde bestätigt es).
        </p>
      </div>

      {/* KI-Assistent: prüft sichtbare Belege gegen die Eingaben, schlägt ableitbare Werte vor */}
      <UWerteAIPanel auftragId={auftragId} eingaben={u} disabled={disabled} onApplyVorschlag={applyVorschlag} />

      {plausi.length > 0 && (
        <div className="space-y-1.5">
          {plausi.map((i) => (
            <p key={i.ruleId} className={`flex items-start gap-1.5 text-xs ${i.severity === 'block' ? 'text-red-600' : 'text-amber-600'}`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{i.message}
            </p>
          ))}
        </div>
      )}

      {/* === Geschätzte U-Werte (deterministisch aus dem Schichtaufbau) === */}
      {hatBerechnung && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calculator className="w-4 h-4 text-primary" /> Geschätzte U-Werte
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">Schätzung</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {uBauteile.filter((b) => b.e != null).map((b) => (
              <div key={b.label} className="rounded-lg border border-border bg-card px-3 py-2">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className="text-base font-semibold tabular-nums">
                  {b.e!.uWert.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">W/m²K</span>
                </p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Rechnerische Schätzung aus dem erfassten Schichtaufbau (R = d/λ je Schicht + Wärmeübergang).
            Verborgene Schichten, Feuchte und Wärmebrücken sind nicht erfasst — die verbindliche Heizlast-Auslegung
            erfolgt in autarc. Niedriger = besser gedämmt.
          </p>
        </div>
      )}

      {/* === Außenwand === */}
      <fieldset className="rounded-xl border border-border p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Außenwand *</legend>
        {sel({ label: 'Mauerwerk-Material *', path: 'u_werte.aussenwand.mauerwerk_material' as Path, current: u.aussenwand?.mauerwerk_material, values: MAUERWERK_MATERIAL_WERTE, labels: MATERIAL_LABEL, notizPath: 'u_werte.aussenwand.mauerwerk_notiz' as Path,
          help: 'So erkennst du das Material: roter Ziegel = gebrannt, rötlich · Kalksandstein = weiß-grau, sehr schwer · Ytong/Porenbeton = weiß, sehr leicht (ritzbar) · Beton = grau, massiv. Steht oft im Bauantrag/Energieausweis – sonst Kunde fragen.' })}
        <div className="grid grid-cols-2 gap-3">
          {num({ label: 'Mauerwerk-Dicke *', path: 'u_werte.aussenwand.mauerwerk_cm' as Path, min: 0, max: 100, unit: 'cm', help: 'Fenster öffnen, Meterstab/Zollstock in die Laibung halten – die Tiefe der Laibung ist die Wanddicke.' })}
          {num({ label: 'Innenputz', path: 'u_werte.aussenwand.innenputz_cm' as Path, min: 0, max: 10, unit: 'cm', help: 'Putzschicht innen, meist 1–2 cm. Unbekannt → leer lassen.' })}
        </div>
        {sel({ label: 'Dämmstoff', path: 'u_werte.aussenwand.daemmstoff_typ' as Path, current: u.aussenwand?.daemmstoff_typ, values: DAEMMSTOFF_TYP_WERTE, labels: DAEMM_LABEL, notizPath: 'u_werte.aussenwand.daemmstoff_notiz' as Path,
          help: 'Sichtbar an einer Laibung oder im Rollladenkasten; sonst aus Sanierungsrechnung/Energieausweis. „Keine" = Wand wurde nie gedämmt.' })}
        <div className="grid grid-cols-2 gap-3">
          {num({ label: 'Dämmdicke', path: 'u_werte.aussenwand.daemmstoff_cm' as Path, min: 0, max: 50, unit: 'cm', help: 'An einer offenen Stelle (Laibung) messen oder aus der Rechnung. Typisch 8–20 cm.' })}
          {num({ label: 'Dämmjahr', path: 'u_werte.aussenwand.daemmstoff_jahr' as Path, min: 1900, max: 2100, help: 'Jahr der Dämmung (oft NACH dem Baujahr) – aus Sanierungsrechnung/Energieausweis. Nie gedämmt → leer.' })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {jaNein({ label: 'Außenputz?', path: 'u_werte.aussenwand.aussenputz_vorhanden' as Path, current: u.aussenwand?.aussenputz_vorhanden, help: 'Ist die Wand außen verputzt (glatt) oder ist der Stein/Klinker sichtbar?' })}
          {jaNein({ label: 'Armierung?', path: 'u_werte.aussenwand.armierung_vorhanden' as Path, current: u.aussenwand?.armierung_vorhanden, help: 'Gewebeschicht unter dem Außenputz (typisch bei nachträglicher Dämmung/WDVS). Im Zweifel: Nein.' })}
        </div>
        {sel({ label: 'Angabe geprüft per', path: 'u_werte.aussenwand.geprueft_per' as Path, current: u.aussenwand?.geprueft_per, values: GEPRUEFT_PER_WERTE, labels: GEPRUEFT_LABEL, help: GEPRUEFT_HELP })}
        {foto('wanddicke_fenster_meterstab')}
        {foto('wandaufbau')}
      </fieldset>

      {/* === Dach === */}
      <fieldset className="rounded-xl border border-border p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Dach *</legend>
        {sel({ label: 'Dachtyp *', path: 'u_werte.dach.dachtyp' as Path, current: u.dach?.dachtyp, values: DACHTYP_WERTE, labels: DACHTYP_LABEL,
          help: 'Form von außen: Sattel = zwei Schrägen · Pult = eine Schräge · Walm = rundum schräg · Flach = nahezu eben.' })}
        {sel({ label: 'Eindeckung', path: 'u_werte.dach.eindeckung_material' as Path, current: u.dach?.eindeckung_material, values: DACH_EINDECKUNG_WERTE, labels: EINDECKUNG_LABEL, notizPath: 'u_werte.dach.eindeckung_notiz' as Path,
          help: 'Was liegt oben drauf: Ton-/Betonziegel, Blech, Schiefer? Von außen erkennbar.' })}
        {jaNein({ label: 'Unterspannbahn vorhanden?', path: 'u_werte.dach.unterspannbahn_vorhanden' as Path, current: u.dach?.unterspannbahn_vorhanden, help: 'Folie direkt unter den Ziegeln – vom Dachboden aus sichtbar. Im Zweifel: Nein.' })}
        {sel({ label: 'Zwischensparren-Dämmstoff', path: 'u_werte.dach.zwischensparren_daemmstoff_typ' as Path, current: u.dach?.zwischensparren_daemmstoff_typ, values: DAEMMSTOFF_TYP_WERTE, labels: DAEMM_LABEL, notizPath: 'u_werte.dach.daemmstoff_notiz' as Path,
          help: 'Dämmung ZWISCHEN den Dachbalken (Sparren) – vom Dachboden aus sichtbar/tastbar.' })}
        <div className="grid grid-cols-2 gap-3">
          {num({ label: 'Zwischensparren', path: 'u_werte.dach.zwischensparren_cm' as Path, min: 0, max: 50, unit: 'cm', help: 'Dicke zwischen den Sparren – am Dachboden messen.' })}
          {num({ label: 'Dämmjahr', path: 'u_werte.dach.zwischensparren_jahr' as Path, min: 1900, max: 2100, help: 'Jahr der Dachdämmung – aus Rechnung/Energieausweis.' })}
        </div>
        {sel({ label: 'Aufdach-Dämmstoff', path: 'u_werte.dach.aufdach_daemmstoff_typ' as Path, current: u.dach?.aufdach_daemmstoff_typ, values: DAEMMSTOFF_TYP_WERTE, labels: DAEMM_LABEL,
          help: 'Dämmung OBERHALB der Sparren (von außen, unter den Ziegeln). Meist nur bei neueren Sanierungen – sonst „Keine".' })}
        <div className="grid grid-cols-3 gap-3">
          {num({ label: 'Aufdach', path: 'u_werte.dach.aufdach_cm' as Path, min: 0, max: 50, unit: 'cm', help: 'Dicke der Aufdach-Dämmung.' })}
          {num({ label: 'Dämmjahr', path: 'u_werte.dach.aufdach_jahr' as Path, min: 1900, max: 2100 })}
          {num({ label: 'Untersparren', path: 'u_werte.dach.untersparren_cm' as Path, min: 0, max: 30, unit: 'cm', help: 'Zusätzliche Dämmung UNTER den Sparren (raumseitig). Material = wie Zwischensparren (Standard-Annahme der Schätzung). Falls abweichend, bitte oben unter „Bemerkungen" notieren.' })}
        </div>
        {jaNein({ label: 'Dampfsperre vorhanden?', path: 'u_werte.dach.dampfsperre_vorhanden' as Path, current: u.dach?.dampfsperre_vorhanden, help: 'Folie raumseitig unter der Dämmung. Im Zweifel: Nein.' })}
        {u.dach?.dachtyp === 'flachdach' && (
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3">
            {sel({ label: 'Abdichtung', path: 'u_werte.dach.flachdach_abdichtung' as Path, current: u.dach?.flachdach_abdichtung, values: FLACHDACH_ABDICHTUNG_WERTE, labels: ABDICHTUNG_LABEL,
              help: 'Dachhaut: Bitumen = schwarze Bahnen · PVC/TPO = Kunststoff-Folie.' })}
            {num({ label: 'Gefälle', path: 'u_werte.dach.flachdach_gefaelle_prozent' as Path, min: 0, max: 45, unit: '%', help: 'Leichte Neigung, meist 2–5 %.' })}
          </div>
        )}
        {sel({ label: 'Angabe geprüft per', path: 'u_werte.dach.geprueft_per' as Path, current: u.dach?.geprueft_per, values: GEPRUEFT_PER_WERTE, labels: GEPRUEFT_LABEL, help: GEPRUEFT_HELP })}
        {foto('dachaufbau')}
      </fieldset>

      {/* === Bodenplatte / Kellerdecke === */}
      <fieldset className="rounded-xl border border-border p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Bodenplatte / Kellerdecke *</legend>
        {sel({ label: 'Art *', path: 'u_werte.unten.art' as Path, current: u.unten?.art, values: BODEN_ART_WERTE, labels: BODEN_LABEL,
          help: 'Liegt der Boden direkt auf dem Erdreich (Bodenplatte) oder ist darunter ein Keller? Keller beheizt oder kalt? Im Keller von unten an die Decke schauen.' })}
        {sel({ label: 'Dämmstoff', path: 'u_werte.unten.daemmung_typ' as Path, current: u.unten?.daemmung_typ, values: DAEMMSTOFF_TYP_WERTE, labels: DAEMM_LABEL, notizPath: 'u_werte.unten.daemmung_notiz' as Path,
          help: 'Dämmung unter dem Estrich oder an der Kellerdecke. Oft nur aus Bauunterlagen bekannt – sonst „Keine"/abgeleitet.' })}
        <div className="grid grid-cols-2 gap-3">
          {num({ label: 'Dämmdicke', path: 'u_werte.unten.daemmung_cm' as Path, min: 0, max: 40, unit: 'cm', help: 'An der Kellerdecke messen, falls sichtbar.' })}
          {num({ label: 'Dämmjahr', path: 'u_werte.unten.daemmung_jahr' as Path, min: 1900, max: 2100 })}
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />Boden ist oft nicht einsehbar – dann „Kundenangabe" bzw. „Aus Baualter abgeleitet" wählen.</p>
        {sel({ label: 'Angabe geprüft per', path: 'u_werte.unten.geprueft_per' as Path, current: u.unten?.geprueft_per, values: GEPRUEFT_PER_WERTE, labels: GEPRUEFT_LABEL, help: GEPRUEFT_HELP })}
        {foto('bodenaufbau')}
      </fieldset>

      {/* === Fenster === */}
      <fieldset className="rounded-xl border border-border p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Fenster</legend>
        <p className="text-xs text-muted-foreground">Die Verglasung (1-/2-/3-fach) wird oben in den Gebäudedaten erfasst.</p>
        {jaNein({ label: 'Fenster schon getauscht?', path: 'u_werte.fenster.getauscht' as Path, current: u.fenster?.getauscht, help: 'Wurden die Fenster nach dem Hausbau erneuert? Neuere Fenster haben meist 2-/3-fach-Glas und Abstandhalter mit Jahreszahl im Glasrand.' })}
        {u.fenster?.getauscht === true && (
          <div className="space-y-4 rounded-lg bg-muted/40 p-3">
            <div className="grid grid-cols-2 gap-3">
              {num({ label: 'Tauschjahr *', path: 'u_werte.fenster.tausch_jahr' as Path, min: 1900, max: 2100, help: 'Einbaujahr der neuen Fenster – aus der Rechnung oder der Jahreszahl im Glas-Randverbund.' })}
              {num({ label: 'U-Wert (falls bekannt)', path: 'u_werte.fenster.u_wert' as Path, min: 0.4, max: 3.0, step: 0.1, unit: 'W/m²K', help: 'Steht auf dem Datenblatt/der Rechnung der Fenster. Unbekannt → leer.' })}
            </div>
            {sel({ label: 'Rahmenmaterial', path: 'u_werte.fenster.rahmenmaterial' as Path, current: u.fenster?.rahmenmaterial, values: RAHMENMATERIAL_WERTE, labels: RAHMEN_LABEL, notizPath: 'u_werte.fenster.rahmen_notiz' as Path,
              help: 'Material des Fensterrahmens (Kunststoff/Holz/Aluminium/Holz-Alu).' })}
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />Bitte die <strong>Originalrechnung/Datenblatt</strong> der Fenster als Foto-Nachweis aufnehmen.</p>
            {foto('fenster_originalrechnung')}
          </div>
        )}
      </fieldset>

      {/* === Anbau === */}
      <fieldset className="rounded-xl border border-border p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Anbau</legend>
        {jaNein({ label: 'Gibt es einen Anbau (anderes Baujahr/Material)?', path: 'u_werte.anbau.vorhanden' as Path, current: u.anbau?.vorhanden, help: 'Ein später angebauter Gebäudeteil (z. B. Wintergarten, Erweiterung) – meist mit anderem Baujahr und anderem Wandaufbau.' })}
        {u.anbau?.vorhanden === true && (
          <div className="space-y-4 rounded-lg bg-muted/40 p-3">
            {num({ label: 'Anbau-Baujahr *', path: 'u_werte.anbau.baujahr' as Path, min: 1900, max: 2100, help: 'In welchem Jahr wurde der Anbau errichtet?' })}
            {sel({ label: 'Anbau-Mauerwerk *', path: 'u_werte.anbau.wand.mauerwerk_material' as Path, current: u.anbau?.wand?.mauerwerk_material, values: MAUERWERK_MATERIAL_WERTE, labels: MATERIAL_LABEL, notizPath: 'u_werte.anbau.wand.mauerwerk_notiz' as Path,
              help: 'Material der Anbau-Außenwand (gleiche Erkennung wie oben).' })}
            <div className="grid grid-cols-3 gap-3">
              {num({ label: 'Mauerwerk', path: 'u_werte.anbau.wand.mauerwerk_cm' as Path, min: 0, max: 100, unit: 'cm' })}
              {num({ label: 'Dämmdicke', path: 'u_werte.anbau.wand.daemmstoff_cm' as Path, min: 0, max: 50, unit: 'cm' })}
              {num({ label: 'Dämmjahr', path: 'u_werte.anbau.wand.daemmstoff_jahr' as Path, min: 1900, max: 2100 })}
            </div>
            {sel({ label: 'Anbau-Dämmstoff', path: 'u_werte.anbau.wand.daemmstoff_typ' as Path, current: u.anbau?.wand?.daemmstoff_typ, values: DAEMMSTOFF_TYP_WERTE, labels: DAEMM_LABEL, notizPath: 'u_werte.anbau.wand.daemmstoff_notiz' as Path })}
            <div className="space-y-1.5">
              <Label htmlFor="anbau_raeume">Welche Räume gehören zum Anbau?</Label>
              <Input id="anbau_raeume" {...register('u_werte.anbau.betroffene_raeume_notiz' as Path)} disabled={disabled} placeholder="z. B. Wohnzimmer, Küche im EG" />
              {hilfe('Diese Räume bekommen in autarc später eigene U-Werte (je Raum manuell eintragen).')}
            </div>
            <p className="flex items-start gap-1.5 text-xs text-amber-600"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />Für die Anbau-Räume müssen die abweichenden U-Werte <strong>manuell in autarc</strong> je Raum eingetragen werden (die API übernimmt keine U-Werte).</p>
          </div>
        )}
      </fieldset>

      {/* === Haftungs-Bestätigung === */}
      <div className="rounded-xl border-2 border-amber-400/50 bg-amber-50 p-4 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 h-4 w-4" disabled={disabled}
            checked={values.u_werte_haftung_bestaetigt === true}
            onChange={(e) => set('u_werte_haftung_bestaetigt' as Path, e.target.checked)} />
          <span className="text-xs text-amber-900 leading-relaxed">
            Ich bestätige im Namen des Kunden, dass die Angaben zur Gebäudehülle (Material, Dämmung, Jahr) nach bestem
            Wissen <strong>korrekt</strong> sind. Mir ist bewusst, dass diese Werte die <strong>Heizlast und die
            Auslegung der Wärmepumpe</strong> bestimmen. Als „abgeleitet" gekennzeichnete Werte beruhen auf einer
            Schätzung aus dem Baualter.
          </span>
        </label>
        <p className="text-xs text-amber-700/80 pl-7">Die Rechtsverbindlichkeit dieser Klausel wird separat geprüft (Anwalt/DSB).</p>
      </div>
    </div>
  );
}
