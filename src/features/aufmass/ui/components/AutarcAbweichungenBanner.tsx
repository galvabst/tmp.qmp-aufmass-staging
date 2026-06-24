import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { GateResult } from '../../data/autarc-gate';
import type { AutarcDiffEntry } from '../../data/autarc-diff';

interface Props {
  /** Das autarc-Gate-Urteil nach dem Einreichen (oder null). */
  result: GateResult | null;
  /** „Verstanden" → schließt den Banner und navigiert zurück. */
  onClose: () => void;
}

/**
 * Deutsche Labels für die autarc-Feldnamen (camelCase aus aufmass-to-autarc.ts).
 * Ohne diese Übersetzung steht im Banner roher englischer camelCase, mit dem ein
 * Techniker vor Ort nichts anfangen kann. Unbekannte Felder fallen auf den rohen
 * Namen zurück (kein stiller Verlust).
 */
const AUTARC_FELD_LABELS: Record<string, string> = {
  buildingType: 'Gebäudetyp',
  heatedLivingAreaM2: 'Beheizte Wohnfläche (m²)',
  numberOfResidents: 'Bewohnerzahl',
  numberOfFloors: 'Etagen',
  isMonumentProtected: 'Denkmalschutz',
  averageEnergyConsumptionLast3Years: 'Verbrauch (3-Jahres-Schnitt)',
  isFacadeInsulated: 'Fassade gedämmt',
  isRoofInsulated: 'Dach gedämmt',
  pipeSystemType: 'Rohrsystem',
  windowGlazingType: 'Verglasung',
  hasFireplace: 'Kamin',
  hasSolarThermalSystem: 'Solarthermie',
  currentHeatingSystemType: 'Heizsystem-Typ',
  roomHeatingType: 'Raumheizung',
  buildingAge: 'Baualtersklasse',
  currentHeatingSystemConstructionYear: 'Baujahr Heizung',
  drinkingWaterHeatingSystemType: 'Warmwasser',
  heatingCircuits: 'Heizkreis (Vor-/Rücklauf)',
};

/**
 * Deutsche Klartext-Werte für die autarc-Enum-Strings (aus den map*-Funktionen in
 * aufmass-to-autarc.ts). So sieht der Techniker „Einfamilienhaus" statt
 * „singleOrDoubleFamilyHouse". Nur Enum-Strings; Zahlen/Booleans werden in
 * `wertLesbar` direkt formatiert.
 */
const AUTARC_WERT_LABELS: Record<string, string> = {
  // buildingType
  singleOrDoubleFamilyHouse: 'Ein-/Zweifamilienhaus',
  semiDetachedHouse: 'Doppelhaushälfte',
  terracedHouse: 'Reihenhaus',
  endTerracedHouse: 'Reihenendhaus',
  multiFamilyHouse: 'Mehrfamilienhaus',
  commercialBuilding: 'Gewerbe',
  // pipeSystemType
  singlePipeHeating: 'Einrohrsystem',
  twoPipeHeating: 'Zweirohrsystem',
  unknown: 'unbekannt',
  // windowGlazingType
  single: 'Einfachverglasung',
  double: 'Zweifachverglasung',
  triple: 'Dreifachverglasung',
  doubleWithThermalInsulation: 'Zweifach-Wärmeschutz',
  tripleWithThermalInsulation: 'Dreifach-Wärmeschutz',
  // currentHeatingSystemType
  gas: 'Gas',
  oil: 'Öl',
  districtOrOther: 'Fernwärme/Sonstige',
  // roomHeatingType
  radiator: 'Heizkörper',
  floor: 'Fußbodenheizung',
  floorAndRadiator: 'Fußboden + Heizkörper',
  // buildingAge (Baualtersklassen)
  before1918: 'vor 1918',
  from1919To1948: '1919–1948',
  from1949To1957: '1949–1957',
  from1958To1968: '1958–1968',
  from1969To1978: '1969–1978',
  from1979To1983: '1979–1983',
  from1984To1994: '1984–1994',
  from1995To2001: '1995–2001',
  from2002: 'ab 2002',
  // currentHeatingSystemConstructionYear
  before1980: 'vor 1980',
  between1980And1995: '1980–1995',
  after1995: 'nach 1995',
  // drinkingWaterHeatingSystemType
  withCirculation: 'mit Zirkulation',
  withoutCirculation: 'ohne Zirkulation',
};

/** Menschenlesbarer Klartext für einen gesendeten/empfangenen autarc-Wert. */
function wertLesbar(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'boolean') return v ? 'ja' : 'nein';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return AUTARC_WERT_LABELS[v] ?? (v === '' ? '(leer)' : v);
  // Strukturen (z. B. heatingCircuits-Array) kompakt als JSON — selten, aber kein Crash.
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Eine Abweichung in Klartext: was gesendet wurde vs. was in autarc ankam. */
function zeile(a: AutarcDiffEntry): string {
  const feld = AUTARC_FELD_LABELS[a.feld] ?? a.feld;
  if (a.art === 'fehlt') {
    return `${feld}: in autarc NICHT angekommen (gesendet: ${wertLesbar(a.gesendet)})`;
  }
  return `${feld}: gesendet ${wertLesbar(a.gesendet)} → in autarc ${wertLesbar(a.autarc)}`;
}

/**
 * Persistenter Soll-Ist-Banner: zeigt dem Techniker nach dem Einreichen, WELCHE
 * Gebäudedaten nicht korrekt in autarc angekommen sind (Feld für Feld). Ohne das
 * verpufft die autarc-Abweichung in einem Toast — der Techniker sieht nicht, was
 * konkret klemmt. Nur sichtbar bei status='abweichung' mit konkreter Diff-Liste.
 */
export function AutarcAbweichungenBanner({ result, onClose }: Props) {
  if (!result || result.status !== 'abweichung' || !result.abweichungen?.length) return null;
  const abw = result.abweichungen;

  return (
    <Alert variant="destructive" className="border-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        autarc-Abgleich: {abw.length} Abweichung{abw.length === 1 ? '' : 'en'} gefunden
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-xs leading-relaxed">
          Die Gebäudedaten sind nicht korrekt in autarc angekommen. Das Aufmaß ist gespeichert,
          aber diese Felder bitte prüfen (sie bestimmen die Heizlast / WP-Auslegung):
        </p>
        <ul className="text-[11px] font-mono space-y-1 max-h-48 overflow-auto rounded bg-background/50 p-2">
          {abw.map((a, i) => (
            <li key={`${a.feld}-${i}`}>• {zeile(a)}</li>
          ))}
        </ul>
        <Button type="button" size="sm" variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Verstanden — zurück zur Übersicht
        </Button>
      </AlertDescription>
    </Alert>
  );
}
