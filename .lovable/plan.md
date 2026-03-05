

# Pool-Erweiterung & Dashboard-Umbau

## 1. Pool: Zwei Kategorien mit Filter

**Problem:** Aktuell zeigt der Pool nur Terminvorschläge mit Status `vorgeschlagen`. Der Admin will auch Aufträge sehen, die noch gar nicht terminiert sind.

**Datenstand:** Aktuell 1 vorgeschlagener Termin, 0 Aufträge ohne Termine im Pool (alle 512 unterminierten sind bereits `wc1_durchfuehren`). Trotzdem muss die Logik für zukünftige Aufträge vorbereitet sein.

### Hook-Änderung (`useAdminObjectOrders.ts`)
Zwei Gruppen laden:
- **Terminiert (offen):** `thermocheck_terminvorschlaege` mit `status = 'vorgeschlagen'` verknüpft mit Aufträgen
- **Noch nicht terminiert:** Aufträge mit `pipeline_status NOT IN ('wc1_durchfuehren', 'termin_bestaetigt', 'vot_formular_abfragen', 'vot_formular_in_verzug')` UND `zugewiesener_techniker_id IS NULL` UND keine Terminvorschläge mit Status `vorgeschlagen` oder `angenommen`

Neues Interface erweitern um `kategorie: 'terminiert' | 'nicht_terminiert'`.

### View-Änderung (`ObjectOrderListView.tsx`)
- Filter-Tabs oben: "Alle" | "Terminiert" | "Nicht terminiert"
- Subtitle zeigt Counts pro Kategorie
- Karten zeigen bei "Nicht terminiert" nur Adresse/PLZ/Ort (kein Datum)
- Karte zeigt beide Kategorien farblich unterschieden (orange = terminiert, grau = nicht terminiert)

---

## 2. Dashboard: Techniker-Einzelansicht mit Pflichtartikeln

**Problem:** Die Balkendiagramme sind zu abstrakt. Admin will auf einen Blick pro Techniker sehen: Welchen Schritt macht er gerade? Welche Pflichtartikel hat er schon?

**Pflichtartikel (aus DB):** tshirt ODER poloshirt (eines reicht als "Oberteil"), schlappen, ausweiskarte, pullover, scanner-lizenz, google-workspace = 6 Pflicht-Kategorien. Oberteil = tshirt ODER poloshirt, mindestens eins.

### Hook-Änderung (`useAdminContractorList.ts`)
Bereits vorhanden: `bestellungenBezahlt/Total`. Erweitern um `bezahlteProdukte: string[]` -- eine Liste der `produkt_key`s die paid sind. Daten kommen aus dem bereits geladenen `bestellungenRes`.

### Dashboard-Umbau (`AdminDashboardView.tsx`)
Kompletter Umbau in drei Sektionen:

**Sektion 1: KPI-Zeile** (bleibt ähnlich)

**Sektion 2: Techniker-Übersicht** (NEU -- ersetzt Onboarding-Funnel-Balkendiagramm)
Pro Techniker (nur aktive, nicht ready/deaktiviert) eine kompakte Zeile:
- Avatar + Name
- Aktueller Schritt als farbiger Badge
- 6 kleine Icons/Dots für Pflichtartikel (grün = hat, grau = fehlt): Oberteil, Schlappen, Ausweiskarte, Pullover, Scanner, Workspace
- Fortschrittsbalken (x/7 Schritte)

Das ist die "Auf-einen-Blick"-Ansicht: Jeder Techniker = eine Zeile, sofort sichtbar was fehlt.

**Sektion 3: Aktivitäts-Trend** (NEU -- ersetzt die Balkendiagramme)
Ein Liniendiagramm (recharts `LineChart`) mit:
- X-Achse: Wochen/Monate (basierend auf `erstellt_am` der Techniker)
- Y-Achse: Anzahl
- Linie 1: Kumulativ einsatzbereite Techniker über Zeit
- Linie 2: Kumulativ gestartete Techniker über Zeit

Das zeigt den "Zacken-Graph" den der Admin will -- wie schnell kommen Leute durch.

**Sektion 4: Auftrags-Pipeline + Auslastung** (kompakter, bleibt als Referenz)

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `useAdminObjectOrders.ts` | Zweite Kategorie "nicht terminiert" laden |
| `ObjectOrderListView.tsx` | Filter-Tabs, farblich unterschiedene Karten |
| `useAdminContractorList.ts` | `bezahlteProdukte: string[]` hinzufügen |
| `AdminDashboardView.tsx` | Komplett umbauen: Techniker-Zeilen + Liniendiagramm |

