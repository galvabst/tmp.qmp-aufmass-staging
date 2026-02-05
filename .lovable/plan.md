

# DB-Bereinigung: Single Source of Truth + Produkt-Katalog

## Überblick

Die aktuelle Struktur hat mehrere Redundanzen. Wir bereinigen zu einem klaren SSoT-Modell:

```text
VORHER (Redundanz):
┌─────────────────────────────────────────────────────────────────────────────┐
│ contractor_onboarding     │ tshirt_groesse, poloshirt_groesse, etc.        │
│                           │ (Größen hier gespeichert)                       │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ contractor_bestellungen   │ groessen_info (JSONB) ← REDUNDANT!              │
│                           │ (Stripe-Tracking, aber auch Größen)             │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ contractor_branding       │ empfangsfoto_url, lieferadresse_bestaetigt     │
│                           │ ← REDUNDANTE TABELLE (1 Row, wenig Nutzen)      │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ Frontend MOCK_PRODUCTS    │ Hardcoded Produkte ← KEINE DB-VERWALTUNG!       │
└───────────────────────────┴─────────────────────────────────────────────────┘

NACHHER (Sauber):
┌─────────────────────────────────────────────────────────────────────────────┐
│ contractor_onboarding     │ Profil, Status, Trainer-Freigabe                │
│ (SSoT: Person)            │ KEINE Größen mehr (entfernt)                    │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ contractor_bestellungen   │ Stripe-Tracking + Größe pro Bestellung          │
│ (SSoT: Bestellungen)      │ + empfangsfoto_url (von branding übernommen)    │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ contractor_produkte       │ Produkt-Katalog mit Stripe Price IDs            │
│ (SSoT: Produkte) - NEU    │ (ersetzt MOCK_PRODUCTS)                         │
├───────────────────────────┼─────────────────────────────────────────────────┤
│ contractor_branding       │ GELÖSCHT (redundant)                            │
└───────────────────────────┴─────────────────────────────────────────────────┘
```

---

## Schritt 1: Tabelle contractor_branding entfernen

**Aktuelle Spalten:**
- `bestellung_ausgeloest` → Unnötig (wir tracken via contractor_bestellungen)
- `pflichtartikel_verstanden` → Unnötig (UI-State, nicht persistent nötig)
- `lieferadresse_bestaetigt` → Unnötig (Adresse kommt aus contractor_onboarding)
- `empfangsfoto_url` → Nach contractor_bestellungen verschieben
- `empfang_confirmed_at` → Nach contractor_bestellungen verschieben

**Migration:**
1. Spalten zu contractor_bestellungen hinzufügen
2. Daten migrieren (nur 1 Row vorhanden)
3. Tabelle löschen

---

## Schritt 2: Größen-Spalten aus contractor_onboarding entfernen

**Aktuelle Spalten (redundant):**
- `tshirt_groesse`
- `poloshirt_groesse`
- `pullover_groesse`
- `schuh_groesse`

**Warum entfernen?**
- Größe gehört zur BESTELLUNG, nicht zur Person
- contractor_bestellungen hat bereits `groessen_info` (JSONB)
- Wir vereinfachen zu einer einfachen `groesse` TEXT-Spalte pro Bestellung

**Migration:**
1. contractor_bestellungen: `groesse` TEXT-Spalte hinzufügen (statt JSONB)
2. RPC-Funktion `update_contractor_onboarding_size` anpassen → schreibt in contractor_bestellungen
3. Alte Spalten aus contractor_onboarding entfernen

---

## Schritt 3: Neue Tabelle contractor_produkte (Produkt-Katalog)

```text
thermocheck.contractor_produkte
┌─────────────────────────────────────────────────────────────────────────────┐
│ id                    │ uuid (PK)                                           │
│ produkt_key           │ text UNIQUE (z.B. 'tshirt', 'scanner-lizenz')       │
│ name                  │ text                                                │
│ beschreibung          │ text                                                │
│ produkt_typ           │ ENUM (kleidung, lizenz)                             │
│ preis_netto           │ numeric(10,2)                                       │
│ preis_brutto          │ numeric(10,2)                                       │
│ ist_abo               │ boolean (für monatliche Lizenzen)                   │
│ abo_intervall         │ text ('monatlich')                                  │
│ stripe_price_id       │ text (LIVE)                                         │
│ stripe_test_price_id  │ text (TEST)                                         │
│ extern_link           │ text (Shop-URL)                                     │
│ reihenfolge           │ integer                                             │
│ braucht_groesse       │ text ('kleidung' | 'schuhe' | null)                 │
│ ist_pflicht           │ boolean                                             │
│ ist_aktiv             │ boolean                                             │
│ created_at            │ timestamptz                                         │
│ updated_at            │ timestamptz                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Initiale Daten (7 Produkte):**

| produkt_key | name | stripe_price_id | ist_abo | reihenfolge |
|-------------|------|-----------------|---------|-------------|
| tshirt | Thermocheck T-Shirt | price_1SvgcrLnjPqrEfxxgvConSYk | false | 1 |
| poloshirt | Thermocheck Poloshirt | price_1SvgtgLnjPqrEfxxEneJQgW0 | false | 2 |
| schlappen | Thermocheck Hausschuhe | price_1SvgwYLnjPqrEfxxldTsLr6R | false | 3 |
| pullover | Thermocheck Pullover | price_1SvgvELnjPqrEfxx4N5BArSC | false | 4 |
| ausweiskarte | Thermocheck Ausweiskarte | price_1SvgZrLnjPqrEfxx9ByGa0UB | false | 5 |
| scanner-lizenz | Room Scanner Lizenz | price_1SvhF0LnjPqrEfxxNZn53Ydt | true | 6 |
| google-workspace | Google Workspace | price_1Svh1QLnjPqrEfxxhoLlUgo6 | true | 7 |

---

## Schritt 4: Frontend anpassen

1. **Neuer Hook:** `useContractorProducts()` lädt Produkte aus DB
2. **OrdersStep:** Nutzt DB-Produkte statt MOCK_PRODUCTS
3. **useOnboardingSizes:** Schreibt Größe in contractor_bestellungen statt contractor_onboarding

---

## Finale Tabellenstruktur

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        thermocheck.contractor_onboarding                    │
│                        (SSoT: Contractor-Profil & Status)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, profile_id, anschrift_*, ag_domain_email                                │
│ onboarding_status, onboarding_substatus                                     │
│ trainer_freigabe, trainer_freigabe_am, trainer_freigabe_von                 │
│ vertragsbeginn, deadline_aktivierung, aktivierungszeitpunkt                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:n
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        thermocheck.contractor_bestellungen                  │
│                        (SSoT: Stripe-Bestellungen)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ id, onboarding_id (FK)                                                      │
│ produkt_key → FK zu contractor_produkte                                     │
│ groesse (text, einfach statt JSONB)                                         │
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
│ name, beschreibung, produkt_typ                                             │
│ preis_netto, preis_brutto, ist_abo, abo_intervall                           │
│ stripe_price_id, stripe_test_price_id                                       │
│ extern_link, reihenfolge, braucht_groesse, ist_pflicht, ist_aktiv           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Migrations-Reihenfolge

| # | Aktion | Risiko |
|---|--------|--------|
| 1 | contractor_produkte erstellen + Daten einfügen | Keins |
| 2 | contractor_bestellungen: groesse + empfangsfoto Spalten hinzufügen | Keins |
| 3 | contractor_bestellungen: FK zu contractor_produkte hinzufügen | Keins |
| 4 | contractor_branding Daten migrieren (1 Row) | Gering |
| 5 | contractor_branding löschen | Gering |
| 6 | contractor_onboarding: Größen-Spalten entfernen | Gering |
| 7 | RPC update_contractor_onboarding_size anpassen | Frontend-Änderung nötig |
| 8 | Frontend: Hook + OrdersStep anpassen | Parallel |

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| Migration | 1 große Migration mit allen Schema-Änderungen |
| `src/hooks/useContractorProducts.ts` | NEU: Produkte aus DB laden |
| `src/hooks/useOnboardingSizes.ts` | Schreibt in contractor_bestellungen |
| `src/lib/onboarding-config.ts` | MOCK_PRODUCTS entfernen |
| `src/components/onboarding/steps/OrdersStep.tsx` | DB-Produkte nutzen |

