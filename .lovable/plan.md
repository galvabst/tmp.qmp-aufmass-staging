

# Plan: Raumscan-Link von Aufstellort nach Techniker-Daten verschieben

## Problem
Das Raumscan-URL-Feld ist im Schritt "Aufstellort" (Schritt 10 von 15) versteckt. Da nicht jeder Techniker das PV-Formular ausfüllt, wird der Link leicht übersehen. Er soll prominenter platziert werden.

## Lösung
Das `raumscan_url`-Feld aus `AufstellortSection.tsx` entfernen und in `TechnikerDatenSection.tsx` (Schritt 1) einfügen — direkt nach dem Datum-Feld. So sieht es jeder Techniker sofort beim Formular-Start.

### Änderungen

**`src/features/aufmass/ui/sections/TechnikerDatenSection.tsx`**:
- Import `ExternalLink` von lucide-react
- Nach dem "Datum ThermoCheck"-Feld: Raumscan-URL-Feld mit Input + "Öffnen"-Link einfügen (gleiche UI wie bisher)

**`src/features/aufmass/ui/sections/AufstellortSection.tsx`**:
- Raumscan-URL Block (Zeilen 150-163) entfernen
- `raumscanUrl` watch und `ExternalLink` Import entfernen (falls nicht mehr gebraucht)

Keine Schema- oder DB-Änderungen nötig — `raumscan_url` bleibt im selben `AufmassDraftData`-Objekt.

