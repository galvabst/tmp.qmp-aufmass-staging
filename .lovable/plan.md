

## Masterplan: Akademie-QuizModal Verdrahtung + Coaching-Slots aus DB

---

### Status-Analyse (Ist-Zustand)

**Datenbank-Fakten (nicht geraten):**
- 30 aktive Quiz-Fragen in `thermocheck.contractor_akademie_quiz`
- 6 Contractor-Onboarding-Eintraege, KEINER hat `is_trainer = true`
- KEINE Tabelle `contractor_coaching_slots` existiert
- KEIN RPC `update_contractor_akademie_test_bestanden` existiert
- `contractor_onboarding.akademie_test_bestanden` (boolean, NOT NULL, default false) existiert
- `contractor_onboarding.gebuchter_coaching_termin` (date, nullable) existiert
- `contractor_onboarding.gebuchter_coach_name` (text, nullable) existiert
- RLS auf `contractor_onboarding`: Authentifizierte User koennen SELECT/INSERT/UPDATE; Manager koennen Trainer-Freigabe setzen
- RLS auf `contractor_akademie_quiz_ergebnis`: ALL fuer authentifizierte User (read+write)
- IAM-Rollen: superadmin (2), admin (2), manager (3), user (viele)
- Manager-Rolle = Trainer-Bewertung im QG-View (Cem, Maximilian, Mike)

**Code-Fakten:**
- `QuizModal.tsx` ist vollstaendig implementiert (Single/Multiple Choice, Score, DB-Save)
- `useModulQuiz.ts`: `modulId = undefined` laedt ALLE 30 Fragen (Abschlusspruefung)
- `useSubmitQuiz`: Speichert Ergebnis in `contractor_akademie_quiz_ergebnis`
- `handleStartTest` (OnboardingScreen Z.452-458): Mock-Timer, KEIN QuizModal
- `setAkademieTestBestanden(true)` aendert nur lokalen State, KEIN DB-Write
- `handleNext` beim Akademie-Schritt (Z.545-566): Speichert `currentStep` + `completedSteps` via `saveProgress` RPC, aber NICHT `akademie_test_bestanden`
- `hydrateFromDb` liest `akademie_test_bestanden` korrekt aus DB
- Coaching: `MOCK_COACHING_SLOTS` (3 hardcoded Slots) werden in `useState` initialisiert
- `handleBookCoaching` (Z.460-471): Setzt nur lokalen State, KEIN DB-Write

---

### Problem 1: Akademie-Abschlusstest ist Mock

**Symptom:** "Test starten" Button wartet 2s und auto-passed. Kein echtes Quiz.

**Root Cause:** `handleStartTest` oeffnet nicht `QuizModal`, obwohl die Komponente fertig implementiert ist.

**Zweites Problem:** Selbst wenn Quiz bestanden: `akademie_test_bestanden` wird nie in die DB geschrieben. Bei neuem Login geht der Fortschritt verloren -- AUSSER die Hydration liest den Wert. Aktuell: `hydrateFromDb` setzt `akademieTestBestanden` korrekt, ABER `update_contractor_onboarding_progress` RPC aktualisiert NUR `current_step` und `completed_steps`. Es gibt keinen separaten RPC fuer `akademie_test_bestanden`.

**Loesung:**

1. Neuer RPC `update_contractor_akademie_test_bestanden` (SECURITY DEFINER):
   - Setzt `akademie_test_bestanden = true` fuer den authentifizierten User
   - Prueft `auth.uid() = profile_id` in der Onboarding-Tabelle

2. In `OnboardingScreen.tsx`:
   - Import `QuizModal` und `useState` fuer `quizOpen`
   - `handleStartTest` oeffnet `setQuizOpen(true)` statt Mock-Timer
   - `onQuizComplete(true)`: 
     - `setAkademieTestBestanden(true)` (lokaler State)
     - RPC `update_contractor_akademie_test_bestanden` aufrufen (DB-Persistierung)
   - `onQuizComplete(false)`: Toast "Nicht bestanden, versuche es erneut"
   - `modulId = undefined` (laedt ALLE 30 Fragen)
   - `contractorId = dbStatus?.onboardingId`
   - `bestehensSchwelle = 100` (100% erforderlich laut Memory)

3. Neue Mutation `saveAkademieTestBestanden` in `useContractorProfile.ts`

---

### Problem 2: Coaching-Slots sind Mock-Daten

**Symptom:** 3 hardcoded Slots mit fiktiven Trainern.

**Root Cause:** Keine DB-Tabelle, kein Hook, kein RPC.

**Loesung:**

1. Neue Tabelle `thermocheck.contractor_coaching_slots`:

```text
Spalte                    Typ                     Beschreibung
id                        UUID PK                 gen_random_uuid()
trainer_profile_id        UUID FK profiles(id)    Trainer (is_trainer = true)
datum                     DATE NOT NULL           Tag der Mitfahrt
region                    TEXT NOT NULL            z.B. "Muenchen"
preis                     NUMERIC(10,2)           Default 149.00
status                    TEXT NOT NULL            'available' / 'booked' / 'completed' / 'cancelled'
gebuchter_onboarder_id    UUID FK profiles(id)    Wer hat gebucht? (nullable)
gebucht_am                TIMESTAMPTZ             Buchungszeitpunkt
notizen                   TEXT                    Trainer-Notizen
erstellt_am               TIMESTAMPTZ             Default now()
```

2. RLS-Policies:
   - SELECT: `auth.uid() IS NOT NULL` (alle authentifizierten User)
   - INSERT: Nur Manager/Admin/Superadmin (ueber IAM) -- Trainer erstellen Slots ueber Admin-UI
   - UPDATE: Manager/Admin/Superadmin ODER der gebuchte Onboarder fuer seine eigene Buchung

3. RPC `book_coaching_slot(p_slot_id UUID)`:
   - Prueft `status = 'available'` und `gebuchter_onboarder_id IS NULL`
   - Setzt `gebuchter_onboarder_id = auth.uid()`, `status = 'booked'`, `gebucht_am = now()`
   - Aktualisiert `contractor_onboarding.gebuchter_coaching_termin` und `gebuchter_coach_name`
   - Gibt Trainer-Name aus `profiles` zurueck

4. Neuer Hook `useCoachingSlots.ts`:
   - `useAvailableCoachingSlots()`: Laedt Slots mit `status = 'available'` + Trainer-Info
   - `useBookCoachingSlot()`: Mutation ruft RPC auf
   - `useMyBookedSlot(profileId)`: Laedt gebuchten Slot des aktuellen Users

5. Frontend-Aenderungen:
   - `OnboardingScreen.tsx`: `MOCK_COACHING_SLOTS` ersetzen durch `useAvailableCoachingSlots()`
   - `handleBookCoaching`: RPC `book_coaching_slot` aufrufen statt lokalen State
   - Mapping: DB-Slot-Format → `CoachingSlot`-Interface (Trainer-Name, Region, Datum)
   - Fallback: Wenn keine Slots verfuegbar, "Aktuell keine Termine" anzeigen (CoachingStep hat das bereits)

---

### Problem 3: Kein Trainer markiert

**Fakt:** `is_trainer = true` hat 0 Eintraege. Der User sagte es gibt jetzt einen.

**Loesung:** Nach der Migration muss ein Manager/Admin manuell `is_trainer = true` setzen fuer den betreffenden Contractor. Das kann ueber:
- SQL: `UPDATE thermocheck.contractor_onboarding SET is_trainer = true WHERE profile_id = '<UUID>'`
- Oder: Admin-UI Erweiterung (spaeter)

---

### Edge Cases & Validierung

| Szenario | Erwartetes Verhalten |
|---|---|
| User schliesst QuizModal ohne abzuschicken | Kein State-Change, Quiz kann erneut geoeffnet werden |
| User besteht Quiz nicht (Score < 100%) | Toast "Nicht bestanden", QuizModal zeigt Retry-Button |
| User besteht Quiz, DB-Write schlaegt fehl | Lokaler State gesetzt, Warnung geloggt, bei naechstem Login verloren |
| Kein Coaching-Slot verfuegbar | "Aktuell keine Termine" Meldung (existiert in CoachingStep Z.100-105) |
| Zwei User buchen gleichzeitig denselben Slot | RPC prueft atomar `status = 'available'`, zweiter bekommt Fehler |
| User hat bereits einen Slot gebucht | UI zeigt Bestaetigung (existiert in CoachingStep Z.27-68) |
| User mit Rolle 'user' versucht Slot zu erstellen | RLS blockiert INSERT |
| Manager setzt coaching_bewertung auf 'nicht_bestanden' | Coaching-Schritt wird zurueckgesetzt (existierende Logik im QG-View) |

---

### Rollen-Matrix

| Aktion | user | manager | admin | superadmin |
|---|---|---|---|---|
| Quiz absolvieren | Ja | Ja | Ja | Ja |
| Quiz-Ergebnis speichern (quiz_ergebnis) | Ja | Ja | Ja | Ja |
| akademie_test_bestanden setzen (eigenes) | Ja | Ja | Ja | Ja |
| Coaching-Slots sehen | Ja | Ja | Ja | Ja |
| Coaching-Slot buchen (eigenes) | Ja | Ja | Ja | Ja |
| Coaching-Slot erstellen | Nein | Ja | Ja | Ja |
| Coaching-Slot aendern/loeschen | Nein | Ja | Ja | Ja |
| coaching_bewertung setzen | Nein | Ja | Ja | Ja |
| is_trainer setzen | Nein | Nein | Ja | Ja |

---

### Betroffene Dateien (Aenderungen)

| Datei | Aenderung |
|---|---|
| Migration SQL | Tabelle `contractor_coaching_slots`, RPC `update_contractor_akademie_test_bestanden`, RPC `book_coaching_slot`, RLS |
| `src/hooks/useContractorProfile.ts` | Neue Mutation `saveAkademieTestBestanden` |
| `src/hooks/useCoachingSlots.ts` | NEU: 3 Hooks (available, book, myBooked) |
| `src/components/OnboardingScreen.tsx` | QuizModal importieren+verdrahten, Coaching-Mock ersetzen, ~30 Zeilen |
| `src/lib/onboarding-config.ts` | `MOCK_COACHING_SLOTS` entfernen (wird durch DB ersetzt) |

---

### Reihenfolge der Implementation

1. **Migration**: Tabelle + RPCs + RLS
2. **useContractorProfile.ts**: `saveAkademieTestBestanden` Mutation
3. **useCoachingSlots.ts**: Neuer Hook
4. **OnboardingScreen.tsx**: QuizModal verdrahten + Coaching aus DB
5. **onboarding-config.ts**: Mock-Daten bereinigen

### Post-Migration-Check

- Bestehende Daten: `akademie_test_bestanden` ist bereits `true` fuer User `e9e3e91a` (Test-User). Kein Datenverlust.
- `coaching_bewertung` hat bereits korrekte Werte (bestanden/ausstehend). Kein Konflikt.
- `gebuchter_coaching_termin` und `gebuchter_coach_name` sind beide NULL bei allen Usern. Kein Migrationsbedarf.
- Keine destructive Schema-Aenderungen. Nur Additions (neue Tabelle + RPCs).

