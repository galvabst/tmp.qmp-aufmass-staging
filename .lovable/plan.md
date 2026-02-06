

# Mehrfachbestellungen fuer Kleidung + Nachbestellung nach Onboarding

## Uebersicht

Contractors sollen bei Kleidungsprodukten (T-Shirt, Poloshirt, Pullover, Schlappen) eine Menge waehlen koennen. Lizenzen und Ausweiskarte bleiben immer Einzelstueck. Nachbestellungen sollen auch nach dem Onboarding moeglich sein.

## Was sich aendern muss

### 1. Datenbank

**Problem**: Es gibt einen `UNIQUE(onboarding_id, produkt_key)` Constraint auf `contractor_bestellungen`. Damit kann ein Contractor pro Produkt nur EINE Zeile haben. Fuer Mehrfachbestellungen (z.B. 3 T-Shirts) muss das angepasst werden.

**Loesung**:
- `UNIQUE(onboarding_id, produkt_key)` entfernen
- Neue Spalte `menge` (integer, default 1) auf `contractor_bestellungen`
- Neue Spalte `erlaubt_mehrfach` (boolean, default false) auf `contractor_produkte`
- `erlaubt_mehrfach = true` setzen fuer: tshirt, poloshirt, pullover, schlappen
- `erlaubt_mehrfach = false` bleibt fuer: ausweiskarte, scanner-lizenz, google-workspace

### 2. Edge Function: `create-checkout-session`

- Neues Feld `menge` im Request Body akzeptieren (optional, default 1)
- Validierung: Wenn Produkt `erlaubt_mehrfach = false` hat, muss `menge = 1` sein
- Validierung: `menge` muss zwischen 1 und 10 liegen (sinnvolle Obergrenze)
- `quantity` in Stripe Checkout Session dynamisch setzen statt hardcoded `1`
- `menge` in `contractor_bestellungen` speichern
- Bei Nicht-Mehrfach-Produkten: Bestehende Logik beibehalten (nur pending Order updaten)
- Bei Mehrfach-Produkten: Immer neue Bestellung anlegen (kein Upsert auf pending)

### 3. Frontend: Onboarding OrdersStep

- Mengenfeld (+/- Stepper) fuer Produkte mit `erlaubt_mehrfach = true`
- Lizenzen und Ausweiskarte: Kein Mengenfeld, weiterhin 1 Stueck
- Oberteil-Varianten (T-Shirt/Poloshirt): Mengenfeld pro Variante
- `useStripeCheckout` Hook erweitern um `menge` Parameter

### 4. Nach-Onboarding: Nachbestell-Seite (spaetere Phase)

Eine separate Seite/Bereich fuer fertige Contractors, wo sie erneut Kleidung bestellen koennen. Das ist ein eigenstaendiges Feature, das NACH der Mengen-Logik gebaut wird.

**Empfehlung**: Erstmal nur die Mengenauswahl im Onboarding implementieren. Die Nachbestell-Seite als zweiten Schritt, da sie eigene UI, Navigation und Zugangslogik braucht.

## Technische Details

### Migration SQL

```text
-- 1. Menge-Spalte auf contractor_bestellungen
ALTER TABLE thermocheck.contractor_bestellungen
ADD COLUMN menge integer NOT NULL DEFAULT 1;

-- 2. UNIQUE Constraint entfernen (erlaubt mehrere Bestellungen pro Produkt)
ALTER TABLE thermocheck.contractor_bestellungen
DROP CONSTRAINT unique_onboarding_product;

-- 3. Neuer UNIQUE Constraint auf stripe_session_id (1 Bestellung pro Checkout)
ALTER TABLE thermocheck.contractor_bestellungen
ADD CONSTRAINT unique_stripe_session UNIQUE (stripe_session_id);

-- 4. Mehrfach-Flag auf contractor_produkte
ALTER TABLE thermocheck.contractor_produkte
ADD COLUMN erlaubt_mehrfach boolean NOT NULL DEFAULT false;

-- 5. Kleidung als mehrfach bestellbar markieren
UPDATE thermocheck.contractor_produkte
SET erlaubt_mehrfach = true
WHERE produkt_key IN ('tshirt', 'poloshirt', 'pullover', 'schlappen');
```

### Edge Function Aenderungen (`create-checkout-session/index.ts`)

1. Interface erweitern: `menge?: number` im `CheckoutRequest`
2. Validierung: `menge` aus Body lesen, default 1, Bereich 1-10
3. Produkt-Check: Wenn `erlaubt_mehrfach = false` und `menge > 1` -> Fehler 400
4. Stripe Session: `quantity: menge` statt `quantity: 1`
5. DB-Insert: `menge` Spalte befuellen
6. Upsert-Logik anpassen: Bei `erlaubt_mehrfach`-Produkten immer INSERT (kein Update auf pending)

### Frontend Aenderungen

1. **`useStripeCheckout` Hook**: `startCheckout(produktKey, groesse, menge)` Signatur
2. **`OrdersStep` Komponente**: Mengen-Stepper UI fuer Kleidungsprodukte
3. **Neues UI-Element**: `QuantitySelector` Komponente (einfacher +/- Stepper mit Min 1 / Max 10)
4. **`useContractorProducts` Hook**: `erlaubt_mehrfach` Feld aus DB laden (falls noch nicht vorhanden)

### Webhook: Keine Aenderungen noetig

Der Webhook verarbeitet bereits jede Checkout-Session einzeln per `stripe_session_id`. Durch den neuen UNIQUE Constraint auf `stripe_session_id` bleibt die Idempotenz gewahrt.

## Reihenfolge der Implementation

1. DB-Migration (Spalten + Constraints)
2. Edge Function `create-checkout-session` erweitern
3. Frontend: QuantitySelector Komponente
4. Frontend: OrdersStep + useStripeCheckout anpassen
5. Testen mit Kleidungsprodukten
6. (Spaeter) Nachbestell-Seite fuer fertige Contractors

## Risiken und Massnahmen

| Risiko | Massnahme |
|--------|-----------|
| Bestehende Bestellungen ohne `menge` | Default 1 in Migration, kein Breaking Change |
| Doppelte Bestellungen bei Nicht-Mehrfach-Produkten | Validierung in Edge Function: `erlaubt_mehrfach = false` -> pruefen ob bereits `paid` Order existiert |
| `stripe_session_id` NULL bei alten Eintraegen | UNIQUE Constraint erlaubt NULL (PostgreSQL Default), kein Problem |

