

# Dummy-Daten fuer Test-User: Onboarding komplett

User: **loloy47164@azeriom.com** (Anton, thc test)
Onboarding-ID: `17ef2646-e455-4d99-88ad-443b44ed9594`
Profile-ID: `e9e3e91a-bf72-4350-b110-8526292fb6a8`

## Was wird gemacht (3 SQL-Statements, reine Daten-Updates)

### 1. Onboarding-Record auf "ready" setzen

- `onboarding_status` → `ready`
- `trainer_freigabe` → `true`
- `trainer_freigabe_am` → `now()`
- `current_step` → `coaching` (letzter Schritt)
- `completed_steps` → alle 7 Schritte

### 2. Bestellungen: Bestehende auf "paid" setzen + fehlende anlegen

Aktuell existiert nur 1 Bestellung (tshirt/pending). Es werden:
- Die bestehende auf `paid` gesetzt
- 5 weitere Pflichtprodukte als bezahlt eingefuegt: `schlappen`, `pullover`, `ausweiskarte`, `scanner-lizenz`, `google-workspace`

### 3. Akademie-Fortschritt: Alle 53 Lektionen als "completed"

Fuer jede aktive Lektion in `contractor_akademie_lektionen` wird ein Eintrag in `contractor_akademie_lektions_fortschritt` mit `status = 'completed'` erstellt. Der `contractor_id` ist die Onboarding-ID.

### Ergebnis

Nach Ausfuehrung und Browser-Refresh:
- Onboarding zeigt "Abgeschlossen" / leitet zur Haupt-App weiter
- Alle Bestellungen als bezahlt
- Alle Akademie-Lektionen als abgeschlossen
- Trainer-Freigabe erteilt

