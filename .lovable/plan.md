
# Architektur-Plan: Onboarding-Datenpersistenz

## Zusammenfassung

Dieser Plan definiert die Datenbank-Architektur für die persistente Speicherung des Onboarding-Fortschritts, der Bestellungen und der Akademie-Videos – mit Echtzeit-Sync über Geräte hinweg.

---

## Ist-Zustand (Was bereits existiert)

| Komponente | Status |
|------------|--------|
| `contractor_onboarding` | ✅ Vorhanden, hat bereits `profile_id` |
| `contractor_akademie_lektions_fortschritt` | ✅ Vorhanden, hat `video_progress_seconds` |
| `contractor_admin_tasks` | ✅ Vorhanden, für Backoffice-Aufgaben |
| Bestellungen-Tabelle | ❌ Fehlt |
| Content-Versionierung | ❌ Fehlt (`content_version` Feld) |
| Trainer-Freigabe | ❌ Fehlt in `contractor_onboarding` |
| Frontend DB-Sync | ❌ Nutzt nur localStorage |

---

## Architektur-Entscheidungen

### 1. Verknüpfungs-Strategie

```text
                     ┌─────────────────────┐
                     │   public.profiles   │ ← Single Source of Truth (User)
                     │        (id)         │
                     └──────────┬──────────┘
                                │
                                │ profile_id (FK)
                                ▼
                     ┌─────────────────────────────┐
                     │  contractor_onboarding      │ ← Zentrale Onboarding-Tabelle
                     │  - id                       │
                     │  - profile_id (→ profiles)  │
                     │  - trainer_freigabe         │ ← NEU
                     │  - trainer_freigabe_am      │ ← NEU
                     │  - trainer_freigabe_von     │ ← NEU
                     └──────────┬──────────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ contractor_      │ │ contractor_      │ │ contractor_      │
│ bestellungen     │ │ akademie_        │ │ admin_tasks      │
│ (NEU)            │ │ lektions_        │ │ (Backoffice)     │
│                  │ │ fortschritt      │ │                  │
│ - onboarding_id  │ │ - contractor_id  │ │ - contractor_id  │
│ - stripe_*       │ │   (→ onboarding) │ │   (→ onboarding) │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Wichtig**: `contractor_id` in allen Tabellen verweist auf `contractor_onboarding.id` (nicht auf `profiles.id`), da alle Daten onboarding-spezifisch sind.

---

## Geplante Änderungen

### Schritt 1: Content-Versionierung für Akademie

**Tabelle**: `contractor_akademie_lektionen`

| Neue Spalte | Typ | Zweck |
|-------------|-----|-------|
| `content_version` | `integer` | Wird nur hochgezählt bei inhaltlichen Änderungen (neues Video) |

**Tabelle**: `contractor_akademie_lektions_fortschritt`

| Neue Spalte | Typ | Zweck |
|-------------|-----|-------|
| `completed_for_version` | `integer` | Bei welcher Content-Version wurde abgeschlossen |

**Logik**: Wenn `content_version > completed_for_version` → User muss Video erneut ansehen.

---

### Schritt 2: Trainer-Freigabe in Onboarding

**Tabelle**: `contractor_onboarding`

| Neue Spalte | Typ | Zweck |
|-------------|-----|-------|
| `trainer_freigabe` | `boolean` | Hat Aufmaßtrainer zugestimmt? |
| `trainer_freigabe_am` | `timestamptz` | Wann wurde freigegeben? |
| `trainer_freigabe_von` | `uuid` | Welcher Trainer hat freigegeben? |

**Onboarding-Abschluss-Logik**:
```text
onboarding_status = 'ready' 
  WENN:
    - Alle Akademie-Lektionen abgeschlossen (completed_at gesetzt)
    - trainer_freigabe = true
```

---

### Schritt 3: Bestellungen-Tabelle (NEU)

**Tabelle**: `contractor_bestellungen`

| Spalte | Typ | Zweck |
|--------|-----|-------|
| `id` | `uuid` | Primary Key |
| `onboarding_id` | `uuid` | FK → contractor_onboarding.id |
| `produkt_typ` | `enum` | 'kleidung', 'lizenz', 'coaching' |
| `produkt_key` | `text` | z.B. 'tshirt', 'poloshirt', 'roomscanner', 'workspace' |
| `stripe_session_id` | `text` | Stripe Checkout Session ID |
| `stripe_payment_status` | `enum` | 'pending', 'paid', 'failed', 'refunded' |
| `stripe_payment_intent_id` | `text` | Für Rückerstattungen |
| `betrag_netto` | `numeric` | Bestellbetrag |
| `betrag_brutto` | `numeric` | inkl. MwSt |
| `groessen_info` | `jsonb` | z.B. {"tshirt": "L", "pullover": "XL"} |
| `created_at` | `timestamptz` | Bestellzeitpunkt |
| `paid_at` | `timestamptz` | Zahlungszeitpunkt |

**Trigger**: Bei `paid_at` wird automatisch ein `contractor_admin_tasks` Eintrag erstellt (z.B. "Kleidung versenden", "Google Workspace einrichten").

---

### Schritt 4: Frontend-Sync für Video-Fortschritt

**Aktueller Zustand**: `useOnboardingState.ts` speichert alles in localStorage.

**Neuer Ansatz**:
1. **Beim Laden**: Hole `contractor_akademie_lektions_fortschritt` aus DB
2. **Während Video**: Speichere `video_progress_seconds` alle 5-10 Sekunden in DB
3. **Bei Pause/Tab-Wechsel**: Sofortiger Sync zur DB
4. **Bei Abschluss**: Setze `completed_at` und `completed_for_version`

---

### Schritt 5: Aufmaßtrainer-Tab (UI)

Ein neuer Tab im Aufmaßmeister für berechtigte Trainer:

- Liste aller Techniker mit `akademie_abgeschlossen` aber `trainer_freigabe = false`
- Pro Techniker: Button "Freigeben" / "Ablehnen"
- Bei Freigabe: Setze `trainer_freigabe = true` + Timestamps

---

## ENUM-Ergänzungen

```sql
-- Produkt-Typ für Bestellungen
CREATE TYPE thermocheck.contractor_bestellung_produkt_typ_enum AS ENUM (
  'kleidung',
  'lizenz', 
  'coaching'
);

-- Stripe Payment Status
CREATE TYPE thermocheck.stripe_payment_status_enum AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);
```

---

## Zusammenfassung der Änderungen

| Bereich | Aktion |
|---------|--------|
| `contractor_akademie_lektionen` | + `content_version` (integer) |
| `contractor_akademie_lektions_fortschritt` | + `completed_for_version` (integer) |
| `contractor_onboarding` | + `trainer_freigabe`, `trainer_freigabe_am`, `trainer_freigabe_von` |
| NEU: `contractor_bestellungen` | Komplette Tabelle für Stripe-Käufe |
| Frontend Hooks | Umstellung von localStorage auf DB-Sync |
| UI | Neuer "Trainer-Freigabe" Tab |

---

## Technische Details

### RLS-Policies

- **Bestellungen**: Techniker sieht nur eigene Bestellungen
- **Fortschritt**: Techniker sieht/bearbeitet nur eigenen Fortschritt
- **Trainer-Freigabe**: Nur User mit `app_role = 'coach'` dürfen `trainer_freigabe` setzen

### Stripe-Webhook-Flow

```text
1. User klickt "Bestellen" → Stripe Checkout Session wird erstellt
2. Eintrag in contractor_bestellungen (status: 'pending')
3. User zahlt bei Stripe
4. Stripe sendet Webhook → Edge Function
5. Edge Function: 
   - Update contractor_bestellungen (status: 'paid', paid_at)
   - Erstellt contractor_admin_tasks (z.B. "Kleidung versenden")
6. Frontend zeigt: "Bezahlt ✓"
```

### Sync-Strategie für Video-Fortschritt

- **Debounced Writes**: Alle 5 Sekunden während Wiedergabe
- **Immediate Write**: Bei Pause, Tab-Wechsel, Video-Ende
- **Optimistic UI**: Lokaler State wird sofort aktualisiert, DB-Write im Hintergrund
- **Konflikt-Handling**: DB-Wert gewinnt (immer der höchste `video_progress_seconds`)
