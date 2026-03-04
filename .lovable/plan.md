

# Plan: Coaching-Buchung für Contractor zurücksetzen

## Was passiert
Der Contractor `f41fe4f6-...` hat eine vergangene Mitfahrt gebucht. Die Buchung muss rückgängig gemacht werden, damit er einen neuen (zukünftigen) Termin buchen kann.

## Zwei Daten-Updates nötig (kein Code-Change)

### 1. Auftrag freigeben
Auf `thermocheck.thermocheck_auftraege` (ID: `58ee2606-238e-4275-9c5d-654a5b5202f0`):
- `coaching_gebucht_von` → NULL
- `coaching_gebucht_am` → NULL

### 2. Onboarding-Step zurücksetzen
Auf `thermocheck.contractor_onboarding` (ID: `a22e88c2-95fe-4b24-a04b-cece2f792d96`):
- `completed_steps` → `['profil','dokumente','bestellungen','equipment','akademie']` (ohne `'coaching'`)
- `current_step` → `'coaching'` (bleibt gleich)
- `coaching_bewertung` → `'ausstehend'` (bleibt gleich)

Damit landet der Contractor wieder auf dem Coaching-Schritt und sieht nur zukünftige verfügbare Termine (dank dem zuvor implementierten Datumsfilter).

