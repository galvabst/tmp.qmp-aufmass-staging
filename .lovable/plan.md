

## Trainer-Video und Bio im Coaching-Step + Self-Service Editor

### Uebersicht

Trainer mit `is_trainer = true` koennen ihr persoenliches Vorstellungsvideo und eine Kurzbeschreibung in der App pflegen. Onboarder sehen diese Daten in den Coaching-Slot-Karten, koennen das Video abspielen und sich so fuer einen Trainer entscheiden.

---

### 1. Datenbank-Migration

**Neue Spalten** auf `thermocheck.contractor_onboarding`:

| Spalte | Typ | Nullable | Default |
|---|---|---|---|
| `trainer_video_url` | TEXT | YES | NULL |
| `trainer_bio` | TEXT | YES | NULL |

Warum auf `contractor_onboarding`? Dort lebt bereits `is_trainer` -- die Trainer-spezifischen Daten gehoeren logisch dorthin, nicht auf `profiles` (das ist User-Identitaet, nicht Trainer-Daten).

---

### 2. Datenschicht

**A) Neuer Hook: `src/hooks/useTrainerProfile.ts`**

- Liest `trainer_video_url`, `trainer_bio`, `is_trainer` aus `thermocheck.contractor_onboarding` fuer den aktuellen User (WHERE `profile_id = auth.uid()`)
- Mutation zum Update von `trainer_video_url` und `trainer_bio`
- Query-Key: `['trainer-profile', profileId]`
- Verwendet den bestehenden `thermocheckClient` (Schema: thermocheck)

**B) Update: `src/hooks/useCoachingSlots.ts`**

Aktuell werden nur `vorname`, `nachname`, `avatar_url` aus `profiles` geladen. Neu:
- Zusaetzlich `trainer_video_url` und `trainer_bio` aus `thermocheck.contractor_onboarding` laden (WHERE `profile_id IN (trainerIds)`)
- Neue Felder im `DbCoachingSlot` Interface: `trainer_video_url?: string`, `trainer_bio?: string`
- Beide Hooks (`useAvailableCoachingSlots` und `useMyBookedSlot`) erhalten die neuen Felder

---

### 3. Typ-Erweiterung

**Datei: `src/types/onboarding.ts`**

`CoachingSlot` Interface erweitern:
```text
+ coachVideoUrl?: string
+ coachBio?: string
```

---

### 4. Trainer Self-Service Editor

**Neue Datei: `src/components/trainer/TrainerProfileEditor.tsx`**

Kompakte Karte im ProfileView fuer Trainer:
- Titel: "Dein Trainer-Profil"
- Video-URL Eingabefeld (Text-Input fuer Bunny Stream / YouTube URL)
- Video-Vorschau via `MultiSourceVideoPlayer` (wenn URL gesetzt)
- Bio Textarea (max 200 Zeichen, Zeichenzaehler)
- Speichern-Button mit Loading-State
- Nur sichtbar wenn `is_trainer = true`

**Update: `src/components/ProfileView.tsx`**

- Import `TrainerProfileEditor`
- Neuer Hook-Aufruf: `useTrainerProfile()` am Anfang
- Wenn `is_trainer === true`: TrainerProfileEditor-Karte oberhalb der Menu-Items rendern

**Neuer Hook fuer Trainer-Check: `src/hooks/useIsTrainer.ts`**

- Liest `is_trainer` aus `thermocheck.contractor_onboarding` fuer aktuellen User
- Gibt `{ isTrainer: boolean, isLoading: boolean }` zurueck
- Wird in ProfileView und TrainerProfileEditor verwendet

---

### 5. Coaching-Step UI Update

**Datei: `src/components/onboarding/steps/CoachingStep.tsx`**

Slot-Karten werden expandierbar:
- Neuer lokaler State: `expandedSlotId: string | null`
- Collapsed: Aktuelles Layout + "Video ansehen"-Pill (nur wenn `coachVideoUrl` vorhanden)
- Expanded: Video-Player (`MultiSourceVideoPlayer`, heightMode="contained") + Bio-Text + "Diesen Trainer waehlen"-Button
- Maximal ein Slot gleichzeitig expanded (Toggle-Logik)
- Falls kein Video: Kein "Video ansehen"-Button, Selektion bleibt per Karten-Klick

**Datei: `src/components/OnboardingScreen.tsx`**

Slot-Mapping erweitern (Zeile ~362-397):
```text
coachVideoUrl: slot.trainer_video_url || undefined
coachBio: slot.trainer_bio || undefined
```
Gleiches fuer `myBookedSlot` Mapping.

---

### 6. RLS-Analyse

| Tabelle | Operation | Policy | Status |
|---|---|---|---|
| `contractor_onboarding` | SELECT | `qual: true` (alle auth Users) | Funktioniert -- Trainer-Daten sind nicht sensitiv |
| `contractor_onboarding` | UPDATE | `qual: true` (alle auth Users) | Funktioniert -- bereits bestehende Policy. Trainer kann eigene Row updaten |
| `contractor_coaching_slots` | SELECT | `auth.uid() IS NOT NULL` | Funktioniert -- Onboarder sehen Slots |
| `profiles` | SELECT | `qual: true` | Funktioniert -- Avatar/Name Aufloesung |

Hinweis: Die UPDATE-Policy auf `contractor_onboarding` ist sehr permissiv (`true`). Das ist ein bestehendes Sicherheitsthema, kein neues Problem durch dieses Feature. Eine Verschaerfung auf `profile_id = auth.uid() OR is_admin()` waere empfehlenswert, ist aber ein separates Ticket.

---

### 7. Rollen-Matrix

| Rolle | Kann Video/Bio sehen? | Kann eigenes Video/Bio bearbeiten? | Kann fremdes bearbeiten? |
|---|---|---|---|
| user (Onboarder) | Ja (im Coaching-Step) | Nein (kein is_trainer) | Nein |
| user (Trainer, is_trainer=true) | Ja | Ja (eigene Row) | Nein (Frontend-Schutz) |
| manager/admin | Ja | Nein (kein Trainer-Editor im Admin) | Via DB direkt |
| superadmin | Ja | Nein (kein Trainer-Editor im Admin) | Via DB direkt |

---

### 8. Edge Cases

| Szenario | Verhalten |
|---|---|
| Trainer hat kein Video gesetzt | "Video ansehen"-Button wird nicht angezeigt |
| Trainer hat keine Bio | Fallback-Text "Erfahrener Thermocheck-Coach" |
| Video-URL ist ungueltig | MultiSourceVideoPlayer zeigt Fehlerzustand |
| Trainer-Profil wird waehrend Onboarder-Browsing aktualisiert | Naechster Fetch (30s staleTime) zeigt neue Daten |
| Kein Trainer hat is_trainer=true | Coaching-Slots zeigen Standard-Layout ohne Video |
| Trainer ist selbst noch im Onboarding (status=invited) | TrainerProfileEditor nicht sichtbar (ProfileView nur fuer onboarded Users) |

---

### 9. Dateien-Uebersicht

| Datei | Aenderung |
|---|---|
| Migration SQL | `trainer_video_url TEXT`, `trainer_bio TEXT` auf `thermocheck.contractor_onboarding` |
| `src/hooks/useTrainerProfile.ts` | NEU -- Lesen/Schreiben von Trainer-Video + Bio |
| `src/hooks/useIsTrainer.ts` | NEU -- Pruefen ob User Trainer ist |
| `src/hooks/useCoachingSlots.ts` | Erweitert -- `trainer_video_url` und `trainer_bio` aus `contractor_onboarding` laden |
| `src/types/onboarding.ts` | Erweitert -- `coachVideoUrl`, `coachBio` in `CoachingSlot` |
| `src/components/trainer/TrainerProfileEditor.tsx` | NEU -- Self-Service Editor fuer Video + Bio |
| `src/components/ProfileView.tsx` | Erweitert -- TrainerProfileEditor einbinden |
| `src/components/onboarding/steps/CoachingStep.tsx` | Erweitert -- Expandable Cards mit Video-Player |
| `src/components/OnboardingScreen.tsx` | Erweitert -- Neue Felder im Slot-Mapping |

Keine neuen Dependencies. Nutzt bestehende `MultiSourceVideoPlayer`-Komponente.

