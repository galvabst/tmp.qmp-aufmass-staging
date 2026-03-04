

# Pflicht-Videos: Trainer-Bypass mit "Auch für Trainer"-Option

## Konzept

Aktuell sehen Trainer alle Pflicht-Videos (Bug). Lösung: Trainer standardmäßig von Pflicht-Videos befreien, aber pro Lektion eine neue Option "Auch für Trainer" anbieten (z.B. für Fehlerprotokolle, Neuerungen).

## Änderungen

### 1. DB-Migration
- `ALTER TABLE thermocheck.contractor_akademie_lektionen ADD COLUMN IF NOT EXISTS auch_fuer_trainer BOOLEAN NOT NULL DEFAULT false;`
- `admin_upsert_akademie_lektion` RPC um `auch_fuer_trainer` erweitern

### 2. Admin-UI: LektionEditor
- Neuer Toggle **"Auch für Trainer"** unterhalb des "Nur für neue Onboarder"-Toggles
- Beschreibung: "Wenn aktiv, müssen auch Trainer dieses Pflicht-Video anschauen"
- Nur sichtbar wenn `nurFuerNeue === false` (nur bei Pflicht-Videos relevant)

### 3. usePflichtVideos Hook
- Neuer Parameter `isTrainer: boolean`
- Wenn `isTrainer === true`: nur Lektionen mit `auch_fuer_trainer = true` laden
- Wenn `isTrainer === false`: wie bisher alle Pflicht-Lektionen laden
- Feld `auch_fuer_trainer` in die Query aufnehmen und filtern

### 4. Index.tsx
- `isTrainer`-Flag aus `onboardingRecord?.is_trainer` an `usePflichtVideos` durchreichen

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration SQL | Spalte + RPC-Update |
| `LektionEditor.tsx` | Neuer Toggle |
| `useAdminMutateLektion.ts` | Feld im Interface |
| `useAdminAkademieModule.ts` | Feld im AdminLektion-Type |
| `usePflichtVideos.ts` | Trainer-Filter-Logik |
| `Index.tsx` | isTrainer durchreichen |

