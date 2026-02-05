

# Größen-Tracking für Onboarding-Bestellungen implementieren

## Analyse: Aktueller Stand

### Datenbank (thermocheck-Schema)
Die Struktur ist bereits gut vorbereitet:

| Tabelle | Relevante Spalten |
|---------|-------------------|
| `contractor_onboarding` | `anschrift_strasse`, `anschrift_plz`, `anschrift_ort` ✅ |
| `contractor_bestellungen` | `produkt_key`, `stripe_payment_status`, `groessen_info` (JSONB) ✅ |
| `contractor_admin_tasks` | Für Backoffice-Tasks nach Bestellung ✅ |

### Frontend (OrdersStep.tsx)
Aktuell fehlt:
1. **Keine Größenabfrage** - User klickt nur "Jetzt bestellen"
2. **Keine DB-Speicherung** - Bestellungen nur in localStorage
3. **Keine Größen-UI** für T-Shirt, Poloshirt, Pullover, Schlappen

---

## Lösung

### 1. Neue Spalten in `contractor_onboarding` (Alternative zu JSONB in bestellungen)

Da die Größen pro Techniker einmalig festgelegt werden und für ALLE Bestellungen gelten, macht es Sinn diese zentral zu speichern:

```sql
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN tshirt_groesse text,         -- z.B. 'S', 'M', 'L', 'XL', 'XXL'
ADD COLUMN poloshirt_groesse text,
ADD COLUMN pullover_groesse text,
ADD COLUMN schuh_groesse text;          -- z.B. '42', '43', etc.
```

**Begründung**: 
- Größen gehören zum Techniker-Profil, nicht zur einzelnen Bestellung
- Ermöglicht Nachbestellungen ohne erneute Größenabfrage
- Einfacher für Backoffice-Ansicht

### 2. Größen-Auswahl-UI vor der Bestellung

Im `OrdersStep.tsx` bei Kleidungsartikeln:
1. **Vor "Jetzt bestellen"**: Größenauswahl-Dropdown anzeigen
2. Größe speichern in `contractor_onboarding` via RPC
3. Erst dann Shop-Link öffnen + Bestätigungs-Dialog

### 3. Bestellungen in DB tracken

Neue Funktion die beim "Ja, bestellt"-Klick:
1. Eintrag in `contractor_bestellungen` erstellen
2. `groessen_info` JSONB befüllen
3. Admin-Task in `contractor_admin_tasks` erstellen für Versand

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `supabase/migrations/xxx.sql` | Größen-Spalten in `contractor_onboarding` |
| `src/types/onboarding.ts` | `ApplicantProfile` um Größen erweitern |
| `src/components/onboarding/steps/OrdersStep.tsx` | Größenauswahl-UI hinzufügen |
| `src/hooks/useOnboardingOrders.ts` | NEUER Hook: Bestellungen in DB speichern |
| `src/lib/onboarding-config.ts` | Größen-Optionen definieren |

---

## UI-Änderungen für OrdersStep

```text
┌─────────────────────────────────────────┐
│  Thermocheck T-Shirt                    │
│  [Bild Slideshow]                       │
│                                         │
│  Größe auswählen:                       │
│  [S] [M] [L] [XL] [XXL]   ← NEU         │
│                                         │
│  [🛒 Jetzt bestellen]                   │
└─────────────────────────────────────────┘
```

Für Schlappen analog:
```text
│  Schuhgröße:                            │
│  [38] [39] [40] [41] [42] [43] [44] [45]│
```

---

## Datenfluss

```text
1. User wählt Größe → speichert in contractor_onboarding
2. User klickt "Jetzt bestellen" → Shop öffnet sich
3. User bestätigt "Ja, bestellt"
   → Eintrag in contractor_bestellungen (mit groessen_info)
   → Admin-Task für Versand erstellt
4. Backoffice sieht: Name, Adresse, Produkt, Größe
```

---

## Migration SQL

```sql
-- Größen-Spalten für Onboarding hinzufügen
ALTER TABLE thermocheck.contractor_onboarding
ADD COLUMN IF NOT EXISTS tshirt_groesse text,
ADD COLUMN IF NOT EXISTS poloshirt_groesse text,  
ADD COLUMN IF NOT EXISTS pullover_groesse text,
ADD COLUMN IF NOT EXISTS schuh_groesse text;

-- Optional: ENUMs für Validierung (empfohlen gemäß LOVABLE_BEHAVIOUR Regel 4)
CREATE TYPE thermocheck.kleidungsgroesse_enum AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL');
CREATE TYPE thermocheck.schuhgroesse_enum AS ENUM ('36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47');

-- Spalten mit ENUMs (alternative Variante)
-- ALTER TABLE thermocheck.contractor_onboarding
-- ADD COLUMN tshirt_groesse thermocheck.kleidungsgroesse_enum,
-- ...
```

---

## Testplan

1. User öffnet Bestellungen-Schritt
2. Bei T-Shirt: Größenauswahl erscheint
3. User wählt "L" → wird gespeichert
4. User klickt "Jetzt bestellen"
5. In Supabase prüfen:
   - `contractor_onboarding.tshirt_groesse = 'L'`
   - `contractor_bestellungen` hat neuen Eintrag mit `groessen_info`

---

## Offene Frage

**ENUMs oder Text?**
- ENUMs sind sauberer (gemäß LOVABLE_BEHAVIOUR Regel 4)
- Aber: Größen könnten sich ändern (z.B. "3XL" hinzufügen)
- Empfehlung: ENUMs verwenden, da Größen relativ stabil sind

Soll ich mit ENUMs oder text-Spalten arbeiten?

