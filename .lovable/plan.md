

# Plan: PV-Aufmass-Formular als bedingtes Zusatzmodul + Kamera-Fix

## Status-Update: Was jetzt funktioniert

Die Network Logs beweisen, dass die vorherigen Fixes greifen:

| Problem | Status | Beweis |
|---|---|---|
| Kundenname "Unbekannt" | GELOEST | URL `cb4f5fa5` = auftragId "Toni Vogler", Query gibt Daten zurueck (200) |
| Auto-Create Formular | GELOEST | POST `thermocheck_vot_formulare` → 201, ID `55feddc1-...` erstellt |
| Upload-Buttons disabled | GELOEST | votFormularId existiert, Buttons sollten aktiv sein |
| Kamera oeffnet File-Picker | ERWARTET | `capture="environment"` wird nur auf echten Mobilgeraeten (iPhone/Android) honoriert. Im Lovable Desktop-Preview oeffnet der Browser immer den File-Picker — das ist Standard-Browser-Verhalten, kein Bug |

## Zwei separate Themen

### Thema 1: Kamera-Button UX-Verbesserung (klein)

Der aktuelle Kamera-Button nutzt bereits `input.capture = 'environment'` (Zeile 185 in PhotoUploadField). Auf echten Mobilgeraeten oeffnet das die Kamera. Im Desktop-Preview ist das technisch nicht moeglich ohne `getUserMedia()` + eigene Video-UI.

Empfehlung: Kein Code-Change noetig. Der Button funktioniert korrekt auf dem Zielgeraet (Handy des Technikers). Im Desktop-Preview ist die Datei-Auswahl das erwartete Fallback.

### Thema 2: PV-Aufmass-Formular (gross — neues Feature)

Der User hat ein umfangreiches PV-Formular als Referenz gezeigt. Dieses soll als **bedingte Erweiterung** des bestehenden ThermoCheck-Formulars erscheinen, wenn der Kunde bei "Haben Sie bereits eine PV-Anlage?" mit **Nein** antwortet.

Das PV-Formular umfasst laut Referenz ca. 25-30 Felder in ~8 Abschnitten:

```text
ThermoCheck-Formular (15 Schritte, existiert)
    ↓
Step 13: "Haben Sie bereits eine PV-Anlage?"
    ├── Ja → Foto-Upload der bestehenden PV (existiert)
    └── Nein → PV-Aufmass-Formular (NEU, ~8 zusaetzliche Steps)
        ├── Allgemein (Solarthermie, Denkmalschutz, Lager)
        ├── Dach (Form, Neigung, Ausrichtung, Sparren)
        ├── Dachziegel (Typ, Bilder vorne/hinten, Neigung)
        ├── Gerüst (Hindernisse, Fassade, oeffentl. Flaeche)
        ├── DC-Kabelfuehrung (Fassade, Dachhaut, >10m)
        ├── Unterkonstruktion (Verschattung, Belueftung)
        ├── Blitzschutz (vorhanden, geprueft, abbaubar)
        └── PV-Abschluss (Kommentar, Bestaetigung, Unterschrift)
```

### Kritische Fragen fuer die Implementation

Bevor ich das PV-Formular baue, muss ich folgendes klaeren:

**1. Datenbankstruktur**: Die bestehende `thermocheck_vot_formulare` hat ~30 Spalten fuer das THC-Formular. Das PV-Formular bringt ~25-30 weitere Felder. Optionen:
- **Option A**: Eigene Tabelle `thermocheck_pv_formulare` (1:1 zu `thermocheck_vot_formulare`) — sauber getrennt, eigene Validierung
- **Option B**: Spalten in `thermocheck_vot_formulare` ergaenzen — einfacher, aber Tabelle wird gross (60+ Spalten)

**2. Bild-Kategorien**: Das PV-Formular braucht neue Bild-Kategorien:
- `pv_dach` (Bilder vom Dach)
- `pv_drohne` (Drohnenfotos)
- `pv_sparrenabstand` (Messung)
- `pv_dachziegel` (vorne/hinten)
- `pv_hindernisse` (Geruest-Hindernisse)
- `pv_geruest_oeffentlich` (oeffentl. Flaeche)
- `pv_blitzschutz` (Blitzschutzanlage)

**3. Stepper-Logik**: Wenn `hat_pv_anlage === false`, muessen die PV-Steps dynamisch nach Step 13 eingefuegt werden. Die Step-Anzahl im Header wechselt von 15 auf ~23.

**4. Feldliste aus der Referenz** (zu validieren):

| Abschnitt | Felder |
|---|---|
| Allgemein | solarthermie_vorhanden (bool), denkmalschutz (enum: denkmal/ensemble/nein), lagermoeglichkeit (bool), lagermoeglichkeit_beschreibung (text) |
| Dach | dachform (enum), dachausrichtung (text), dachneigung (number), sparrenabstand (text), trapezdach (bool), trapezdach_art (text), attika_vorhanden (bool), attika_masse (text), aufdachdaemmung (bool), aufdachdaemmung_dicke (number), thermodach (bool) |
| Dachziegel | ziegel_lose (enum: ja/nein/nicht_erkennbar), dacheindeckung_art (text), ziegel_neigung (enum: positiv/negativ), ziegel_neigung_grad (number) |
| Geruest | hindernisse_vorhanden (bool), fassade_gedaemmt (bool), fassade_daemmung_dicke (text), oeffentliche_flaeche (bool) |
| DC-Kabel | dc_fassade_moeglich (bool), dc_dachhaut_moeglich (bool), dc_ueber_10m (bool), module_gleiches_gebaeude (bool), gebaeude_entfernung (number) |
| Unterkonstruktion | verschattungen_vorhanden (bool), verschattungen_beschreibung (text), belueftungsrohre (bool), blitzschutz_vorhanden (bool), hauszufuehrung (enum: keller/freileitung), blitzschutz_geprueft (bool), blitzschutz_abbaubar (bool) |
| Abschluss | pv_kommentar (text), pv_bestaetigung (bool), pv_unterschrift (storage path) |

Das sind ~30 neue Felder + 7 neue Bild-Kategorien.

### Empfohlene Phased-Approach

**Phase 1** (dieser Prompt): DB-Migration + Bild-Kategorien + Schema
- Neue Tabelle `thermocheck.thermocheck_pv_formulare` mit allen Feldern
- Neue Bild-Kategorien in `bild-kategorien.ts`
- Zod-Schema `pv-aufmass-schema.ts`
- RLS Policies (gleich wie VOT: authenticated INSERT/SELECT)

**Phase 2** (naechster Prompt): UI Sections + Stepper-Integration
- 8 neue Section-Komponenten unter `src/features/aufmass/ui/sections/pv/`
- Dynamischer Stepper der PV-Steps zeigt wenn `hat_pv_anlage === false`
- Hook `useVotPvFormular` fuer CRUD

**Phase 3**: Validierung + Edge Cases + Tests

### Risiko-Analyse

| Risiko | Bewertung | Mitigation |
|---|---|---|
| Formular wird zu lang (23 Steps) | Mittel | Klare visuelle Trennung "THC Teil" vs "PV Teil" im Stepper |
| DB-Tabelle zu breit | Gering | Eigene Tabelle `pv_formulare` vermeidet das |
| Storage-Pfad-Konsistenz | Gering | Gleicher Bucket, gleiche Ordnerstruktur |
| Stepper-Performance | Gering | Lazy-Rendering ist bereits implementiert |

Soll ich mit Phase 1 (DB + Schema + Kategorien) starten, oder moechtest du erst die Feldliste validieren/korrigieren?

