

# Plan: 6 neue Felder im Aufstellort-Schritt (SOOH-Formular)

## Analyse abgeschlossen

**DB-Ist-Zustand geprüft:** Die 6 neuen Spalten existieren noch nicht. Bestehende RLS-Policies (`auth_insert_vot`, `auth_select_vot`, `auth_update_vot`) erlauben allen authentifizierten Usern Zugriff -- neue Spalten werden automatisch abgedeckt, keine Policy-Änderung nötig.

**Schema-Architektur geprüft:** `FORM_DB_FIELDS` wird automatisch aus `aufmassDraftSchema.shape` abgeleitet -- neue Felder im Draft-Schema werden sofort in den Auto-Save-Payload aufgenommen. Kein manuelles Mapping nötig.

**Auto-Save geprüft:** Der 2-Minuten-Silent-Save in `AufmassFormPage.tsx` ruft `form.getValues()` auf und übergibt alles an `useUpsertVotFormular`. Neue Felder fließen automatisch mit, solange sie im Zod-Schema stehen.

**Keine Altdaten-Migration nötig:** Alle 6 Spalten sind nullable. Bestehende Formulare behalten `null`-Werte, das UI zeigt leere Felder.

---

## Umsetzung (3 Dateien + 1 Migration)

### 1. DB-Migration
```sql
ALTER TABLE thermocheck.thermocheck_vot_formulare
  ADD COLUMN distanz_ausseneinheit_kernloch numeric,
  ADD COLUMN distanz_kernloch_innengeraet numeric,
  ADD COLUMN anzahl_durchbrueche_kernloch integer,
  ADD COLUMN aufstellort_aenderung boolean,
  ADD COLUMN distanz_alter_neuer_aufstellort numeric,
  ADD COLUMN raumscan_url text;
```

### 2. Zod-Schema (`aufmass-schema.ts`)

**Draft-Schema** -- 6 neue optionale Felder:
- `distanz_ausseneinheit_kernloch: z.number().min(0).optional()`
- `distanz_kernloch_innengeraet: z.number().min(0).optional()`
- `anzahl_durchbrueche_kernloch: z.number().int().min(0).optional()`
- `aufstellort_aenderung: z.boolean().optional()`
- `distanz_alter_neuer_aufstellort: z.number().min(0).optional()`
- `raumscan_url: z.string().url().optional().or(z.literal(''))`

**Submit-Schema** -- 3 Distanzfelder + `aufstellort_aenderung` required, `distanz_alter_neuer_aufstellort` conditional in `superRefine`:
```typescript
if (data.aufstellort_aenderung === true && !data.distanz_alter_neuer_aufstellort) {
  ctx.addIssue({ code: 'custom', path: ['distanz_alter_neuer_aufstellort'], message: 'Distanz erforderlich bei Aufstellort-Änderung' });
}
```
`raumscan_url` bleibt optional (kein Pflichtfeld bei Einreichung).

### 3. UI (`AufstellortSection.tsx`)

Vor dem Kundenbestätigungs-Block (Zeile 93) einfügen:

1. **Distanz-Eingabefelder** (3 Stück):
   - "Distanz Außeneinheit → Kernlochbohrung (m)" -- `type="number"` step="0.1"
   - "Distanz Kernlochbohrung → Innengerät (m)" -- `type="number"` step="0.1"
   - "Anzahl Durchbrüche (Kernloch → Innengerät)" -- `type="number"` step="1"

2. **Aufstellort-Änderung** (Ja/Nein-Toggle im bestehenden Button-Pattern):
   - Bei Ja: Meterfeld "Distanz alter → neuer Aufstellort (m)" einblenden
   - Bei Nein: Feld ausblenden

3. **Raumscan-URL**:
   - `type="url"` Input mit Placeholder "https://..."
   - Wenn bereits gespeichert: als klickbarer Link (`target="_blank"`) daneben anzeigen

### 4. Types (`types.ts`)
Wird automatisch nach Migration aktualisiert -- keine manuelle Bearbeitung.

---

## Edge Cases geprüft

| Szenario | Ergebnis |
|---|---|
| Bestehende Formulare ohne neue Felder | OK -- nullable Spalten, UI zeigt leer |
| Auto-Save mit leeren neuen Feldern | OK -- `null` wird gespeichert, kein DB-Fehler |
| `aufstellort_aenderung = false` → Distanzfeld leer | OK -- Submit-Validation überspringt das Feld |
| `aufstellort_aenderung = true` → Distanzfeld leer | Submit blockiert mit Fehlermeldung |
| `raumscan_url` mit ungültigem Format im Draft | OK -- Draft erlaubt leeren String, Submit validiert nicht (optional) |
| `raumscan_url` mit ungültigem Format bei manueller URL-Validation | Zod `.url()` mit `.or(z.literal(''))` erlaubt leer oder valide URL |
| isReadOnly (abgeschlossenes Formular) | OK -- `disabled` Prop wird durchgereicht |

## Rollen-Matrix

Keine Änderung nötig. Die RLS-Policies `auth_insert_vot`, `auth_select_vot`, `auth_update_vot` prüfen nur `auth.uid() IS NOT NULL` (= jeder eingeloggte User). Neue Spalten werden von denselben Policies abgedeckt. Keine neuen Tabellen, keine neuen Zugriffsmuster.

