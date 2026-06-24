import { yearFromIsoDate, type AufmassDraftData } from './aufmass-schema';

/**
 * Mapping Aufmaß-Formular → autarc-Gebäudedaten (read-only Vorschau + später
 * Edge-Function-Sync). Reine Funktion, keine Seiteneffekte.
 *
 * Quelle der Wahrheit für die autarc-Felder: openapi.json (BaseProject).
 * autarc nimmt nur Gebäude-/Projektdaten — KEINE Räume/Fotos/U-Werte.
 *
 * `source`:
 *  - direct  = 1:1 aus einem Formularfeld
 *  - derived = aus einem Formularfeld umgerechnet (z. B. Datum → Baualtersklasse)
 *  - missing = autarc-Feld, das das Formular HEUTE nicht erfasst (Gap)
 */

export type MappingSource = 'direct' | 'derived' | 'missing';

export interface AutarcFieldMapping {
  autarcField: string;
  label: string;
  value: string | number | boolean | null;
  source: MappingSource;
  /** Herkunft/Hinweis, z. B. "aus bauantrag_datum" oder "Feld fehlt im Formular". */
  note?: string;
}

export interface AutarcMappingResult {
  fields: AutarcFieldMapping[];
  /** Nur die befüllbaren Felder (direct + derived) — das wäre das PATCH-Payload. */
  payload: Record<string, unknown>;
  filledCount: number;
  totalCount: number;
}

// --- Ableitungen ---------------------------------------------------------

/** Baujahr → autarc Baualtersklasse (BaseProject.buildingAge). */
export function deriveBuildingAge(year: number | null): string | null {
  if (year == null || Number.isNaN(year)) return null;
  if (year >= 2002) return 'from2002';
  if (year >= 1995) return 'from1995To2001';
  if (year >= 1984) return 'from1984To1994';
  if (year >= 1979) return 'from1979To1983';
  if (year >= 1969) return 'from1969To1978';
  if (year >= 1958) return 'from1958To1968';
  if (year >= 1949) return 'from1949To1957';
  if (year >= 1919) return 'from1919To1948';
  return 'before1918';
}

/** Inbetriebnahme-Jahr → autarc Heizungs-Baujahrklasse. */
export function deriveHeatingConstructionYear(year: number | null): string | null {
  if (year == null || Number.isNaN(year)) return null;
  if (year < 1980) return 'before1980';
  if (year <= 1995) return 'between1980And1995';
  return 'after1995';
}

/** heizungsart (Formular) → autarc currentHeatingSystemType. */
function mapHeatingType(art: string | undefined): string | null {
  switch (art) {
    case 'gas': return 'gas';
    case 'oel': return 'oil';
    case 'sonstige': return 'districtOrOther';
    default: return null;
  }
}

/** heizkoerper_typ (Formular) → autarc roomHeatingType. */
function mapRoomHeating(typ: string | undefined): string | null {
  switch (typ) {
    case 'heizkoerper': return 'radiator';
    case 'fussbodenheizung': return 'floor';
    case 'beides': return 'floorAndRadiator';
    default: return null;
  }
}

/** gebaeudetyp (Formular) → autarc buildingType. */
function mapBuildingType(t: string | undefined): string | null {
  switch (t) {
    case 'einfamilienhaus': return 'singleOrDoubleFamilyHouse';
    case 'doppelhaushaelfte': return 'semiDetachedHouse';
    case 'reihenhaus': return 'terracedHouse';
    case 'reihenendhaus': return 'endTerracedHouse';
    case 'mehrfamilienhaus': return 'multiFamilyHouse';
    case 'gewerbe': return 'commercialBuilding';
    default: return null;
  }
}

/** rohrsystem (Formular) → autarc pipeSystemType. */
function mapPipeSystem(r: string | undefined): string | null {
  switch (r) {
    case 'einrohr': return 'singlePipeHeating';
    case 'zweirohr': return 'twoPipeHeating';
    case 'unbekannt': return 'unknown';
    default: return null;
  }
}

/** verglasung (Formular) → autarc windowGlazingType. */
function mapGlazing(g: string | undefined): string | null {
  switch (g) {
    case 'einfach': return 'single';
    case 'zweifach': return 'double';
    case 'dreifach': return 'triple';
    case 'zweifach_waermeschutz': return 'doubleWithThermalInsulation';
    case 'dreifach_waermeschutz': return 'tripleWithThermalInsulation';
    default: return null;
  }
}

const boolOrNull = (b: unknown): boolean | null => (b == null ? null : Boolean(b));

// --- Hauptfunktion -------------------------------------------------------

export function mapAufmassToAutarc(values: Partial<AufmassDraftData>): AutarcMappingResult {
  // Direkt auf dem typisierten Wert arbeiten (kein `as Record<string, any>`): so
  // fängt der Compiler Tippfehler in Feldnamen, statt sie still zu undefined → null
  // in der autarc-Payload werden zu lassen. Alle Felder existieren auf AufmassDraftData.
  const v = values;
  const fields: AutarcFieldMapping[] = [];

  const add = (
    autarcField: string,
    label: string,
    value: AutarcFieldMapping['value'],
    source: MappingSource,
    note?: string,
  ) => fields.push({ autarcField, label, value, source, note });

  // -- direkt mappbar (Gebäudedaten-Sektion) --
  add('buildingType', 'Gebäudetyp', mapBuildingType(v.gebaeudetyp), 'direct', 'aus gebaeudetyp');
  add('heatedLivingAreaM2', 'Beheizte Wohnfläche (m²)', v.beheizte_wohnflaeche_m2 ?? null, 'direct', 'aus beheizte_wohnflaeche_m2');
  add('numberOfResidents', 'Bewohnerzahl', v.anzahl_bewohner ?? null, 'direct', 'aus anzahl_bewohner');
  add('numberOfFloors', 'Etagen', v.anzahl_etagen ?? null, 'direct', 'aus anzahl_etagen');
  add('isMonumentProtected', 'Denkmalschutz', boolOrNull(v.hat_denkmalschutz), 'direct', 'aus hat_denkmalschutz');
  add('averageEnergyConsumptionLast3Years', 'Verbrauch (3-Jahres-Schnitt)', v.durchschnittsverbrauch_3_jahre ?? null, 'direct', 'aus durchschnittsverbrauch_3_jahre');
  add('isFacadeInsulated', 'Fassade gedämmt', boolOrNull(v.fassade_gedaemmt), 'direct', 'aus fassade_gedaemmt');
  add('isRoofInsulated', 'Dach gedämmt', boolOrNull(v.dach_gedaemmt), 'direct', 'aus dach_gedaemmt');
  add('pipeSystemType', 'Rohrsystem', mapPipeSystem(v.rohrsystem), 'direct', 'aus rohrsystem');
  add('windowGlazingType', 'Verglasung', mapGlazing(v.verglasung), 'direct', 'aus verglasung');
  add('hasFireplace', 'Kamin', boolOrNull(v.hat_kamin), 'direct', 'aus hat_kamin');
  add('hasSolarThermalSystem', 'Solarthermie', boolOrNull(v.hat_solarthermie), 'direct', 'aus hat_solarthermie');
  add('currentHeatingSystemType', 'Heizsystem-Typ', mapHeatingType(v.heizungsart), 'direct', 'aus heizungsart');
  add('roomHeatingType', 'Raumheizung', mapRoomHeating(v.heizkoerper_typ), 'direct', 'aus heizkoerper_typ');

  // -- abgeleitet --
  const baujahr = yearFromIsoDate(v.bauantrag_datum);
  add('buildingAge', 'Baualtersklasse', deriveBuildingAge(baujahr), 'derived',
    baujahr ? `aus Baujahr ${baujahr}` : 'aus bauantrag_datum (fehlt)');

  const heizungsjahr = yearFromIsoDate(v.heizung_inbetriebnahme_datum);
  add('currentHeatingSystemConstructionYear', 'Heizungs-Baujahr', deriveHeatingConstructionYear(heizungsjahr), 'derived',
    heizungsjahr ? `aus Inbetriebnahme ${heizungsjahr}` : 'aus heizung_inbetriebnahme_datum (fehlt)');

  const zirk = v.anschluss_zirkulation_vorhanden;
  add('drinkingWaterHeatingSystemType', 'Warmwasser', zirk == null ? null : (zirk ? 'withCirculation' : 'withoutCirculation'),
    'derived', 'aus anschluss_zirkulation_vorhanden');

  // Nur ENDLICHE Zahlen — NaN/Infinity dürfen nicht in den heatingCircuits-Payload
  // (JSON.stringify(NaN)="null" → autarc bekäme still einen leeren Wert). Der Submit-
  // Pfad ist via Schema .finite() schon geschützt; dies härtet auch den Preview-Pfad.
  const finit = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
  const vl = finit(v.vorlauftemperatur);
  const rl = finit(v.ruecklauftemperatur);
  add('heatingCircuits', 'Heizkreis (Vor-/Rücklauf)', (vl != null && rl != null) ? `VL ${vl} / RL ${rl} °C` : null,
    'derived', 'aus vorlauftemperatur/ruecklauftemperatur');

  // Payload = nur befüllte (direct+derived mit Wert). heatingCircuits als autarc-Struktur.
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    // Jede NICHT-ENDLICHE Zahl ausschließen (NaN, Infinity, -Infinity) — ein solcher
    // Wert darf kein autarc-Feld befüllen (JSON.stringify(NaN/Infinity)="null" →
    // autarc bekäme still einen leeren Wert). Gilt für ALLE Zahlenfelder (z. B.
    // numberOfResidents, averageEnergyConsumptionLast3Years), nicht nur Vor-/Rücklauf.
    const istNichtEndlicheZahl = typeof f.value === 'number' && !Number.isFinite(f.value);
    if (f.source !== 'missing' && f.value != null && !istNichtEndlicheZahl && f.autarcField !== 'heatingCircuits') {
      payload[f.autarcField] = f.value;
    }
  }
  if (vl != null && rl != null) {
    // index 1-basiert: die echte autarc-Konvention nummeriert „Heizkreis 1" als
    // index:1 (real verifiziert 2026-06-21, alle Bestandsprojekte). index:0 würde
    // beim Readback nicht auf den von autarc renummerierten Kreis matchen und einen
    // Phantom-„Heizkreis fehlt" auslösen. Der Diff hat zusätzlich einen Einzelkreis-
    // Positions-Fallback, falls autarc doch abweichend nummeriert.
    payload.heatingCircuits = [{ name: 'Heizkreis 1', flowTemperature: vl, returnTemperature: rl, index: 1 }];
  }

  const totalCount = fields.length;
  const filledCount = fields.filter(f => f.value != null).length;

  return { fields, payload, filledCount, totalCount };
}
