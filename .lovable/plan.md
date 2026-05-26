## Problem

Das Panel „Subscription-Health" zeigt aktuell 8 Einträge mit „Gekündigt" — ohne Namen, ohne Kontext, ohne Erklärung, was das überhaupt bedeutet. Recherche in der DB hat zwei Ursachen ergeben:

1. **Namen fehlen**, weil die View `v_subscription_health` `vorname`/`nachname` aus `contractor_onboarding` zieht — die sind dort `NULL`. Die echten Namen liegen in `public.profiles` (z. B. Christian Born, Torsten Lauschke, Vincent Heth, Achim Mönning).
2. **Karteileichen werden mitgezählt**: Subscriptions von Technikern mit `onboarding_status = 'gefeuert'` oder `'abgelehnt'` tauchen weiterhin auf. Beispiel: Achim Mönning ist gefeuert, seine zwei alten Stripe-Subs erscheinen aber noch als „Health-Problem". Außerdem werden zwei Subs pro Person gezählt (google-workspace + scanner-lizenz), was die „8" aufbläht.

## Ziel

Das Panel soll auf einen Blick zeigen: **Wer** im Feinaufmaß-Hub hat ein **echtes** Subscription-Problem, das **jetzt** Aktion erfordert.

## Lösung

### 1. View `v_subscription_health` überarbeiten (Migration)

- Namen + Email aus `public.profiles` joinen (Fallback auf `contractor_onboarding`-Felder).
- Onboarding-Kontext mitgeben: `onboarding_status`, `current_step`.
- Nur Subscriptions von **aktiv onboardenden oder einsatzbereiten Technikern**:
  - Ausschließen: `onboarding_status IN ('gefeuert','abgelehnt')`.
  - Ausschließen: Profile, die nicht im Feinaufmaß-Hub registriert sind (kein `profile_id`-Match).
- `produkt_label` (lesbarer Name aus `contractor_products`) statt nur `produkt_key`.

### 2. Panel UI (`SubscriptionHealthPanel.tsx`)

- **Header-Erklärung**: kurzer Hilfetext / Tooltip am Titel: „Aktive Techniker, deren Stripe-Abo gekündigt, überfällig oder unbezahlt ist. Klick öffnet Details + Stripe-Link."
- **Listeneintrag** zeigt jetzt:
  - **Name + Email** des Technikers (statt nur Produktname).
  - Onboarding-Badge daneben (`Onboarding · Coaching`, `Einsatzbereit`, `Nachweise`).
  - Produkt-Label + Ablaufdatum + Fehler-Counter (wie bisher) in der Subzeile.
- **Counter im Badge** zählt **eindeutige Techniker**, nicht einzelne Subs (eine Person mit 2 gekündigten Subs = 1 Problem).
- Empty-State-Text präziser: „Alle aktiven Techniker haben gültige Abos."

### 3. Detail-Dialog

- Im Header zusätzlich Onboarding-Status + Step anzeigen.
- Direktlink „Im Feinaufmaß-Hub öffnen" (Route `/admin/contractors/:id`) ergänzen, damit man von hier direkt in den Techniker-Datensatz springen kann.

## Technische Details

- Migration: `CREATE OR REPLACE VIEW thermocheck.v_subscription_health` mit `LEFT JOIN public.profiles p ON p.id = co.profile_id` und `WHERE co.onboarding_status NOT IN ('gefeuert','abgelehnt') AND co.profile_id IS NOT NULL`. GRANTs bleiben.
- Hook `useAdminSubscriptionHealth` bekommt zwei neue Felder (`onboarding_status`, `current_step`, `produkt_label`).
- Keine Logik-Änderung am Stripe-Webhook / Reconcile — nur Anzeige.

## Was sich NICHT ändert

- Stripe-Webhook-Verarbeitung, `access_state`-Berechnung, Abgleich-Button bleiben unverändert.
- Subscription-Daten selbst werden nicht gelöscht — nur in dieser Health-View ausgeblendet, wenn der Vertrag beendet ist.
