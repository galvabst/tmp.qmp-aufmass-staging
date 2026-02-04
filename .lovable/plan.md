

# Bereinigungsplan: Altlasten, Duplikate & Dead Code entfernen

## Übersicht

Das System enthält Überreste aus der Prototyp-Phase die nie aufgeräumt wurden:
- Storage Bucket mit Dummy-Ordnern (Videos kommen jetzt von Bunny)
- Doppelte Datenbank-Tabellen für Akademie und Onboarding
- ~270 Zeilen Mock-Daten im Code die echte DB-Daten überschreiben
- Dead Code für Supabase Storage Video-Handling

---

## Phase 1: Storage Bucket bereinigen

### Was wird gelöscht

| Resource | Inhalt | Grund |
|----------|--------|-------|
| Bucket `akademie-videos` | 1 Dummy-Placeholder | Videos kommen von Bunny Stream, Bucket unbenutzt |

### SQL-Migration

```sql
-- Alle Objekte im akademie-videos Bucket löschen
DELETE FROM storage.objects WHERE bucket_id = 'akademie-videos';

-- Bucket selbst löschen
DELETE FROM storage.buckets WHERE id = 'akademie-videos';
```

---

## Phase 2: Dead Code entfernen

### Dateien löschen

| Datei | Zeilen | Grund |
|-------|--------|-------|
| `src/hooks/useSignedVideoUrl.ts` | 91 | Supabase Storage URLs nicht mehr genutzt |

### Code-Änderungen

**Datei:** `src/components/akademie/MultiSourceVideoPlayer.tsx`

Entfernen:
- Import von `useSignedVideoUrl` (Zeile 3)
- `SupabaseStoragePlayer` Component (Zeilen 117-153)
- Case `'supabase-storage'` im Switch (Zeilen 184-185)
- `'supabase-storage'` aus `detectVideoSource` Funktion (Zeilen 28-31)

---

## Phase 3: Legacy Datenbank-Tabellen löschen

### Übersicht der Duplikate

```text
┌─────────────────────────────────────────────────────────────────┐
│                    AKADEMIE CONTENT                              │
├─────────────────────────────────────────────────────────────────┤
│  LEGACY (löschen)              │  SSOT (behalten)               │
│  public.onboarding_akademie_   │  thermocheck.techniker_        │
│    hauptmodule (4 rows)        │    akademie_module (13 rows)   │
│    unterpunkte (16 rows)       │    akademie_lektionen (52 rows)│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TECHNIKER ONBOARDING                          │
├─────────────────────────────────────────────────────────────────┤
│  LEGACY (löschen)              │  SSOT (behalten)               │
│  thermocheck.techniker_        │  thermocheck.contractor_       │
│    onboarding (1 row)          │    onboarding (1 row)          │
└─────────────────────────────────────────────────────────────────┘
```

### SQL-Migration

```sql
-- 1. Legacy Akademie-Tabellen (public schema)
DROP TABLE IF EXISTS public.onboarding_akademie_unterpunkte CASCADE;
DROP TABLE IF EXISTS public.onboarding_akademie_hauptmodule CASCADE;

-- 2. Legacy Onboarding-Tabelle (thermocheck schema)
DROP TABLE IF EXISTS thermocheck.techniker_onboarding CASCADE;

-- 3. Bereits markierte Tabelle
DROP TABLE IF EXISTS thermocheck.ideen_to_be_deleted CASCADE;

-- 4. Leere/unbenutzte Tabellen aufräumen
DROP TABLE IF EXISTS thermocheck.academy_module CASCADE;
DROP TABLE IF EXISTS thermocheck.contractor_academy_progress CASCADE;
DROP TABLE IF EXISTS thermocheck.contractor_coaching CASCADE;
DROP TABLE IF EXISTS thermocheck.contractor_compliance CASCADE;

-- 5. Legacy RPC-Funktionen löschen
DROP FUNCTION IF EXISTS thermocheck_create_techniker_onboarding;
DROP FUNCTION IF EXISTS thermocheck_get_techniker_onboarding;
DROP FUNCTION IF EXISTS thermocheck_update_techniker_onboarding;
DROP FUNCTION IF EXISTS thermocheck_delete_techniker_onboarding;
```

---

## Phase 4: Code Cleanup - Mock Daten entfernen

### Datei: `src/lib/onboarding-config.ts`

**Aktion:** `MOCK_AKADEMIE_HAUPTMODULE` (~270 Zeilen) durch leeres Array ersetzen

```typescript
// Zeile 177-445: Kompletten Mock löschen und ersetzen durch:
export const MOCK_AKADEMIE_HAUPTMODULE: AkademieHauptmodul[] = [];
```

### Datei: `src/hooks/useAkademieContent.ts`

**Aktion:** Legacy-Fallback Logik entfernen (Zeilen 178-216 und 266-297)

Vorher:
```typescript
// Fallback: Try legacy public schema tables
try {
  const { data: hauptmodule } = await supabase
    .from('onboarding_akademie_hauptmodule')
    // ... 30+ Zeilen Legacy-Code
}
```

Nachher:
```typescript
// Kein Legacy-Fallback mehr - thermocheck ist SSOT
console.warn('[Akademie] No data found in thermocheck schema');
return [];
```

---

## Phase 5: Frontend-Integration fixen

### Datei: `src/components/OnboardingScreen.tsx`

**Problem:** Nutzt `state.akademieHauptmodule` (Mock) statt DB

**Lösung:**

```typescript
// Import hinzufügen
import { useAkademieContent } from '@/hooks/useAkademieContent';

// Im Component Body
const { data: dbAkademie, isLoading: isAkademieLoading } = useAkademieContent();

// An AcademyStep übergeben (ca. Zeile 239)
<AcademyStep
  hauptmodule={dbAkademie || []}  // DB statt Mock
  onCompleteUnterpunkt={...}
  isAkademieComplete={...}
/>
```

---

## Zusammenfassung

| Phase | Aktion | Zeilen/Objekte |
|-------|--------|----------------|
| 1 | Storage Bucket löschen | 1 Bucket + Dummy-Dateien |
| 2 | Dead Code entfernen | ~130 Zeilen |
| 3 | Legacy DB-Tabellen löschen | 7 Tabellen + 4 Funktionen |
| 4 | Mock-Daten entfernen | ~300 Zeilen |
| 5 | Frontend fixen | ~10 Zeilen ändern |

**Ergebnis nach Umsetzung:**
- Klare Single Source of Truth (thermocheck Schema)
- Videos werden aus DB geladen (Bunny URLs)
- Kein Dead Code für Supabase Storage
- Keine verwirrenden Duplikate

