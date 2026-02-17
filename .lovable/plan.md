
## Masterplan: FK-Konsistenz fuer zugewiesener_techniker_id (= contractor_onboarding.id)

### Root Cause Analyse

Seit der letzten Migration speichert `zugewiesener_techniker_id` korrekt die `contractor_onboarding.id` (z.B. `643d967e...`). Aber mehrere Hooks und die `book_coaching_ride` RPC behandeln diesen Wert noch als `profile_id` (z.B. `c0893b68...`). Das fuehrt dazu, dass:

1. **Coaching-Step leer bleibt** - `useAvailableCoachingRides` vergleicht `zugewiesener_techniker_id` gegen Trainer-`profile_id`s -- MATCH UNMOEGLICH
2. **Buchungen leer bleiben** - bereits gefixt in `useMyAssignedOrders`, aber die RPC `book_coaching_ride` wuerde bei Buchung scheitern
3. **Trainer-Profil-Aufloesung fehlschlaegt** - Hooks verwenden `zugewiesener_techniker_id` direkt als `profiles.id` Lookup

### Betroffene Stellen (5 Fixes)

#### Fix 1: RPC `book_coaching_ride` (SQL-Migration)

3 fehlerhafte Stellen:

| Zeile (logisch) | Aktuell (FALSCH) | Korrektur |
|---|---|---|
| Trainer-Check | `WHERE profile_id = v_auftrag.zugewiesener_techniker_id` | `WHERE id = v_auftrag.zugewiesener_techniker_id` |
| Trainer-Name | `FROM public.profiles WHERE id = v_auftrag.zugewiesener_techniker_id` | Erst `contractor_onboarding.profile_id` aufloesen, dann profiles |
| Trainer-Video/Bio lookup | Implizit ueber profile_id | Nicht betroffen (separate Query) |

Neue RPC-Logik:
```sql
-- Trainer-Check: id statt profile_id
IF NOT EXISTS (
  SELECT 1 FROM thermocheck.contractor_onboarding
  WHERE id = v_auftrag.zugewiesener_techniker_id AND is_trainer = true
) THEN ...

-- Trainer-Name: ueber contractor_onboarding aufloesen
SELECT p.vorname, p.nachname
INTO v_trainer_vorname, v_trainer_nachname
FROM thermocheck.contractor_onboarding co
JOIN public.profiles p ON p.id = co.profile_id
WHERE co.id = v_auftrag.zugewiesener_techniker_id;
```

#### Fix 2: Hook `useAvailableCoachingRides` (src/hooks/useCoachingSlots.ts)

**Problem**: Laedt Trainer-`profile_id`s und filtert Auftraege mit `.in('zugewiesener_techniker_id', trainerProfileIds)`. Da `zugewiesener_techniker_id` jetzt `contractor_onboarding.id` ist, matched nichts.

**Loesung**: Trainer-`contractor_onboarding.id`s verwenden statt `profile_id`s:

1. Trainer laden: `select('id, profile_id, trainer_video_url, trainer_bio').eq('is_trainer', true)` -- `id` ist jetzt der Schluesselbegriff
2. Auftraege filtern: `.in('zugewiesener_techniker_id', trainerOnboardingIds)` -- mit den `id`s filtern
3. Profile aufloesen: Ueber den Trainer-Map `contractorId -> profile_id -> profiles`-Lookup statt direkt `zugewiesener_techniker_id` als profile_id zu verwenden

#### Fix 3: Hook `useMyBookedRide` (src/hooks/useCoachingSlots.ts)

**Problem**: `profiles.eq('id', auftrag.zugewiesener_techniker_id)` -- falscher ID-Typ.
Und: `contractor_onboarding.eq('profile_id', auftrag.zugewiesener_techniker_id)` -- sucht profile_id mit contractor_onboarding.id.

**Loesung**:
1. Erst `contractor_onboarding` laden mit `.eq('id', auftrag.zugewiesener_techniker_id)` um `profile_id` zu bekommen
2. Dann `profiles` mit der aufgeloesten `profile_id` laden

#### Fix 4: Keine Code-Aenderung noetig

- `usePoolOrders`: Filtert `zugewiesener_techniker_id=is.null` -- korrekt
- `useMyAssignedOrders`: Bereits gefixt (Lookup contractor_onboarding.id)
- `accept_pool_order` RPC: Bereits gefixt (Lookup contractor_onboarding.id)

#### Fix 5: Daten-Validierung

- Auftrag `c9f59cdc` hat `zugewiesener_techniker_id = 643d967e` (contractor_onboarding.id) -- KORREKT
- 1 Terminvorschlag existiert (datum `2026-02-26`) -- moeglicherweise muessen 2 weitere angelegt werden fuer den 3-Proposal-Pattern
- `coaching_gebucht_von` ist NULL -- bereit zur Buchung

### Aenderungs-Matrix

| Datei/Objekt | Aenderung | Typ |
|---|---|---|
| `book_coaching_ride` RPC | 3 Stellen: id statt profile_id fuer Trainer-Lookup | SQL-Migration |
| `src/hooks/useCoachingSlots.ts` | `useAvailableCoachingRides`: Trainer-IDs = contractor_onboarding.id statt profile_id; Profile-Aufloesung ueber Map | Code |
| `src/hooks/useCoachingSlots.ts` | `useMyBookedRide`: contractor_onboarding Lookup per id statt profile_id | Code |

### Datenfluss nach Fix

```text
Coaching-Step (Trainee sieht verfuegbare Rides):
  1. contractor_onboarding WHERE is_trainer=true -> [{ id: "643d967e", profile_id: "c0893b68" }]
  2. thermocheck_auftraege WHERE zugewiesener_techniker_id IN ("643d967e") -> Treffer!
  3. profiles WHERE id = "c0893b68" (aufgeloest ueber contractor_onboarding) -> Trainer-Name

Bookings-Tab (Techniker sieht eigene Buchungen):
  1. contractor_onboarding WHERE profile_id = auth.uid() -> { id: "643d967e" }
  2. v_thermocheck_auftraege WHERE zugewiesener_techniker_id = "643d967e" -> Treffer!
  (Bereits gefixt)

book_coaching_ride RPC:
  1. thermocheck_auftraege WHERE id = p_auftrag_id -> zugewiesener_techniker_id = "643d967e"
  2. contractor_onboarding WHERE id = "643d967e" AND is_trainer = true -> Treffer!
  3. profiles JOIN contractor_onboarding ON profile_id WHERE co.id = "643d967e" -> Trainer-Name
```

### Edge Cases

- Kein Trainer existiert: leerer Coaching-Step wie bisher (Empty State)
- Trainer hat keinen Auftrag zugewiesen: kein Match, leerer State
- Trainee bucht und dann wird contractor_onboarding geloescht: FK CASCADE wuerde greifen
- Mehrere Trainer: Jeder hat eigene contractor_onboarding.id, alle werden korrekt aufgeloest
- `book_coaching_ride` setzt `coaching_gebucht_von = auth.uid()` (profile_id): Das ist korrekt, weil `coaching_gebucht_von` ein anderes Feld ist und NICHT der FK auf contractor_onboarding

### Rollen-Matrix

| Rolle | Coaching-Step sichtbar? | Booking moeglich? | Bookings-Tab sieht Auftraege? |
|---|---|---|---|
| Trainee (onboarding) | Ja - sieht Trainer-Rides | Ja via RPC | N/A (noch im Onboarding) |
| Trainer (is_trainer=true) | N/A (ueberspringt Coaching) | N/A | Ja - sieht zugewiesene Auftraege |
| Admin/Manager | N/A (kein Onboarding) | N/A | N/A |

### RLS-Relevanz

Keine neuen RLS-Policies noetig. Die bestehenden Policies auf `thermocheck_auftraege` und `contractor_onboarding` bleiben unveraendert. Die Fixes sind rein logische ID-Aufloesung.
