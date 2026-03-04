

# Plan: Auftragsdetails verschönern + Objekt-Infos ergänzen

## Überblick
Die Detailansicht wird nach Apple-Prinzip aufgeräumt: weniger visuelles Rauschen, klarere Hierarchie, scanbare Informationen auf einen Blick. Zusätzlich werden Quadratmeter, Fußbodenheizung und Wohneinheiten unter dem Kundennamen als kompakte Info-Chips angezeigt.

## 1. Daten erweitern

**`src/types/technician.ts`** — 3 neue optionale Felder auf `TechnicianOrder`:
- `quadratmeter?: number`
- `wohneinheiten?: number`  
- `fussbodenheizung?: boolean`

**`src/hooks/useMyAssignedOrders.ts`** — Die 3 Felder im `select` der Aufträge-Abfrage ergänzen + in den Return-Wert mappen.

**`src/hooks/usePoolOrders.ts`** — Gleiche Felder auch dort ergänzen (falls Pool-Orders diese Info haben).

## 2. UI-Redesign der Detailansicht

**`src/components/TechnicianOrderDetail.tsx`** — Apple-Style Überarbeitung:

### Kundeninfo-Card (oben)
- Auftragstyp-Badge + Name bleiben
- **Neu**: Unter dem Namen eine Zeile mit dezenten Info-Chips:
  - `📐 120 m²` · `🏠 2 WE` · `✓ Fußbodenheizung` (oder `✗ Keine FBH`)
- Vergütung rechts bleibt

### Aufgaben-Card (Accordion)
- Bleibt funktional gleich, aber:
  - Weniger vertikaler Abstand zwischen den Elementen
  - Anruf-Leitfaden standardmäßig eingeklappt (nicht `defaultValue`)
  - CopyBlock etwas kompakter (kleinerer padding)

### Kontaktdaten
- Kompakter: Telefon und E-Mail in einer Zeile nebeneinander statt untereinander
- Icons dezenter (kleiner)

### Termin + Adresse
- Zu einer einzigen Card zusammenfassen statt zwei separate
- Datum oben, Adresse darunter, Navigation-Button unten

### Arbeitsfortschritt
- Kompakterer Progress-Indicator mit einer horizontalen Linie zwischen den Schritten

### Generell
- Sektions-Titel (`font-medium`) konsistenter
- Weniger `shadow-card` Intensität, mehr Whitespace zwischen Sections
- Cards etwas weniger padding (p-3 statt p-4 wo möglich)

## Dateien
- `src/types/technician.ts` — 3 neue Felder
- `src/hooks/useMyAssignedOrders.ts` — Felder fetchen + mappen
- `src/hooks/usePoolOrders.ts` — Felder fetchen + mappen (falls vorhanden)
- `src/components/TechnicianOrderDetail.tsx` — UI-Redesign + Info-Chips

