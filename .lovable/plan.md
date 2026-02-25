

# Plan: Aufmass-Formular reparieren – Schema-Fix, Pre-Fill, Upload-Fix

## Root-Cause-Analyse (aus Network Logs verifiziert)

### Problem 1: Formular laedt ewig / zeigt falsche Daten
**Ursache**: Alle Supabase-Client-Anfragen an `v_thermocheck_auftraege` und `thermocheck_vot_formulare` senden `Accept-Profile: public` statt `Accept-Profile: thermocheck`. Die `.setHeader('Accept-Profile', 'thermocheck')` Aufrufe werden vom Supabase JS Client **ignoriert**, weil sie NACH `.maybeSingle()` bzw `.single()` aufgerufen werden – zu diesem Zeitpunkt ist der Query bereits gebaut.

**Beweis aus Network Logs:**
```
GET /rest/v1/v_thermocheck_auftraege → 404
Response: "Could not find the table 'public.v_thermocheck_auftraege'"

GET /rest/v1/thermocheck_vot_formulare → 404  
Response: "Could not find the table 'public.thermocheck_vot_formulare'"
```

Beide Tabellen existieren nur im `thermocheck`-Schema (DB-verifiziert).

### Problem 2: Name/Telefon nicht pre-filled
**Ursache**: Code prueft `user_metadata.full_name` und `user_metadata.phone`, aber die tatsaechlichen JWT-Felder heissen `name` und `telefon`:
```json
// Tatsaechliche user_metadata:
{"name": "Artur Penner", "telefon": "+49 1512 9559457", "vorname": "Artur", "nachname": "Penner"}
```

### Problem 3: Kundenname zeigt "Unbekannt"
**Ursache**: Da die Auftrag-Daten nicht laden (Problem 1), greift der Fallback: `kundenName = 'Unbekannt'`.

### Problem 4: Bilder koennen nicht hochgeladen werden
**Zwei Ursachen:**
1. `votFormularId` ist `undefined` (weil der Formular-Query scheitert → Problem 1), deshalb sind Upload-Buttons disabled (`disabled={!votFormularId}`)
2. **Fehlende Storage RLS Policy**: Der `galvanikbau` Bucket hat **keine INSERT-Policy** fuer `storage.objects`. SELECT, UPDATE, DELETE existieren – aber INSERT fehlt komplett.

### Problem 5: ThermoCheck-Datum nicht pre-filled
**Ursache**: Kein Code zum Pre-Fill. Das Datum kann aus den `thermocheck_terminvorschlaege` (angenommener Termin) abgeleitet werden, oder direkt als Tagesdatum gesetzt werden.

---

## Loesung

### Fix 1: Dedizierter Supabase Client fuer thermocheck-Schema

Neuer Client `supabaseTC` der mit `db: { schema: 'thermocheck' }` konfiguriert wird. Dies ist der saubere Ansatz – keine fragilen `.setHeader()`-Aufrufe mehr.

**Neue Datei**: `src/integrations/supabase/thermocheck-client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseTC = createClient(
  SUPABASE_URL, SUPABASE_KEY,
  { db: { schema: 'thermocheck' }, auth: { ... } }
);
```

**Betroffene Hooks (alle `setHeader` entfernen, `supabaseTC` nutzen):**
- `useVotFormular.ts` – alle Queries + Mutations
- `useVotBilder.ts` – alle Queries + Mutations (Metadata-Teil)
- `AufmassFormPage.tsx` – Auftrag-Query

### Fix 2: Pre-Fill Techniker-Daten korrigieren

In `AufmassFormPage.tsx`, Zeile 80-85:
```typescript
// VORHER (falsche Keys):
meta?.full_name  →  meta?.name
meta?.phone      →  meta?.telefon
```

Zusaetzlich: `thermocheck_datum` mit heutigem Datum pre-fillen falls leer.

### Fix 3: Storage INSERT Policy anlegen

SQL Migration:
```sql
CREATE POLICY "galvanikbau_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'galvanikbau' AND auth.uid() IS NOT NULL
  );
```

### Fix 4: Kundenname aus Auftrag-Daten

Loest sich automatisch sobald Fix 1 greift – die Auftrag-Daten laden dann korrekt mit `kunde_vorname`/`kunde_nachname` aus der View.

---

## Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/integrations/supabase/thermocheck-client.ts` | **NEU** – Supabase Client mit `schema: 'thermocheck'` |
| `src/features/aufmass/hooks/useVotFormular.ts` | `supabase` → `supabaseTC`, alle `.setHeader()` entfernen |
| `src/features/aufmass/hooks/useVotBilder.ts` | `supabase` → `supabaseTC` fuer DB-Queries (Storage bleibt bei normalem Client) |
| `src/features/aufmass/ui/AufmassFormPage.tsx` | Auftrag-Query auf `supabaseTC`, Pre-Fill Keys korrigieren, Datum-Prefill |
| SQL Migration | Storage INSERT Policy fuer `galvanikbau` Bucket |

---

## Edge Cases

| Szenario | Handling |
|---|---|
| `supabaseTC` Auth-Session | Teilt sich `localStorage` mit dem Haupt-Client → gleiche Session, kein doppeltes Login |
| Formular existiert noch nicht | `votFormularId` bleibt `undefined` bis erstes Speichern → Upload erst nach erstem "Speichern" moeglich. Das ist korrekt, da die Bilder eine FK-Referenz zum Formular brauchen |
| user_metadata fehlt komplett | Optional Chaining greift, Felder bleiben leer |
| Auftrag-ID existiert nicht | Query gibt `null` zurueck, Skeleton bleibt stehen (bestehendes Verhalten) |
| Concurrent Upload | `upsert: true` in Storage verhindert Konflikte |

## Rollen-Matrix

| Aktion | Authentifizierter User | Unauthentifiziert |
|---|---|---|
| SELECT thermocheck_vot_formulare | Ja (RLS: `true`) | Nein |
| INSERT thermocheck_vot_formulare | Ja (RLS: auth check) | Nein |
| Storage INSERT galvanikbau | Ja (nach Fix) | Nein |
| Storage SELECT galvanikbau | Ja (RLS: `auth.uid() IS NOT NULL`) | Nein |

## Keine Datenmigration noetig
Die Tabellen sind korrekt, die Daten existieren. Nur der Zugriffspfad (Schema-Header) war falsch.

