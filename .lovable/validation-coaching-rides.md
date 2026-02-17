# Validation: Coaching-Rides aus Terminvorschlägen + Trainer-Video/Bio

**Datum:** 2026-02-17
**Feature:** Coaching-Mitfahrt-Buchung über echte Thermocheck-Terminvorschläge

---

## Änderungen

### DB-Migration
- `thermocheck.contractor_onboarding`: +`trainer_video_url` TEXT, +`trainer_bio` TEXT
- `thermocheck.thermocheck_auftraege`: +`coaching_gebucht_von` UUID, +`coaching_gebucht_am` TIMESTAMPTZ
- Neue RPC: `thermocheck.book_coaching_ride(p_auftrag_id UUID)` – SECURITY DEFINER, atomar mit FOR UPDATE

### Datenfluss
```
thermocheck_auftraege (zugewiesener_techniker_id = Trainer mit is_trainer=true)
    ├── thermocheck_terminvorschlaege (bis zu 3 Datumsvorschläge)
    ├── profiles (Trainer-Name, Avatar)
    └── contractor_onboarding (trainer_video_url, trainer_bio)
```

### Dateien
| Datei | Änderung |
|---|---|
| `src/hooks/useCoachingSlots.ts` | Komplett umgeschrieben: useAvailableCoachingRides, useMyBookedRide, useBookCoachingRide |
| `src/hooks/useIsTrainer.ts` | NEU: Prüft is_trainer Flag |
| `src/hooks/useTrainerProfile.ts` | NEU: CRUD für trainer_video_url/bio |
| `src/types/onboarding.ts` | CoachingSlot mit termine[], coachVideoUrl, coachBio |
| `src/components/onboarding/steps/CoachingStep.tsx` | Expandable Cards + Multi-Termin-Chips + Video-Player |
| `src/components/OnboardingScreen.tsx` | Neues Mapping: Rides → CoachingSlot[] |
| `src/components/trainer/TrainerProfileEditor.tsx` | NEU: Self-Service Video/Bio Editor |
| `src/components/ProfileView.tsx` | TrainerProfileEditor Integration |
| `src/pages/Index.tsx` | profileId an ProfileView durchgereicht |

---

## Rollen-Matrix

| Rolle | Sieht Coaching-Rides? | Kann buchen? | Kann Video/Bio bearbeiten? |
|---|---|---|---|
| user (Onboarder) | Ja (via thermocheck RLS) | Ja (RPC) | Nein |
| user (Trainer) | Ja | Nein (RPC prüft: already booked) | Ja (eigene Daten) |
| admin/manager | Ja | Nein (kein Onboarding) | Via DB |

---

## RLS-Analyse

| Tabelle | Operation | Policy | Status |
|---|---|---|---|
| thermocheck_auftraege | SELECT | Auth users (thermocheck schema) | ✅ |
| thermocheck_auftraege | UPDATE (coaching_gebucht_von) | Via SECURITY DEFINER RPC | ✅ Atomar |
| thermocheck_terminvorschlaege | SELECT | Auth users | ✅ |
| contractor_onboarding | SELECT (video/bio) | Auth users | ✅ |
| contractor_onboarding | UPDATE (eigenes video/bio) | Auth users | ✅ |
| profiles | SELECT | true | ✅ |

---

## Edge Cases

| Szenario | Verhalten | Status |
|---|---|---|
| Auftrag ohne Terminvorschläge | Wird nicht angezeigt | ✅ |
| zugewiesener_techniker_id NULL | Wird nicht angezeigt | ✅ |
| Trainer hat kein Video | Kein "Video ansehen"-Button | ✅ |
| Trainer hat keine Bio | Fallback "Erfahrener Thermocheck-Coach" | ✅ |
| Gleichzeitige Buchung | FOR UPDATE Lock, zweiter bekommt Fehler | ✅ |
| Onboarder hat bereits gebucht | RPC gibt Fehler zurück | ✅ |
| Trainer nicht mehr is_trainer | Query filtert automatisch | ✅ |

---

## Known Issues
- Bestehende Security-Linter-Warnings (pre-existing, nicht durch diese Migration verursacht)
- Preis ist hardcoded auf 149€ (kein Preis-Feld auf thermocheck_auftraege)
