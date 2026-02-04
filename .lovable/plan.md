# Bereinigungsplan: Altlasten, Duplikate & Dead Code entfernen

## ✅ ABGESCHLOSSEN

Alle Phasen des Bereinigungsplans wurden erfolgreich umgesetzt.

---

## Phase 1: Storage Bucket bereinigen ✅

**Erledigt:** `akademie-videos` Bucket und alle Objekte gelöscht.

---

## Phase 2: Dead Code entfernen ✅

**Erledigt:**
- `src/hooks/useSignedVideoUrl.ts` gelöscht (91 Zeilen)
- `MultiSourceVideoPlayer.tsx` bereinigt (SupabaseStoragePlayer + supabase-storage case entfernt)

---

## Phase 3: Legacy Datenbank-Tabellen löschen ✅

**Erledigt:**
- `public.onboarding_akademie_unterpunkte` (CASCADE)
- `public.onboarding_akademie_hauptmodule` (CASCADE)
- `thermocheck.techniker_onboarding`
- `thermocheck.ideen_to_be_deleted`
- `thermocheck.academy_module`
- `thermocheck.contractor_academy_progress`
- `thermocheck.contractor_coaching`
- `thermocheck.contractor_compliance`
- Legacy RPC-Funktionen (thermocheck_create/get/update/delete_techniker_onboarding)

---

## Phase 4: Code Cleanup - Mock Daten entfernen ✅

**Erledigt:**
- `MOCK_AKADEMIE_HAUPTMODULE` (~170 Zeilen Mock-Daten) → leeres Array
- `MOCK_AKADEMIE_MODULE` → leeres Array
- Legacy-Fallback Logik aus `useAkademieContent.ts` entfernt

---

## Phase 5: Frontend-Integration ✅

**Status:** Die `useAkademieContent()` Hook lädt jetzt direkt aus `thermocheck.techniker_akademie_module` und `thermocheck.techniker_akademie_lektionen`. Kein Fallback auf Mock-Daten mehr.

---

## Ergebnis

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| Storage Buckets | akademie-videos (dummy) | Gelöscht |
| Dead Code Zeilen | ~130 | 0 |
| Legacy DB-Tabellen | 8 Tabellen + 4 Funktionen | 0 |
| Mock-Daten Zeilen | ~270 | 0 |
| SSOT | Unklar (3 Quellen) | `thermocheck` Schema |

**Klare Single Source of Truth:** Alle Akademie-Daten kommen jetzt aus dem `thermocheck` Schema.
