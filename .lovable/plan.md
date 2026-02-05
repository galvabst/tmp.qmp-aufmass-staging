

# DB-Bereinigung: Single Source of Truth + Produkt-Katalog

## Status: ✅ ABGESCHLOSSEN (Datenbank-Teil)

### Durchgeführte Änderungen:

| # | Aktion | Status |
|---|--------|--------|
| 1 | `thermocheck.contractor_produkte` erstellt + 7 Produkte eingefügt | ✅ |
| 2 | `contractor_bestellungen`: `groesse`, `empfangsfoto_url`, `empfang_confirmed_at` hinzugefügt | ✅ |
| 3 | `contractor_bestellungen`: Index auf `produkt_key` | ✅ |
| 4 | `contractor_branding` Daten migriert | ✅ |
| 5 | `contractor_branding` gelöscht | ✅ |
| 6 | `contractor_onboarding`: Größen-Spalten entfernt (`tshirt_groesse`, etc.) | ✅ |
| 7 | `groessen_info` JSONB aus `contractor_bestellungen` entfernt | ✅ |
| 8 | RPC `thermocheck.update_bestellung_groesse()` erstellt | ✅ |

### Verbleibend (Frontend):

| # | Aktion | Status |
|---|--------|--------|
| 1 | `useContractorProducts.ts` Hook erstellen | ⏳ |
| 2 | `OrdersStep.tsx` auf DB-Produkte umstellen | ⏳ |
| 3 | `MOCK_PRODUCTS` aus `onboarding-config.ts` entfernen | ⏳ |

---

## Finale Tabellenstruktur (SSoT)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        thermocheck.contractor_onboarding                    │
│                        (SSoT: Contractor-Profil & Status)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, profile_id, anschrift_*, ag_domain_email                                │
│ onboarding_status, onboarding_substatus                                     │
│ trainer_freigabe, trainer_freigabe_am, trainer_freigabe_von                 │
│ vertragsbeginn, deadline_aktivierung, aktivierungszeitpunkt                 │
│ KEINE Größen-Spalten mehr!                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:n
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        thermocheck.contractor_bestellungen                  │
│                        (SSoT: Stripe-Bestellungen)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, onboarding_id (FK)                                                      │
│ produkt_key (referenziert contractor_produkte)                              │
│ groesse (TEXT - einfach statt JSONB)                                        │
│ stripe_session_id, stripe_payment_status, stripe_payment_intent_id          │
│ betrag_netto, betrag_brutto, paid_at                                        │
│ empfangsfoto_url, empfang_confirmed_at (von branding übernommen)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ n:1
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        thermocheck.contractor_produkte                      │
│                        (SSoT: Produkt-Katalog mit Stripe)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, produkt_key (UNIQUE)                                                    │
│ name, beschreibung, produkt_typ (ENUM: kleidung/lizenz/zubehoer)            │
│ preis_netto, preis_brutto, ist_abo, abo_intervall                           │
│ stripe_price_id, stripe_test_price_id                                       │
│ extern_link, reihenfolge, braucht_groesse, ist_pflicht, ist_aktiv           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Produkte in DB (7 Stück)

| produkt_key | name | stripe_price_id | ist_abo |
|-------------|------|-----------------|---------|
| tshirt | Thermocheck T-Shirt | price_1SvgcrLnjPqrEfxxgvConSYk | false |
| poloshirt | Thermocheck Poloshirt | price_1SvgtgLnjPqrEfxxEneJQgW0 | false |
| schlappen | Thermocheck Hausschuhe | price_1SvgwYLnjPqrEfxxldTsLr6R | false |
| pullover | Thermocheck Pullover | price_1SvgvELnjPqrEfxx4N5BArSC | false |
| ausweiskarte | Thermocheck Ausweiskarte | price_1SvgZrLnjPqrEfxx9ByGa0UB | false |
| scanner-lizenz | Room Scanner Lizenz | price_1SvhF0LnjPqrEfxxNZn53Ydt | true |
| google-workspace | Google Workspace | price_1Svh1QLnjPqrEfxxhoLlUgo6 | true |
