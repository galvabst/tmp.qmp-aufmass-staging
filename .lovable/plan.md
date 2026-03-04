

# Plan: Abgabe-Countdown, Late Fees & Angebotstermin-Timer

## Zusammenfassung

Drei zusammenhängende Features auf jeder Auftragskarte (Buchungen, Aktiv, Prüfung):
1. **24h-Countdown** nach Termin-Ende zur Formular-Abgabe
2. **Late Fees** (€50 Basis + €4/h) bei Überschreitung, persistiert in DB
3. **Angebotstermin-Countdown** aus `public.termine` (via `lead_id`, `visit_type = 'ag'`)

---

## 1. DB-Schema: Late Fees persistieren

### Neue Tabelle `thermocheck.contractor_verspaetungen`
```
id uuid PK
thermocheck_auftrag_id uuid FK UNIQUE
contractor_onboarding_id uuid FK
termin_ende timestamptz NOT NULL       -- Deadline (termin_datum + zeit_bis + 24h)
eingereicht_am timestamptz             -- Wann tatsächlich eingereicht
verspaetung_minuten integer            -- Berechnet bei Einreichung
grundgebuehr numeric DEFAULT 50        -- €50 Basis
stundensatz numeric DEFAULT 4          -- €4/h
gesamtbetrag numeric                   -- Berechnet bei Einreichung
created_at timestamptz DEFAULT now()
```

### Trigger auf `thermocheck_auftraege`
- Bei UPDATE von `eingereicht_am` (von NULL auf Wert): 
  - Berechne Deadline = `termin.datum + termin.zeit_bis + 24h`
  - Wenn `eingereicht_am > deadline`: INSERT in `contractor_verspaetungen` mit berechneter Strafe
  - Formel: `50 + CEIL(überschrittene_stunden) * 4`

### RLS
- Techniker darf eigene Verspätungen lesen (via `contractor_onboarding_id`)
- Admin darf alle lesen

---

## 2. Frontend: Countdown-Komponente

### Neues Utility `src/lib/late-fee-calculator.ts`
- `calculateDeadline(scheduledDate, zeit_bis)` → Date (Termin-Ende + 24h)
- `calculateLateFee(deadlineDate)` → `{ isOverdue, hoursOverdue, fee }`
- Fee-Formel: `50 + Math.ceil(hoursOver24) * 4`

### Neue Komponente `src/components/DeadlineCountdown.tsx`
- Zeigt live Countdown bis Deadline (hh:mm:ss oder "X Std Y Min")
- Bei Überschreitung: Rot + animiert + "ÜBERFÄLLIG" + berechnete Strafe in €
- `useEffect` mit 1-Sekunden-Intervall für Live-Update

---

## 3. Angebotstermin-Fetch

### Hook `src/hooks/useAngebotstermine.ts`
- Input: Array von `lead_id`s aus den geladenen Aufträgen
- Fetch: `public.termine` WHERE `lead_id IN (...)` AND `visit_type = 'ag'`
- Return: `Map<lead_id, { start_datetime, end_datetime }>`

### Integration in `useMyAssignedOrders.ts`
- `lead_id` zum SELECT der View hinzufügen
- An `TechnicianOrder` als neues Feld `leadId` durchreichen

### `TechnicianOrder` erweitern
- `leadId?: string`
- `angebotsterminAt?: string` (start_datetime des AG-Termins)

---

## 4. UI-Integration auf Auftragskarten

### `BookingsView.tsx`
- Unter Vergütung: Countdown-Badge "Abgabe in X Std" oder "ÜBERFÄLLIG: €XX Strafe"
- Angebotstermin-Badge: "AG-Termin in X Tagen" oder "AG-Termin: DD.MM."

### `ActiveOrdersView.tsx`
- Gleiche Countdown-Anzeige, prominenter (roter Banner bei Überfälligkeit)

### `ReviewView.tsx`
- Falls verspätet eingereicht: "Verspätet eingereicht · Late Fee: €XX"

---

## 5. Profil-Statistik: Pünktlichkeit

### `ProfileView.tsx`
- Neuer Abschnitt "Pünktlichkeit" mit:
  - Anzahl pünktlicher vs. verspäteter Einreichungen
  - Gesamt Late Fees (offen)
  - Prozent pünktlich

### Hook `src/hooks/useContractorVerspaetungen.ts`
- Fetch `contractor_verspaetungen` für eigenen `contractor_onboarding_id`

---

## Datenfluss

```text
Termin (datum + zeit_bis)
  → +24h = Deadline
  → Frontend: Live-Countdown
  → Bei Einreichung (DB-Trigger): Verspätung berechnen + persistieren
  → Profil: Aggregierte Pünktlichkeits-Statistik
```

## Betroffene Dateien
- `supabase/migrations/` — Neue Tabelle + Trigger
- `src/types/technician.ts` — `leadId`, `angebotsterminAt`
- `src/hooks/useMyAssignedOrders.ts` — `lead_id` fetchen
- `src/hooks/useAngebotstermine.ts` — Neuer Hook
- `src/hooks/useContractorVerspaetungen.ts` — Neuer Hook
- `src/lib/late-fee-calculator.ts` — Berechnungslogik
- `src/components/DeadlineCountdown.tsx` — Countdown-Komponente
- `src/components/BookingsView.tsx` — Timer + AG-Termin anzeigen
- `src/components/ActiveOrdersView.tsx` — Timer anzeigen
- `src/components/ReviewView.tsx` — Verspätungs-Badge
- `src/components/ProfileView.tsx` — Pünktlichkeits-Sektion

