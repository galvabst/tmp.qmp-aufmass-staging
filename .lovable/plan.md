
# Fix: Ausweiskarte-Bestellung + Mehrfachbestellungen

## Problem 1: Ausweiskarte wird nicht registriert

Die Edge Function `create-checkout-session` erstellt zwar erfolgreich eine Stripe-Session, aber beim Speichern der Bestellung in der DB scheitert der INSERT mit:

```
invalid input value for enum contractor_bestellung_produkt_typ_enum: "zubehoer"
```

**Ursache:** Die Ausweiskarte ist in `contractor_produkte` als Typ `zubehoer` konfiguriert, aber das Enum `contractor_bestellung_produkt_typ_enum` kennt nur `kleidung`, `lizenz`, `coaching`.

**Loesung:** Das Enum um den Wert `zubehoer` erweitern.

## Problem 2: Keine Mehrfachbestellungen moeglich

Ein `UNIQUE(onboarding_id, produkt_key)` Constraint verhindert, dass dasselbe Produkt mehrfach bestellt werden kann. Fuer Kleidung (z.B. 2x T-Shirt) ist das ein Problem.

**Loesung:** Den Unique Constraint entfernen. Die Eindeutigkeit wird stattdessen ueber die `stripe_session_id` sichergestellt (jede Checkout-Session ist ohnehin einzigartig). Die Edge Function muss angepasst werden, damit sie bei Pflichtprodukten eine bestehende pending-Bestellung wiederverwendet, aber bei optionalen Nachbestellungen eine neue anlegt.

Da im aktuellen Onboarding-Flow aber erstmal jedes Produkt genau einmal bestellt werden muss (Pflichtbestellungen), wuerde ich die Mehrfachbestellungen als separates Feature betrachten. Fuer jetzt konzentrieren wir uns darauf, dass alle Pflichtprodukte ueberhaupt bestellt werden koennen.

## Aenderungen

### Datenbank-Migration

```sql
ALTER TYPE thermocheck.contractor_bestellung_produkt_typ_enum ADD VALUE IF NOT EXISTS 'zubehoer';
```

Das ist alles. Kein Code-Change noetig -- die Edge Function funktioniert bereits korrekt, nur der Enum-Wert fehlt.

### Zusammenfassung

| Bereich | Aenderung |
|---------|-----------|
| DB-Migration | Enum `contractor_bestellung_produkt_typ_enum` um `zubehoer` erweitern |

### Ergebnis

Nach der Migration wird die Ausweiskarte korrekt als Bestellung gespeichert und der Stripe-Webhook kann den Zahlungsstatus aktualisieren. Die bereits erstellten Stripe-Sessions (die der User bezahlt hat) werden beim naechsten Webhook-Event ebenfalls korrekt verarbeitet.

### Mehrfachbestellungen (spaeter)

Das Thema "mehrere T-Shirts kaufen" ist ein separates Feature, das nach dem Basis-Onboarding angegangen werden kann. Es erfordert Aenderungen am Unique Constraint, an der Edge Function und an der UI.
