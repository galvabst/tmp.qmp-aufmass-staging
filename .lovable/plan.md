
## Plan: Quartals-KPI fixen + Trainer-Freigabe für Mitfahrten endlich nutzbar machen

### Was ich gefunden habe
1. **Kontingent bleibt 0**, weil es in `src/pages/Index.tsx` weiterhin hart auf `abgenommen: 0` gesetzt ist.  
2. **Trainer kann niemanden freigeben/ablehnen**, weil es zwar `TrainerRideAlongs` gibt, aber **keine Aktion** (nur Anzeige) und auch **keine passende RPC im DB-Schema** für die Bewertung der Mitfahrt.

---

### Umsetzung

## 1) Motivierende, echte Quartals-KPI statt Dauer-0
**Ziel:** Der Trainer sieht Fortschritt, auch bevor QG-Abnahmen technisch vollständig live sind.

**Änderungen**
- `src/pages/Index.tsx`
  - Kontingent-Werte dynamisch aus `dbAssignedOrders` berechnen.
  - Zwei Zählweisen:
    - **Angenommen (Motivation, sofort sichtbar)** = `dbAssignedOrders.length`
    - **Abgenommen (echte QG-Abnahme)** = `status === 'approved'` (aktuell ggf. 0)
- `src/types/technician.ts`
  - `QuartalKontingent` um ein Feld für die zweite Kennzahl erweitern (z. B. `angenommen`), damit UI beide sauber zeigen kann.
- `src/components/ProfileView.tsx`
  - Hauptfortschritt auf **Angenommene Aufträge / 24** stellen.
  - Darunter kleine Klarstellung: **„Davon abgenommen: X“**.

Damit ist es motivierend und gleichzeitig fachlich sauber (kein „Fake-Abgenommen“).

---

## 2) Trainer-Freigabe/ Ablehnung im Mitfahrten-Bereich implementieren (Backend)
**Ziel:** Trainer kann direkt im Profil entscheiden: bestanden / nicht bestanden.

**Neue Migration (Supabase)**
- Neue RPC in `thermocheck` + Public-Wrapper:
  - `thermocheck.bewerte_coaching_mitfahrt(p_auftrag_id uuid, p_entscheidung text, p_notiz text default null)`
  - `public.bewerte_coaching_mitfahrt(...)` delegiert auf thermocheck.
- Logik in RPC:
  - Prüfen, dass `auth.uid()` wirklich der Trainer des Auftrags ist.
  - `coaching_gebucht_von` ermitteln (Trainee).
  - Bei **bestanden**:
    - `contractor_onboarding.coaching_bewertung = 'bestanden'`
    - `coaching_bewertung_am = now()`
    - `trainer_freigabe = true`, `trainer_freigabe_am = now()`, `trainer_freigabe_von = auth.uid()`
  - Bei **nicht_bestanden**:
    - `coaching_bewertung = 'nicht_bestanden'`
    - `trainer_freigabe = false`
    - `completed_steps` um `'coaching'` bereinigen, `current_step='coaching'`
    - gebuchte Coach-Daten zurücksetzen
    - Buchung auf `thermocheck_auftraege` wieder freigeben (`coaching_gebucht_von/am = null`)
- Rückgabe als JSON (`success`, `status`, `message`) für klare UI-Feedbacks.

---

## 3) Trainer-UI um echte Aktionen erweitern
**Dateien**
- `src/hooks/useMyCoachingRideAlongs.ts`
  - Pro Mitfahrt zusätzlich Bewertungsstatus der Trainees laden (`coaching_bewertung`, Zeitstempel, ggf. traineeId).
  - Neue Mutation-Hook exportieren: `useBewerteCoachingMitfahrt`.
- `src/components/trainer/TrainerRideAlongs.tsx`
  - Pro Karte Status-Badge: `Ausstehend`, `Bestanden`, `Nicht bestanden`.
  - Bei `Ausstehend` zwei Buttons:
    - **Bestanden**
    - **Nicht bestanden** (mit Confirm)
  - Buttons während Mutation disable + Ladezustand.
  - Nach Erfolg Query invalidieren, Liste aktualisieren, Toast anzeigen.

---

## 4) Validierung (E2E nach Umsetzung)
1. Als Trainer (Till) in Profil:
   - „Meine Mitfahrten“ zeigt Buchungen.
   - Ausstehende Mitfahrt kann auf **Bestanden/Nicht bestanden** gesetzt werden.
2. Als Trainee:
   - Bei **Bestanden**: Nachweise-Step entsperrt bzw. Onboarding geht weiter.
   - Bei **Nicht bestanden**: zurück auf Coaching-Auswahl, neue Mitfahrt buchbar.
3. Profil-KPI:
   - Quartalsfortschritt zeigt nicht mehr dauerhaft 0, sondern sichtbaren Motivationswert + echte Abnahmezahl separat.

---

### Betroffene Dateien (geplant)
- `src/pages/Index.tsx`
- `src/components/ProfileView.tsx`
- `src/types/technician.ts`
- `src/hooks/useMyCoachingRideAlongs.ts`
- `src/components/trainer/TrainerRideAlongs.tsx`
- `supabase/migrations/<timestamp>_trainer_mitfahrt_bewertung.sql`
