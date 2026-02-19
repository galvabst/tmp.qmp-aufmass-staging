

## Trainer-Mitfahrten-Sektion + Trainee-Kontaktinfo nach Buchung

### Zusammenfassung

Zwei Seiten derselben Medaille:
1. **Trainer sieht**: Neue Sektion "Meine Mitfahrten" im Profil-Tab mit Trainee-Kontaktdaten
2. **Trainee sieht**: Nach Buchung werden Coach-Kontaktdaten + Hinweis im BoardingPass angezeigt

### User Stories

**Story A: Trainer wird ueber Mitfahrt-Buchung informiert**
- Trainer oeffnet App -> Profil-Tab
- Unter dem TrainerProfileEditor erscheint neue Sektion "Meine Mitfahrten"
- Dort sieht er alle Auftraege wo `coaching_gebucht_von IS NOT NULL` und er der Trainer ist
- Pro Buchung: Trainee-Name, Telefon, E-Mail, Wohnort (PLZ + Ort), Datum der Mitfahrt
- Trainer entscheidet selbst wie er Kontakt aufnimmt (Anruf, WhatsApp, E-Mail)

**Story B: Trainee sieht Coach-Kontaktdaten nach Buchung**
- Trainee bucht Mitfahrt -> BoardingPass wird angezeigt
- Unter den bestehenden Infos erscheinen die Kontaktdaten des Coaches (Telefon, E-Mail, Ort)
- Hinweistext: "Dein Coach wird sich in den naechsten Tagen bei dir melden. Falls nicht, nimm selbst Kontakt auf."

### Daten-Analyse

Alle benoetigten Daten existieren bereits in der DB:

| Feld | Quelle | Verfuegbar? |
|---|---|---|
| Trainee Name | `profiles.vorname/nachname` via `coaching_gebucht_von` | Ja |
| Trainee Telefon | `profiles.telefon` via `coaching_gebucht_von` | Ja |
| Trainee E-Mail | `profiles.email` via `coaching_gebucht_von` | Ja |
| Trainee Wohnort | `contractor_onboarding.anschrift_plz/ort` via `coaching_gebucht_von` = `profile_id` | Ja |
| Coach Telefon | `profiles.telefon` via `contractor_onboarding.profile_id` | Ja |
| Coach E-Mail | `profiles.email` via `contractor_onboarding.profile_id` | Ja |
| Coach Ort | `contractor_onboarding.anschrift_ort` via Trainer's record | Ja |
| Mitfahrt-Datum | `thermocheck_terminvorschlaege.datum` | Ja |

Keine Schema-Aenderungen noetig. Kein neues Feature erfordert neue Tabellen oder Spalten.

### Technischer Plan

#### 1. Neuer Hook: `src/hooks/useMyCoachingRideAlongs.ts`

Fuer Trainer: Laedt alle Auftraege wo der eingeloggte User der zugewiesene Trainer ist UND `coaching_gebucht_von IS NOT NULL`.

Datenfluss:
```text
1. Eigene contractor_onboarding.id ermitteln (profile_id = auth.uid())
2. thermocheck_auftraege filtern: zugewiesener_techniker_id = contractor_onboarding.id AND coaching_gebucht_von IS NOT NULL
3. Fuer jeden Auftrag: Trainee-Profil laden (profiles WHERE id = coaching_gebucht_von)
4. Fuer jeden Auftrag: Trainee-Adresse laden (contractor_onboarding WHERE profile_id = coaching_gebucht_von)
5. Termine laden (thermocheck_terminvorschlaege)
6. Zusammenbauen: Name, Telefon, Email, PLZ+Ort, Datum
```

#### 2. Neue Komponente: `src/components/trainer/TrainerRideAlongs.tsx`

Zeigt die Mitfahrten-Liste im Profil-Tab. Design:
- Ueberschrift "Meine Mitfahrten" mit Users-Icon
- Pro Buchung eine Card mit:
  - Trainee-Avatar + Name
  - Datum der Mitfahrt (mit Calendar-Icon)
  - Region/Wohnort des Trainees (PLZ + Ort)
  - Kontaktdaten-Bereich: Telefon + E-Mail als klickbare Links
  - Buchungszeitpunkt (klein, als "Gebucht am ...")

#### 3. Erweiterung: `src/components/onboarding/steps/CoachingStep.tsx` (BoardingPass)

Im bestehenden BoardingPass nach der Buchung:
- Neuer Abschnitt mit Coach-Kontaktdaten (Telefon, E-Mail)
- Hinweis-Banner: "Dein Coach wird sich in den naechsten Tagen bei dir melden."

Dafuer muessen die Coach-Kontaktdaten im `CoachingSlot`-Typ ergaenzt werden.

#### 4. Erweiterung: `useCoachingSlots.ts` (useMyBookedRide)

Die `useMyBookedRide`-Query laedt bereits Trainer-Profildaten. Zusaetzlich laden:
- `profiles.telefon` und `profiles.email` des Trainers
- `contractor_onboarding.anschrift_plz/ort` des Trainers

Neue Felder im `DbCoachingRide`-Interface:
- `trainer_telefon?: string`
- `trainer_email?: string`
- `trainer_ort?: string`

#### 5. Integration in `src/components/ProfileView.tsx`

Unter dem TrainerProfileEditor (nur fuer Trainer sichtbar):
```text
{isTrainer && profileId && (
  <>
    <TrainerProfileEditor profileId={profileId} />
    <TrainerRideAlongs profileId={profileId} />
  </>
)}
```

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/hooks/useMyCoachingRideAlongs.ts` | **NEU** - Hook fuer Trainer: Laedt gebuchte Mitfahrten mit Trainee-Kontaktdaten |
| `src/components/trainer/TrainerRideAlongs.tsx` | **NEU** - UI-Komponente: Mitfahrten-Liste mit Kontaktdaten |
| `src/hooks/useCoachingSlots.ts` | Erweitern: `useMyBookedRide` laedt zusaetzlich Coach-Telefon/Email/Ort |
| `src/types/onboarding.ts` | Erweitern: `CoachingSlot` um Coach-Kontaktfelder |
| `src/components/onboarding/steps/CoachingStep.tsx` | Erweitern: BoardingPass zeigt Coach-Kontakt + Hinweis |
| `src/components/ProfileView.tsx` | Integration: TrainerRideAlongs unterhalb TrainerProfileEditor |

### Rollen-Matrix

| Rolle | Sieht Mitfahrten-Sektion? | Daten-Zugriff |
|---|---|---|
| Trainer (is_trainer=true) | Ja - im Profil-Tab | SELECT auf profiles + contractor_onboarding via thermocheckClient (Session-basiert) |
| Trainee (normaler User) | Nein | Sieht nur eigene gebuchte Mitfahrt mit Coach-Kontaktdaten |
| Admin/Manager | Nein | Kein contractor_onboarding-Record, ProfileView wird nicht geladen |

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Trainer hat 0 Mitfahrt-Buchungen | Empty State: "Noch keine Mitfahrten gebucht" |
| Trainee hat kein Telefon hinterlegt | Fallback: "Nicht hinterlegt" statt leeres Feld |
| Trainee hat keine Adresse | PLZ+Ort Fallback: "Nicht angegeben" |
| Mehrere Mitfahrten beim selben Trainer | Alle werden aufgelistet, sortiert nach Datum |
| Coach hat kein Telefon hinterlegt | Fallback im BoardingPass: "Nicht hinterlegt" |

### Keine DB-Migration noetig

Alle Daten existieren bereits. Kein neues Schema, keine neuen Spalten, keine neuen RLS Policies. Nur Frontend-Logik und Daten-Aggregation.

