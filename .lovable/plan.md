

# Admin Dashboard mit Fortschritts-Diagrammen

## Kontext aus der Datenbank

Aktuell: 20 Contractor-Records, davon 3 Trainer, 7 gestartet, 5 in Bearbeitung, 3 Mitfahrt, 1 eingeladen, 1 deaktiviert. Es gibt `deadline_aktivierung` als Feld (aktuell null bei allen). Aufträge: 543 gesamt, davon 512 abgeschlossen (wc1_durchfuehren), 8 bestätigt, 14 in Verzug.

## Was das Dashboard zeigen soll

Kein Enterprise-Overkill -- stattdessen die 3 Fragen, die ein Betriebsleiter täglich beantworten muss:

1. **Werden die Leute rechtzeitig einsatzbereit?** → Onboarding-Funnel als horizontaler Balken (wie viele stecken in welchem Schritt)
2. **Wer arbeitet, wer nicht?** → Techniker-Auslastung: Aufträge pro aktivem Techniker als Bar-Chart
3. **Läuft der Betrieb?** → Auftrags-Pipeline: Wie viele Aufträge in welchem Status (bestätigt → VoT abfragen → in Verzug → abgeschlossen)

## Technische Umsetzung

### 1. Neuer Tab "Dashboard" als Standard-Tab in der Admin-BottomNav
- Neuer Tab `dashboard` an erster Stelle (vor `contractors`)
- Icon: `LayoutDashboard`
- Wird beim Öffnen von /admin als erstes angezeigt

### 2. Neue Komponente `AdminDashboardView.tsx`
Nutzt die vorhandenen Hooks (`useAdminContractorList`, `useAdminBookings`) plus einen neuen leichten Hook für Auftrags-Pipeline-Zahlen.

**Sektion 1: Onboarding-Fortschritt (Funnel-Balken)**
- Horizontaler gestapelter BarChart (recharts) mit den 7 Onboarding-Schritten
- Zeigt pro Schritt, wie viele Techniker dort aktuell stecken
- Farben: Grün (fertig) → Gelb (aktuell) → Grau (noch nicht begonnen)
- Berechnung rein aus `contractors.completedSteps` und `currentStep`

**Sektion 2: Techniker-Auslastung**
- Vertikaler BarChart: X-Achse = Techniker-Name, Y-Achse = Anzahl aktive Aufträge
- Daten aus `v_thermocheck_auftraege` gruppiert nach `zugewiesener_techniker_id`, aufgelöst zu Namen
- Nur Techniker mit zugewiesenen Aufträgen

**Sektion 3: Auftrags-Pipeline**
- Horizontaler BarChart oder Donut: Aufträge nach `pipeline_status` gruppiert
- Farben je Status

**Sektion 4: Kompakte KPI-Zeile** (wie bei ContractorListView)
- Gesamt-Aufträge | Aktive Techniker | Offene Pool-Termine | In Verzug

### 3. Neuer Hook `useAdminDashboardStats.ts`
- Lädt Auftrags-Pipeline-Counts (`v_thermocheck_auftraege` GROUP BY pipeline_status)
- Lädt Techniker-Auslastung (Aufträge pro Techniker mit Namensauflösung)
- Kombiniert mit Daten aus `useAdminContractorList`

### Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `AdminBottomNav.tsx` | Neuer Tab `dashboard` an Position 1 |
| `Admin.tsx` | Dashboard-View einbinden, Default-Tab auf `dashboard` |
| `AdminDashboardView.tsx` | **Neu** -- Gesamte Dashboard-Seite |
| `useAdminDashboardStats.ts` | **Neu** -- Auftrags- und Auslastungsdaten |

### Recharts-Nutzung
`recharts` und `chart.tsx` (shadcn) sind bereits installiert. Verwendung von `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `ResponsiveContainer`.

