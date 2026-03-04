

# Plan: Trainer-Mitfahrten-System komplett überarbeiten

## Ist-Zustand (Probleme)

1. **Bewertung wird nur auf `contractor_onboarding` gespeichert** -- nicht pro Auftrag. Bei "nicht bestanden" wird `coaching_gebucht_von` genullt und der Trainee verschwindet aus der Trainer-Liste. Historie geht verloren.
2. **Keine Trennung vergangen/zukünftig** -- alle Mitfahrten in einer flachen Liste.
3. **Nur 2 Aktionen** (bestanden/nicht_bestanden) -- es fehlen "Abgesagt" und "No Show".
4. **Bei "nicht bestanden" wird der Slot gefreed** -- unnötig, da die Termine in der Vergangenheit liegen und eh nicht neu buchbar sind.

## Architektur-Entscheidung

Die Bewertung muss **pro Auftrag** gespeichert werden, nicht nur auf dem Onboarding-Record. So bleibt die Historie erhalten. `coaching_gebucht_von` wird bei Ablehnung NICHT mehr genullt (Slot ist eh past). Das Onboarding wird weiterhin zurückgesetzt, damit der Trainee einen neuen (zukünftigen) Slot buchen kann.

---

## 1. DB-Migration

### Neue Enum-Werte
```sql
ALTER TYPE thermocheck.coaching_bewertung_enum ADD VALUE IF NOT EXISTS 'abgesagt';
ALTER TYPE thermocheck.coaching_bewertung_enum ADD VALUE IF NOT EXISTS 'no_show';
```

### Neue Spalten auf `thermocheck_auftraege`
```
coaching_bewertung     coaching_bewertung_enum DEFAULT 'ausstehend'
coaching_bewertung_am  timestamptz
coaching_bewertung_von uuid
```

### RPC aktualisieren: `thermocheck.bewerte_coaching_mitfahrt`
- Akzeptiert jetzt 4 Entscheidungen: `bestanden`, `nicht_bestanden`, `abgesagt`, `no_show`
- Schreibt Bewertung auf den **Auftrag** (nicht nur Onboarding)
- Bei `bestanden`: Onboarding freischalten (wie bisher)
- Bei `nicht_bestanden` / `abgesagt` / `no_show`: Onboarding-Step zurücksetzen, aber `coaching_gebucht_von` bleibt erhalten (Historie!)
- Public Wrapper aktualisieren

### Bestehende Daten migrieren
Die 2 bestehenden Aufträge (Anton Berger / Torsten Lauschke) haben `coaching_bewertung` noch nicht. Default `'ausstehend'` greift automatisch.

---

## 2. Frontend: Hook `useMyCoachingRideAlongs.ts`

- Bewertung kommt jetzt vom **Auftrag** (`coaching_bewertung`), nicht mehr vom Onboarding
- Interface `RideAlongTrainee` um `'abgesagt' | 'no_show'` erweitern
- Mutation `useBewerteCoachingMitfahrt` um die 2 neuen Entscheidungen erweitern

---

## 3. Frontend: `TrainerRideAlongs.tsx`

- **Zwei Sektionen**: "Anstehende Mitfahrten" (Termin >= heute) und "Vergangene Mitfahrten" (Termin < heute)
- **Vergangene mit `ausstehend`**: 4 Buttons (Bestanden, Nicht bestanden, No Show, Abgesagt)
- **Vergangene mit Bewertung**: Badge anzeigen (grün/rot/orange)
- **Anstehende**: Nur Anzeige, keine Aktionen (Mitfahrt steht noch bevor)
- `BewertungBadge` um abgesagt/no_show erweitern

---

## 4. User-Flow-Validierung

### Trainer (Till) bewertet vergangene Mitfahrt:
1. Profil-Tab → "Vergangene Mitfahrten" → Karte mit Anton Berger
2. Klickt "Bestanden" → Confirm-Dialog → RPC → `coaching_bewertung = 'bestanden'` auf Auftrag + Onboarding freigeschaltet
3. Klickt "Nicht bestanden" → Confirm-Dialog → RPC → Auftrag bewertet, Onboarding-Step reset → Trainee muss neuen Slot buchen

### Trainee nach "nicht bestanden":
1. Öffnet App → Onboarding → `current_step = 'coaching'`, `coaching` nicht in `completed_steps`
2. Sieht verfügbare zukünftige Coaching-Termine (Filter `datum >= heute` + `coaching_gebucht_von IS NULL`)
3. Bucht neuen Slot → Wartet auf Mitfahrt → Trainer bewertet erneut

### Edge Cases:
- **Trainee hat coaching in completed_steps aber bewertung = nicht_bestanden**: RPC entfernt 'coaching' aus completed_steps
- **Trainee hat bereits nachweise completed**: RPC entfernt auch 'nachweise' aus completed_steps (da coaching Prerequisite)
- **Trainer versucht eigene Mitfahrt zu bewerten**: RPC prüft `zugewiesener_techniker_id = trainer_onb_id`
- **Nicht-Trainer versucht RPC**: Wird abgelehnt (`is_trainer = true` Check)

---

## 5. RLS / IAM

- RPC ist `SECURITY DEFINER` -- kein RLS-Problem
- Prüfung im RPC: `auth.uid()` muss Trainer des Auftrags sein
- Trainee-Onboarding wird server-seitig aktualisiert (kein Client-Zugriff nötig)
- Keine neuen RLS-Policies nötig

---

## Betroffene Dateien
- `supabase/migrations/<timestamp>_coaching_bewertung_per_auftrag.sql` (Migration + RPC Update)
- `src/hooks/useMyCoachingRideAlongs.ts` (Bewertung vom Auftrag lesen, neue Statuses)
- `src/components/trainer/TrainerRideAlongs.tsx` (Past/Future Split, 4 Aktionen)
- `src/integrations/supabase/types.ts` (auto-updated)

