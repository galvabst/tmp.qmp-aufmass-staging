

# Plan: Phase 2 — PV-Aufmass UI Sections + Dynamischer Stepper

## Zusammenfassung

Wenn der Techniker bei "Haben Sie bereits eine PV-Anlage?" auf **Nein** klickt, werden 8 zusaetzliche PV-Formular-Schritte dynamisch zwischen dem PV-Anlage-Step und dem Abschluss-Step eingefuegt. Die Daten werden in die separate `thermocheck_pv_formulare`-Tabelle geschrieben. Bilder landen im gleichen Kundenordner unter PV-spezifischen Kategorien (z.B. `pv_dach`, `pv_drohne`).

## Architektur-Entscheidung

```text
Stepper-Logik: DYNAMISCHE Steps statt statischer Liste

hat_pv_anlage = true oder undefined:
  Steps 0-13 (THC) → 14 Abschluss = 15 Steps total

hat_pv_anlage = false:
  Steps 0-13 (THC) → 14-21 (PV Sections) → 22 Abschluss = 23 Steps total
```

Der Stepper bekommt die Step-Liste als Prop statt als Konstante. AufmassFormPage berechnet die Steps dynamisch basierend auf `hat_pv_anlage`.

## Storage-Struktur

PV-Bilder landen im **gleichen Kundenordner**, da die `buildImageStoragePath`-Funktion bereits die Kategorie im Dateinamen nutzt:

```text
operations/leads/{lead_name}_{lead_id}/thermocheck-auftrag_{auftrag_id}/
  ├── heizungsraum_001.jpg          (THC)
  ├── pv_dach_001.jpg               (PV — NEU)
  ├── pv_drohne_001.jpg             (PV — NEU)
  └── pv_blitzschutz_001.jpg        (PV — NEU)
```

Kein separater PV-Unterordner noetig — die Kategorie-Prefixe (`pv_*`) trennen die Bilder bereits sauber.

## Aenderungen

### 1. AufmassFormStepper.tsx — Steps als Prop

- `STEPS` wird nicht mehr als Konstante definiert, sondern als Prop `steps: StepConfig[]` an den Stepper uebergeben
- `totalSteps`, Progress, Dots — alles dynamisch basierend auf `steps.length`
- Keine Aenderung an der Render-Logik (weiterhin `renderStep(currentStep)`)

### 2. AufmassFormPage.tsx — Dynamische Step-Berechnung + PV-Form

Groesste Aenderung. Hier passiert die Orchestrierung:

- **Zweites Form-Objekt**: `pvForm = useForm<PvAufmassDraftData>()` fuer PV-Daten
- **PV-Formular laden**: `usePvFormular(votFormularId)` + `useUpsertPvFormular()` fuer CRUD
- **Auto-Create PV-Formular**: Wenn `hat_pv_anlage === false` und kein PV-Record existiert, wird automatisch einer erstellt (gleiche Logik wie beim VOT-Formular)
- **Steps dynamisch berechnen**: `useMemo` das die Step-Liste + renderStep-Map basierend auf `hatPv` berechnet:

```text
const BASE_STEPS = Steps 0-13 (wie bisher)
const PV_STEPS = [
  { title: 'PV: Allgemein', icon: '☀️' },
  { title: 'PV: Dach', icon: '🏠' },
  { title: 'PV: Dachziegel', icon: '🧱' },
  { title: 'PV: Gerüst', icon: '🏗️' },
  { title: 'PV: DC-Kabelführung', icon: '🔌' },
  { title: 'PV: Unterkonstruktion', icon: '📐' },
  { title: 'PV: Blitzschutz', icon: '⚡' },
  { title: 'PV: Abschluss', icon: '✍️' },
]
const ABSCHLUSS_STEP = { title: 'Abschluss', icon: '✍️' }

steps = hatPv === false
  ? [...BASE_STEPS, ...PV_STEPS, ABSCHLUSS_STEP]
  : [...BASE_STEPS, ABSCHLUSS_STEP]
```

- **renderStep** wird ebenfalls dynamisch: Die PV-Steps rendern PV-Section-Komponenten mit `pvForm` statt `form`
- **handleSaveDraft**: Speichert **beide** Formulare (VOT + PV wenn aktiv)
- **handleSubmit**: Reicht **beide** ein

### 3. Acht neue PV-Section-Komponenten

Alle unter `src/features/aufmass/ui/sections/pv/`:

| Datei | Felder | Fotos |
|---|---|---|
| `PvAllgemeinSection.tsx` | solarthermie_vorhanden, denkmalschutz (3-way enum), lagermoeglichkeit + beschreibung | — |
| `PvDachSection.tsx` | dachform, dachausrichtung, dachneigung, sparrenabstand, trapezdach + art, attika + masse, aufdachdaemmung + dicke, thermodach | pv_dach, pv_drohne, pv_sparrenabstand |
| `PvDachziegelSection.tsx` | ziegel_lose (3-way), dacheindeckung_art, ziegel_neigung + grad | pv_dachziegel |
| `PvGeruestSection.tsx` | hindernisse_vorhanden, fassade_gedaemmt + dicke, oeffentliche_flaeche | pv_hindernisse, pv_geruest_oeffentlich |
| `PvDcKabelSection.tsx` | dc_fassade_moeglich, dc_dachhaut_moeglich, dc_ueber_10m, module_gleiches_gebaeude + entfernung | — |
| `PvUnterkonstruktionSection.tsx` | verschattungen_vorhanden + beschreibung, belueftungsrohre | — |
| `PvBlitzschutzSection.tsx` | blitzschutz_vorhanden, hauszufuehrung, blitzschutz_geprueft, blitzschutz_abbaubar | pv_blitzschutz |
| `PvAbschlussSection.tsx` | pv_kommentar, pv_bestaetigung, pv_unterschrift (SignatureField) | — |

Jede Section bekommt:
- `pvForm: UseFormReturn<PvAufmassDraftData>` (statt `form`)
- `bilder, votFormularId, leadName, leadId, auftragId, disabled` (gleiche shared props)

Die UI-Patterns sind identisch zu den bestehenden THC-Sections: Ja/Nein-Toggles, bedingte Felder, PhotoUploadField mit den neuen `pv_*`-Kategorien.

### 4. PvAnlageSection.tsx — Anpassung

Aktuell zeigt die Section bei `hatPv === true` den Foto-Upload. Die Logik fuer `hatPv === false` (= PV-Steps anzeigen) wird **nicht** in dieser Section behandelt, sondern im Stepper/Page. Die Section bleibt schlank — sie ist nur die Ja/Nein-Frage + ggf. Foto-Upload bei "Ja".

Kleine Ergaenzung: Bei "Nein" wird ein Hinweistext angezeigt: "Das PV-Aufmass-Formular wird in den naechsten Schritten erfasst."

### 5. Keine DB-Migration noetig

Die Tabelle `thermocheck_pv_formulare` existiert bereits mit allen Feldern. Die Bild-Kategorien sind in `bild-kategorien.ts` bereits definiert. Der Hook `usePvFormular` + `useUpsertPvFormular` existiert bereits.

## Technische Details

**Stepper-Reset bei Toggle**: Wenn der Techniker `hat_pv_anlage` von `false` auf `true` wechselt (oder umgekehrt), aendert sich die Step-Anzahl. Der Stepper muss pruefen, ob `currentStep` noch gueltig ist, und ggf. auf den letzten gueltigen Step zurueckspringen.

**PV-Bilder Storage**: Die `PhotoUploadField`-Komponente funktioniert ohne Aenderung — sie nutzt `buildImageStoragePath(leadName, leadId, auftragId, kategorie, ...)`, und die PV-Kategorien (`pv_dach` etc.) sind bereits im Type definiert. Die Bilder landen automatisch im richtigen Ordner.

**Zwei Form-Instanzen**: `form` (THC) und `pvForm` (PV) sind getrennte `useForm`-Instanzen. Das vermeidet Schema-Konflikte und haelt die Datenlogik sauber. Beim Speichern werden beide sequentiell upserted.

## Dateien die erstellt/geaendert werden

| Aktion | Datei |
|---|---|
| Aendern | `src/features/aufmass/ui/AufmassFormStepper.tsx` |
| Aendern | `src/features/aufmass/ui/AufmassFormPage.tsx` |
| Aendern | `src/features/aufmass/ui/sections/PvAnlageSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvAllgemeinSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvDachSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvDachziegelSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvGeruestSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvDcKabelSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvUnterkonstruktionSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvBlitzschutzSection.tsx` |
| Erstellen | `src/features/aufmass/ui/sections/pv/PvAbschlussSection.tsx` |

Insgesamt 11 Dateien (3 geaendert, 8 neu erstellt).

