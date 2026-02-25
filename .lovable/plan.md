

# Analyse: Warum bleiben Bestellungen auf "pending"?

## Zwei Probleme gefunden

### Problem 1: Webhook-Funktion ist nicht (oder veraltet) deployed

**Beweis:**
- **Alle** bezahlten Bestellungen haben `webhook_received_at = NULL` — das bedeutet, die aktuelle Webhook-Logik (die `webhook_received_at` setzt) wurde **nie** ausgefuehrt
- Das Stripe-Event `evt_1T4oayLnjPqrEfxxzy5ErhxQ` (checkout.session.completed um 20:22:13) existiert **nicht** im `contractor_audit_log` — obwohl die aktuelle Codeversion immer einen Audit-Eintrag schreibt
- Keine Edge-Function-Logs fuer `stripe-webhook` verfuegbar
- Stripe zeigt 200 OK — also laeuft *irgendeine* Version, aber nicht die aktuelle aus dem Repository

**Fazit:** Die `stripe-webhook`-Edge-Function muss **neu deployed** werden. Der Code im Repository ist korrekt, aber er laeuft nicht auf Supabase.

### Problem 2: `erlaubt_mehrfach = true` erzeugt verwaiste Pending-Rows

Das T-Shirt-Produkt hat `erlaubt_mehrfach = true`. Dadurch erstellt `create-checkout-session` bei **jedem** Checkout-Klick eine **neue** Zeile statt die vorherige zu aktualisieren:

```text
Klick 1 → Row A (session X, pending)
User bricht ab
Klick 2 → Row B (session Y, pending)  ← Row A bleibt pending!
User bezahlt
Webhook  → Row B → paid               ← Row A bleibt FUER IMMER pending
```

Ergebnis: 3 pending T-Shirt-Bestellungen fuer `onboarding_id = 0e72061a`, jede mit einer anderen `stripe_session_id`.

## Loesung

### Schritt 1: Webhook neu deployen (kein Code-Aenderung noetig)

Die `stripe-webhook`-Funktion muss einmalig deployed werden. Der Code ist bereits korrekt.

### Schritt 2: Code-Fix in `create-checkout-session` (verhindert verwaiste Rows)

**Datei:** `supabase/functions/create-checkout-session/index.ts`

Fuer `erlaubt_mehrfach`-Produkte: Vor dem INSERT einer neuen Zeile, die **letzte pending-Bestellung** desselben Produkts fuer denselben Onboarding-Nutzer suchen und **updaten** statt neu zu erstellen. Nur wenn keine pending-Bestellung existiert, wird eine neue Zeile eingefuegt.

```typescript
// Zeilen 237-253: erlaubt_mehrfach-Block aendern
if (produkt.erlaubt_mehrfach) {
  // Erst pruefen, ob bereits eine pending-Bestellung existiert
  const { data: existingMulti } = await supabaseAdmin
    .schema("thermocheck")
    .from("contractor_bestellungen")
    .select("id")
    .eq("onboarding_id", onboarding.id)
    .eq("produkt_key", item.produkt_key)
    .eq("stripe_payment_status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingMulti) {
    // Update statt Insert
    await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .update({
        stripe_session_id: session.id,
        stripe_customer_id: customerId,
        groesse: item.groesse || null,
        menge,
      })
      .eq("id", existingMulti.id);
  } else {
    // Neue Zeile nur wenn keine pending existiert
    await supabaseAdmin
      .schema("thermocheck")
      .from("contractor_bestellungen")
      .insert({ /* ... bestehender Code ... */ });
  }
}
```

### Schritt 3: Verwaiste Pending-Rows bereinigen

Die bestehenden verwaisten Pending-Bestellungen, deren Stripe-Sessions bereits abgelaufen sind, sollten auf `failed` gesetzt werden. Das kann per SQL-Update erfolgen.

## Dateien

| Aktion | Datei |
|---|---|
| Deploy | `supabase/functions/stripe-webhook/index.ts` |
| Aendern | `supabase/functions/create-checkout-session/index.ts` (erlaubt_mehrfach-Logik) |
| Daten-Update | Verwaiste pending-Bestellungen auf `failed` setzen |

