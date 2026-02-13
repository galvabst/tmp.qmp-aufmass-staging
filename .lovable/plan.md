

## Trainer-Freigabe-Gate mit ENUM-Feldern (kein Freitext)

### Ueberblick

Der Nachweise-Schritt (letzter Onboarding-Schritt) wird blockiert, bis der Trainer nach der Mitfahrt die Freigabe erteilt. Alle Status-Felder verwenden ausschliesslich ENUMs -- kein Freitext.

---

### 1. Neuer Postgres ENUM-Typ

```sql
CREATE TYPE thermocheck.coaching_bewertung_enum AS ENUM (
  'ausstehend',
  'bestanden',
  'nicht_bestanden'
);
```

### 2. Datenbank-Migration

Neue Spalten in `thermocheck.contractor_onboarding`:

| Spalte | Typ | Default | Beschreibung |
|--------|-----|---------|-------------|
| coaching_bewertung | thermocheck.coaching_bewertung_enum | 'ausstehend' | Trainer-Entscheidung |
| coaching_bewertung_am | timestamptz | null | Zeitpunkt der Bewertung |
| gebuchter_coaching_termin | date | null | Datum des Termins (Anzeige) |
| gebuchter_coach_name | text | null | Name des Trainers (Anzeige) |

Kein Kommentar-Feld (war Freitext) -- stattdessen genuegt der ENUM-Status.

### 3. TypeScript ENUM in `src/lib/enums.ts`

```typescript
// COACHING BEWERTUNG
export const COACHING_BEWERTUNG_VALUES = [
  'ausstehend',
  'bestanden', 
  'nicht_bestanden'
] as const;

export type CoachingBewertungEnum = typeof COACHING_BEWERTUNG_VALUES[number];

export const COACHING_BEWERTUNG_LABELS: Record<CoachingBewertungEnum, string> = {
  'ausstehend': 'Ausstehend',
  'bestanden': 'Bestanden',
  'nicht_bestanden': 'Nicht bestanden'
};
```

### 4. UI-Aenderungen im Nachweise-Schritt (`ProofStep.tsx`)

Neuer Bereich unterhalb des Gesamtfotos:

- **coaching_bewertung = 'ausstehend'**: Lock-Icon + grauer Info-Kasten mit gebuchtem Termin-Datum und Trainer-Name. Text: "Der Trainer gibt dir die Freigabe nach eigenem Ermessen nach deinem Termin." Button "Onboarding abschliessen" ist grau/disabled.
- **coaching_bewertung = 'bestanden'**: Gruener Haken, Button aktiv.
- **coaching_bewertung = 'nicht_bestanden'**: Contractor wird zurueckgestuft auf Coaching-Schritt (siehe Punkt 6).

Neue Props fuer `ProofStep`:
- `coachingBewertung: CoachingBewertungEnum`
- `coachingTermin?: string` (Datum)
- `coachName?: string`

### 5. OnboardingScreen-Aenderungen

- `nextDisabled` im Nachweise-Schritt: zusaetzlich pruefen ob `coaching_bewertung === 'bestanden'`
- Coaching-Bewertung aus `useContractorProfile` laden (neue DB-Felder)
- An `ProofStep` als Props durchreichen

### 6. Rueckstufungs-Flow bei 'nicht_bestanden'

- Wenn `coaching_bewertung === 'nicht_bestanden'` aus DB kommt:
  - `current_step` wird auf `'coaching'` gesetzt
  - `'coaching'` wird aus `completed_steps` entfernt
  - Im Coaching-Schritt erscheint ein Warn-Banner: "Eine weitere Mitfahrt ist erforderlich."
  - Contractor muss neuen Termin buchen
  - Nach Buchung wird `coaching_bewertung` auf `'ausstehend'` zurueckgesetzt

### 7. Trainer-UI (`QGQueueView.tsx`)

Zwei Buttons pro Onboarding-Eintrag:
- "Freigeben" setzt `coaching_bewertung = 'bestanden'`
- "Zurueckstufen" setzt `coaching_bewertung = 'nicht_bestanden'` + aktualisiert `completed_steps` und `current_step`

### 8. Betroffene Dateien

- **Migration**: Neuer ENUM-Typ + ALTER TABLE
- `src/lib/enums.ts`: Neuer ENUM-Block
- `src/components/onboarding/steps/ProofStep.tsx`: Freigabe-Gate UI
- `src/components/OnboardingScreen.tsx`: Button-Disable + Props weiterleiten
- `src/components/onboarding/steps/CoachingStep.tsx`: Warn-Banner bei nicht_bestanden
- `src/hooks/useContractorProfile.ts`: Neue Felder laden
- `src/hooks/useOnboardingState.ts`: isComplete-Pruefung anpassen
- `src/features/quality-gate/ui/QGQueueView.tsx`: Trainer-Buttons

