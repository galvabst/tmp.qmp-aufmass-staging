
# Pool-Kommandozentrale

Aktuell zeigt `/admin` → Pool nur unzugewiesene Aufträge mit zwei nichtssagenden Tabs ("Mit/Ohne Vorschlag") und einer leeren Karte. Das Ziel: eine echte Übersicht **was passiert gerade im Pool**, mit Aging, Zuweisungs-Status und Techniker-Drilldown.

## Was geändert wird

### 1. Datengrundlage erweitern
Hook `useAdminPoolTermine` umbauen zu `useAdminPoolOverview`:
- **Nicht mehr** nur `zugewiesener_techniker_id IS NULL` laden
- Stattdessen alle Aufträge in den **aktiven Pool-Phasen** laden:
  - `termin_abwarten` (Pool offen + Pool angenommen)
  - `termin_neubuchung` (Neubuchung nötig)
  - `wc1_durchfuehren` (akzeptiert, Termin steht)
  - `termin_bestaetigt`
- Pro Auftrag mitliefern: `auftragstyp`, `pipeline_status`, `zugewiesener_techniker_id`, Techniker-Name (join via `contractor_onboarding` → `profiles`), `erstellt_am` (für Aging), Anzahl Terminvorschläge, frühester Vorschlag.

### 2. KPI-Header (vier Kacheln oben)
Wie ein Cockpit, sofort lesbar:
- **Frei im Pool** (unzugewiesen, `termin_abwarten`) — davon X mit Vorschlag, Y ohne
- **Angenommen, Termin steht** (`wc1_durchfuehren` + `termin_bestaetigt`)
- **Neubuchung nötig** (`termin_neubuchung`)
- **Älteste offen seit** (Tage des ältesten unzugewiesenen Auftrags) — Ampel: grün <2d, gelb 2–5d, rot >5d

### 3. Tabs neu (statt "Mit/Ohne Vorschlag")
- **Frei** (unzugewiesen) — Default
- **Angenommen** (Techniker zugewiesen, noch nicht abgeschlossen)
- **Neubuchung**
- **Alle**

### 4. Filterzeile
- Suche (wie bisher: Name/PLZ/Stadt/Adresse)
- **Auftragstyp**: Thermocheck / Einweisung / PV
- **Techniker** (Dropdown, nur sichtbar im Tab "Angenommen"/"Alle") — zeigt welche Aufträge welcher Leiter angenommen hat
- **Aging-Filter**: alle / >2 Tage offen / >5 Tage offen
- "Zurücksetzen"-Button

### 5. Karten-Ansicht entfernen (default)
Die leere Europa-Karte hat null Mehrwert. Karte als optionaler Toggle bleibt, aber:
- Wird nur gerendert wenn Aufträge geocodiert sind
- Default-Ansicht ist Liste
- Karten-Toggle kleiner, neben Filterzeile (nicht als großer Tab)

### 6. Listen-Karte überarbeiten
Pro Auftrag-Zeile:
- Links: Kundenname, Adresse, PLZ/Ort
- Mitte: Auftragstyp-Badge (Thermocheck/Einweisung/PV), Pipeline-Status (lesbar, nicht Mono-Slug), Terminvorschlag-Datum oder "Kein Vorschlag"
- Rechts: **Aging-Chip** ("vor 3d") + Techniker-Name (wenn zugewiesen, mit Avatar-Initial) oder Badge "Frei"
- Linke Border-Farbe nach Status: grau=frei, blau=angenommen, orange=Neubuchung

## Technische Details
- Datei: `src/features/object-orders/hooks/useAdminObjectOrders.ts` → erweitern (Filter raus, Joins rein).
- Datei: `src/features/object-orders/ui/ObjectOrderListView.tsx` → KPI-Header + neue Tabs + Filter + Karte hinter Toggle.
- Neue Status-Mappings via bestehender `src/lib/status-config.ts` (Slug → Label/Farbe).
- Techniker-Join: `contractor_onboarding(id, profile_id)` → `profiles(id, vorname, nachname)`; pro Liste einmal laden und in Map auflösen (keine N+1).
- Aging: `Math.floor((now - erstellt_am) / 86400000)`.
- Keine DB-Migration nötig.

## Akzeptanzkriterien
- Header zeigt korrekte Zahlen (gegen Pipeline-Verteilung der DB validierbar).
- Tab "Angenommen" zeigt Aufträge mit `zugewiesener_techniker_id IS NOT NULL` in `wc1_durchfuehren`/`termin_bestaetigt`.
- Techniker-Dropdown filtert Liste auf Aufträge dieses Leiters.
- Aging-Chip auf jeder Zeile sichtbar, älteste offene Frei-Aufträge zuerst.
- Karten-Tab ist Toggle, nicht mehr Default-Halbbildschirm.
