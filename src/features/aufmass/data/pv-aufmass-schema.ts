import { z } from 'zod';

/** Zod schema for PV-Aufmass draft saving (all optional) */
export const pvAufmassDraftSchema = z.object({
  // Allgemein
  solarthermie_vorhanden: z.boolean().optional(),
  denkmalschutz: z.enum(['denkmalschutz', 'ensembleschutz', 'nein']).optional(),
  lagermoeglichkeit: z.boolean().optional(),
  lagermoeglichkeit_beschreibung: z.string().optional(),

  // Dach
  dachform: z.string().optional(),
  dachausrichtung: z.string().optional(),
  dachneigung: z.number().optional(),
  sparrenabstand: z.string().optional(),
  trapezdach: z.boolean().optional(),
  trapezdach_art: z.string().optional(),
  attika_vorhanden: z.boolean().optional(),
  attika_masse: z.string().optional(),
  aufdachdaemmung: z.boolean().optional(),
  aufdachdaemmung_dicke: z.number().optional(),
  thermodach: z.boolean().optional(),

  // Dachziegel
  ziegel_lose: z.enum(['ja', 'nein', 'nicht_erkennbar']).optional(),
  dacheindeckung_art: z.string().optional(),
  ziegel_neigung: z.enum(['positiv', 'negativ']).optional(),
  ziegel_neigung_grad: z.number().optional(),

  // Gerüst
  hindernisse_vorhanden: z.boolean().optional(),
  fassade_gedaemmt: z.boolean().optional(),
  fassade_daemmung_dicke: z.string().optional(),
  oeffentliche_flaeche: z.boolean().optional(),

  // DC-Kabelführung
  dc_fassade_moeglich: z.boolean().optional(),
  dc_dachhaut_moeglich: z.boolean().optional(),
  dc_ueber_10m: z.boolean().optional(),
  module_gleiches_gebaeude: z.boolean().optional(),
  gebaeude_entfernung: z.number().optional(),

  // Unterkonstruktion
  verschattungen_vorhanden: z.boolean().optional(),
  verschattungen_beschreibung: z.string().optional(),
  belueftungsrohre: z.boolean().optional(),

  // Blitzschutz
  blitzschutz_vorhanden: z.boolean().optional(),
  hauszufuehrung: z.enum(['keller', 'freileitung']).optional(),
  blitzschutz_geprueft: z.boolean().optional(),
  blitzschutz_abbaubar: z.boolean().optional(),

  // Abschluss
  pv_kommentar: z.string().optional(),
  pv_bestaetigung: z.boolean().optional(),
  pv_unterschrift: z.string().optional(),
});

export type PvAufmassDraftData = z.infer<typeof pvAufmassDraftSchema>;

/** DB field names for the PV formular */
export const PV_FORM_DB_FIELDS = Object.keys(pvAufmassDraftSchema.shape) as (keyof PvAufmassDraftData)[];
