

## Coaching-Slots aus Thermocheck-Terminvorschlaegen + Trainer-Video/Bio

### Ueberblick

Statt manuell verwalteter `contractor_coaching_slots` werden die Coaching-Mitfahrt-Termine direkt aus den echten `thermocheck_terminvorschlaege` generiert. Trainer (`is_trainer = true`) deren `thermocheck_auftraege` Terminvorschlaege haben, erscheinen als buchbare Coaching-Optionen. Zusaetzlich koennen Trainer ihr Vorstellungsvideo und Bio pflegen.

---

### Architektur-Entscheidung

Die `contractor_coaching_slots` Tabelle wird NICHT mehr verwendet. Stattdessen:

```text
thermocheck_auftraege (zugewiesener_techniker_id = Trainer)
    |
    +-- thermocheck_terminvorschlaege (bis zu 3 Datumsvorschlaege)
    |
    +-- Trainer-Profil (profiles + contractor_onboarding.trainer_video_url/bio)
```

Ein Onboarder bucht einen **Auftrag** (nicht einen einzelnen Termin). Da alle 3 Termine eines Auftrags blockiert werden, ist die Buchungs-Einheit der Auftrag selbst.

---

### Schritt 1: DB-Migration

**1a) Neue Spalten auf `thermocheck.contractor_onboarding`:**

| Spalte | Typ | Default | Zweck |
|---|---|---|---|
| `trainer_video_url` | TEXT | NULL | Bunny/YouTube Vorstellungsvideo |
| `trainer_bio` | TEXT | NULL | Kurzbeschreibung (max 200 Zeichen) |

**1b) Neue Spalten auf `thermocheck.thermocheck_auftraege`:**

| Spalte | Typ | Default | Zweck |
|---|---|---|---|
| `coaching_gebucht_von` | UUID | NULL | profile_id des Onboarders der mitfaehrt |
| `coaching_gebucht_am` | TIMESTAMPTZ | NULL | Buchungszeitpunkt |

**1c) Neue RPC: `book_coaching_ride`**

Atomare Buchung (SECURITY DEFINER):
1. Prueft ob `coaching_gebucht_von` noch NULL ist (noch frei)
2. Setzt `coaching_gebucht_von = auth.uid()`, `coaching_gebucht_am = now()`
3. Aktualisiert `contractor_onboarding` des Onboarders: `gebuchter_coaching_termin`, `gebuchter_coach_name`
4. Gibt Trainer-Name und erstes Datum zurueck

---

### Schritt 2: Hook-Umstellung

**`src/hooks/useCoachingSlots.ts` -- Komplett umschreiben**

Statt `contractor_coaching_slots` wird jetzt abgefragt:

```text
Query "available":
  thermocheck_auftraege
  WHERE zugewiesener_techniker_id IN (
    SELECT profile_id FROM contractor_onboarding WHERE is_trainer = true
  )
  AND coaching_gebucht_von IS NULL
  AND EXISTS (terminvorschlaege fuer diesen Auftrag)

+ JOIN terminvorschlaege (fuer Datum-Anzeige)
+ JOIN profiles (fuer Trainer-Name/Avatar)
+ JOIN contractor_onboarding (fuer trainer_video_url, trainer_bio)
```

Da wir den thermocheck-Schema-Client verwenden muessen und die Joins komplex sind, wird das in 3 sequenzielle Queries aufgeteilt:

1. Auftraege mit Trainer laden (thermocheck-Client)
2. Terminvorschlaege fuer diese Auftraege laden (thermocheck-Client)
3. Trainer-Profile laden (public supabase-Client)
4. Trainer-Video/Bio laden (thermocheck-Client, contractor_onboarding)

**Neues Interface:**

```text
DbCoachingRide {
  auftrag_id: string
  trainer_profile_id: string
  termine: { datum: string, ganztaegig: boolean, zeit_von?: string, zeit_bis?: string }[]
  region: string  // aus Lead-PLZ/Ort abgeleitet
  trainer_vorname: string
  trainer_nachname: string
  trainer_avatar_url?: string
  trainer_video_url?: string
  trainer_bio?: string
}
```

**`useMyBookedRide`** ersetzt `useMyBookedSlot`:
- Query: `thermocheck_auftraege WHERE coaching_gebucht_von = profileId`

**`useBookCoachingRide`** ersetzt `useBookCoachingSlot`:
- Ruft neue RPC `book_coaching_ride(p_auftrag_id)` auf

---

### Schritt 3: Typ-Erweiterung

**`src/types/onboarding.ts`** -- `CoachingSlot` wird zu:

```text
CoachingSlot {
  id: string              // auftrag_id
  coachName: string
  coachAvatarUrl?: string
  coachVideoUrl?: string
  coachBio?: string
  termine: { datum: string, ganztaegig: boolean, zeitVon?: string, zeitBis?: string }[]
  ort: string
  region: string
  gebucht: boolean
  preis: number
}
```

Anstatt eines einzelnen `datum` gibt es jetzt `termine[]` (bis zu 3 Vorschlaege).

---

### Schritt 4: CoachingStep UI Update

**`src/components/onboarding/steps/CoachingStep.tsx`**

Aenderungen:
- Karten zeigen jetzt bis zu 3 Termine pro Trainer/Auftrag
- Expandable Cards mit Video-Player (bestehendes Feature aus Vorgaenger-Plan)
- "Video ansehen"-Pill nur wenn `coachVideoUrl` vorhanden
- Bio-Text unter Trainer-Name (Fallback: "Erfahrener Thermocheck-Coach")
- Preis-Anzeige mit `/Tag` Suffix
- Termine als Chip-Liste: "Di 25.02. | Mi 26.02. | Do 27.02."

**BoardingPass** (gebuchter Zustand):
- Zeigt alle gebuchten Termine des Auftrags
- Treffpunkt wird wie bisher privat kommuniziert

---

### Schritt 5: OnboardingScreen Mapping

**`src/components/OnboardingScreen.tsx`**

Slot-Mapping Zeile ~361-397 wird angepasst:
- Neue Felder `coachVideoUrl`, `coachBio`, `termine[]` durchreichen
- Datenquelle wechselt von `useAvailableCoachingSlots` auf neue Hook-Funktion

---

### Schritt 6: Trainer Self-Service Editor

**Neue Datei: `src/hooks/useTrainerProfile.ts`**
- Liest/schreibt `trainer_video_url` und `trainer_bio` aus `contractor_onboarding`
- Verwendet thermocheck-Schema-Client

**Neue Datei: `src/hooks/useIsTrainer.ts`**
- Prueft `is_trainer` Flag

**Neue Datei: `src/components/trainer/TrainerProfileEditor.tsx`**
- Video-URL Input + Live-Vorschau via MultiSourceVideoPlayer
- Bio Textarea (max 200 Zeichen, Zaehler)
- Speichern-Button

**Update: `src/components/ProfileView.tsx`**
- TrainerProfileEditor einblenden wenn `is_trainer = true`

---

### Schritt 7: Alte RPC + Tabelle

Die bestehende `book_coaching_slot` RPC und `contractor_coaching_slots` Tabelle bleiben bestehen (keine Loesch-Migration), werden aber im Frontend nicht mehr angesprochen. Der Code in `useCoachingSlots.ts` wird komplett auf die neue Datenquelle umgestellt.

---

### RLS-Analyse

| Tabelle | Operation | Policy | Funktioniert? |
|---|---|---|---|
| `thermocheck_auftraege` | SELECT | Authentifizierte User | Ja -- Onboarder sieht verfuegbare Auftraege |
| `thermocheck_auftraege` | UPDATE (coaching_gebucht_von) | Via RPC (SECURITY DEFINER) | Ja -- atomar, sicher |
| `thermocheck_terminvorschlaege` | SELECT | `true` fuer auth Users | Ja |
| `contractor_onboarding` | SELECT (trainer_video/bio) | `true` fuer auth Users | Ja |
| `contractor_onboarding` | UPDATE (eigenes video/bio) | `true` fuer auth Users | Ja (bestehende Policy) |
| `profiles` | SELECT | `true` | Ja |

---

### Edge Cases

| Szenario | Verhalten |
|---|---|
| Auftrag hat keine Terminvorschlaege | Wird nicht als Coaching-Slot angezeigt |
| zugewiesener_techniker_id ist NULL | Wird nicht angezeigt (kein Trainer zugeordnet) |
| Trainer hat kein Video/Bio | Kein "Video ansehen"-Button, Fallback-Bio |
| Zwei Onboarder buchen gleichzeitig | RPC sperrt mit FOR UPDATE, zweiter bekommt Fehler |
| Onboarder hat bereits einen Ride gebucht | UI zeigt BoardingPass, keine weiteren Buchungen |
| Auftrag wird storniert nach Buchung | Separates Admin-Thema, nicht Teil dieses Features |
| Trainer ist nicht mehr is_trainer=true | Seine Auftraege tauchen nicht mehr auf (Query filtert) |
| Region-Anzeige | Aus Lead-Daten: `kunde_plz + kunde_ort` des zugehoerigen Leads |

---

### Rollen-Matrix

| Rolle | Sieht Coaching-Slots? | Kann buchen? | Kann Video/Bio bearbeiten? |
|---|---|---|---|
| user (Onboarder) | Ja | Ja (eigenen Ride) | Nein |
| user (Trainer) | Ja | Nein (Frontend-Schutz) | Ja (eigene Daten) |
| admin/manager | Ja | Nein (kein Onboarding) | Via DB |
| superadmin | Ja | Nein | Via DB |

---

### Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| Migration SQL | `trainer_video_url`, `trainer_bio` auf contractor_onboarding + `coaching_gebucht_von`, `coaching_gebucht_am` auf thermocheck_auftraege + RPC `book_coaching_ride` |
| `src/hooks/useCoachingSlots.ts` | Komplett umschreiben: thermocheck_terminvorschlaege als Datenquelle |
| `src/hooks/useTrainerProfile.ts` | NEU |
| `src/hooks/useIsTrainer.ts` | NEU |
| `src/types/onboarding.ts` | `CoachingSlot` erweitern: `termine[]`, `coachVideoUrl`, `coachBio` |
| `src/components/onboarding/steps/CoachingStep.tsx` | Expandable Cards + Multi-Termin-Anzeige + Video |
| `src/components/OnboardingScreen.tsx` | Neues Mapping |
| `src/components/trainer/TrainerProfileEditor.tsx` | NEU |
| `src/components/ProfileView.tsx` | Editor einbinden |

Keine neuen Dependencies.

