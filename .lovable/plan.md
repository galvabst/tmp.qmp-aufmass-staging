

# Fix: PV-Formular — Upload, Datenpersistenz, HEIC-Block, Bewertungsnachweis

## Identifizierte Probleme

### 1. Formulardaten gehen verloren (kritisch)
**Ursache:** In `AufmassFormPage.tsx` Zeile 136 filtert die Prefill-Logik mit `key in form.getValues()` — aber `defaultValues: {}` enthält keine Keys, daher werden DB-Werte nie in das Formular geladen.

**Fix:** `form.reset()` direkt mit den DB-Daten aufrufen, wie es bei `pvForm` bereits korrekt gemacht wird:
```ts
form.reset({ ...form.getValues(), ...f });
// statt der fehlerhaften Key-Filterung
```

### 2. Bewertungsnachweis zeigt alle Bilder
**Ursache:** `AbschlussSection.tsx` Zeile 48 übergibt `existingBilder={bilder}` (alle Bilder des Formulars) statt nach Kategorie zu filtern.

**Fix:** `filterBilderByKategorie(bilder, 'bewertung_nachweis')` verwenden.

### 3. HEIC-Dateien blockieren
**Ursache:** `PhotoUploadField` prüft nur `file.type.startsWith('image/')` — HEIC-Dateien (`image/heic`, `image/heif`) passieren diese Prüfung. Außerdem können HEIC-Dateien manchmal einen leeren `type` haben (iOS).

**Fix:** In `PhotoUploadField.tsx` explizite Prüfung auf Dateiendung `.heic` und `.heif` hinzufügen + `accept`-Attribut der Inputs einschränken (ohne HEIC).

### 4. PV-Bilder in eigenem Unterordner
**Ursache:** Alle Bilder (THC + PV) landen aktuell im selben `thermocheck-auftrag_{id}/` Ordner.

**Fix:** `storage-path.ts` erweitern: Neue Funktion `buildPvImageStoragePath` die den Pfad `operations/leads/{name}_{leadId}/thermocheck-auftrag_{auftragId}/pv-auftrag/{kategorie}_{nr}_{ts}.{ext}` erzeugt. PV-Kategorien (prefix `pv_`) nutzen diesen neuen Pfad automatisch.

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/features/aufmass/ui/AufmassFormPage.tsx` | Prefill-Logik fixen (Zeile 131-141) |
| `src/features/aufmass/ui/sections/AbschlussSection.tsx` | `existingBilder` filtern auf `bewertung_nachweis` |
| `src/features/aufmass/ui/components/PhotoUploadField.tsx` | HEIC blockieren + `accept` ohne HEIC |
| `src/features/aufmass/data/storage-path.ts` | `buildPvImageStoragePath` für PV-Unterordner |
| `src/features/aufmass/hooks/useVotBilder.ts` | PV-Kategorien automatisch in PV-Pfad routen |

