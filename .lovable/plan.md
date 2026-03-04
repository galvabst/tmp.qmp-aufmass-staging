

# Plan: Interaktive Summary-Cards im "In Prüfung"-Tab

## Analyse: Was ist kaputt?

Aus den Logs und dem Code sehe ich **keine technischen Fehler** — die Daten werden korrekt geladen. Das Problem ist, dass die Summary-Cards (Ausstehend, Abgenommen, Boni) aktuell **statische, nicht-klickbare Kacheln** sind. Der User will sie als **interaktive Filter/Aufklapp-Elemente** mit Sub-Kategorien.

## Was der User will

### 1. "Ausstehend" → Klickbar → Filtert Aufträge
- Klick zeigt nur Aufträge mit Status `submitted` / `in_review` (noch kein Angebot/Abnahme)

### 2. "Abgenommen" → Klickbar → Aufklappbar mit Sub-Kategorien
- **Noch nicht in Rechnung gestellt**: Abgenommene Aufträge, die der Techniker noch nicht abgerechnet hat
- **In Rechnung gestellt / Auszahlung**: Aufträge, die bereits abgerechnet wurden
- Aktuell gibt es kein `in_rechnung_gestellt`-Feld → muss ergänzt werden oder zumindest im UI vorbereitet werden

### 3. "Boni" → Klickbar → Aufklappbar mit Monats-Filterung
- Gruppiert nach Monat (auszahlungsmonat oder created_at Monat)
- Pro Monat: Welche Projekte, welcher Bonus-Typ, Betrag
- Status-Anzeige: In Rechnung gestellt oder nicht
- Verhindert, dass Techniker den Überblick verlieren, was schon abgerechnet wurde

## Technischer Plan

### A. ReviewView.tsx umbauen
- Summary-Cards werden zu **Toggle-Buttons** (active state mit Highlight)
- Klick auf "Ausstehend": Filter-State `activeFilter = 'ausstehend'` → zeigt nur pending orders
- Klick auf "Abgenommen": Expandiert eine Sub-Sektion mit:
  - Aufschlüsselung nach Abrechnungsstatus
  - Liste der abgenommenen Aufträge
- Klick auf "Boni": Expandiert Boni-Detail-Sektion mit:
  - Monatsgruppen (z.B. "März 2026", "Februar 2026")
  - Pro Bonus: Lead-Name, Typ (Google/Trustpilot/Lead), Betrag, Status

### B. State-Management
- `activeSection: 'ausstehend' | 'abgenommen' | 'boni' | null` — Toggle-State
- Bei Klick auf gleiche Card → zuklappen (null)
- Bei Klick auf andere Card → wechseln

### C. Boni-Monatsgruppierung
- `useContractorBoni` liefert bereits `created_at` und `auszahlungsmonat`
- Gruppierung im Frontend nach `auszahlungsmonat` oder Fallback `created_at` Monat
- Pro Monat: Summe, Anzahl, aufklappbare Liste

### D. Abrechnungsstatus (für Zukunft vorbereiten)
- Aktuell gibt es kein `in_rechnung_gestellt_am` Feld auf `thermocheck_auftraege` oder `contractor_boni`
- **Pragmatischer Ansatz**: Wir fügen ein `abgerechnet_am` Feld auf `contractor_boni` hinzu (nullable) + zeigen im UI "Noch nicht abgerechnet" vs "Abgerechnet"
- Für Aufträge: Die Abrechnung ist noch kein Feature → wir zeigen erstmal alles als "Noch nicht abgerechnet" mit dem Hinweis, dass die monatliche Abrechnungsfunktion kommt

### E. DB-Migration
- `ALTER TABLE thermocheck.contractor_boni ADD COLUMN abgerechnet_am timestamptz DEFAULT NULL`
- Ermöglicht künftig: Techniker markiert Bonus als "in Rechnung gestellt" oder Admin setzt es

## Betroffene Dateien
- `src/components/ReviewView.tsx` — Kompletter Umbau zu interaktiven Cards mit Expand-Sections
- `src/hooks/useContractorBoni.ts` — Monatsgruppierungs-Helfer hinzufügen
- `supabase/migrations/` — `abgerechnet_am` Spalte auf `contractor_boni`

## UI-Verhalten

```text
┌─────────────┬──────────────┬──────────────┐
│ Ausstehend  │ Abgenommen   │    Boni      │
│   140 €     │    0 €       │    0 €       │
│ 1 Auftrag   │ 0 Aufträge   │  0 Boni      │
└─────┬───────┴──────┬───────┴──────┬───────┘
      │ (klick)      │ (klick)      │ (klick)
      ▼              ▼              ▼
  Filter:         Expand:        Expand:
  Nur pending     ├ Offen: X €   ├ März 2026
  Aufträge        │ 2 Aufträge   │  Google: 10€
                  ├ Abgerechnet  │  Lead: 50€
                  │ 1 Auftrag    ├ Feb 2026
                  └              │  ...
                                 └
```

