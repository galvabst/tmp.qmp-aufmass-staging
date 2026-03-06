

# Innendienst-Arbeitspakete sichtbar machen

## Problem
Die internen Checks (Vertrag geprüft, Kleidung bestellt, Lizenzen bereitgestellt) sind im Accordion "Interne Checks" versteckt. Der Admin will auf einen Blick sehen, ob der Innendienst seine Arbeitspakete pro Techniker erledigt hat — um zu wissen, wo er nachhaken muss.

## Lösung

Die drei Innendienst-Aufgaben werden als **prominente Status-Zeile direkt unter dem Onboarding-Fortschritt** angezeigt (nicht erst im Accordion). Jede Aufgabe wird als kompakter Chip dargestellt:

- ✓ Vertrag geprüft (grün) / ✗ Vertrag offen (rot/orange)
- ✓ Kleidung bestellt (grün) / ✗ Kleidung offen
- ✓ Lizenzen bereit (grün) / ✗ Lizenzen offen

Zusätzlich ein zusammenfassender Hinweis: **"Innendienst: 1/3 erledigt"** — sofort erkennbar ob Handlungsbedarf besteht.

Das bestehende "Interne Checks" Accordion bleibt erhalten (für Detailansicht), aber die Kerninfo ist sofort sichtbar.

## Änderungen

| Datei | Änderung |
|-------|----------|
| `src/features/contractors/ui/ContractorDetailView.tsx` | Neue "Innendienst-Status"-Zeile zwischen Onboarding-Fortschritt und Quick Stats einfügen — 3 Chips mit farbigem Status |

## UI-Design

Direkt unter der 7-Step-Progress-Bar, als horizontale Reihe mit kleinen Status-Badges:

```text
┌─────────────────────────────────────────────┐
│ Innendienst-Aufgaben                   1/3  │
│ [✓ Vertrag] [✗ Kleidung] [✗ Lizenzen]      │
└─────────────────────────────────────────────┘
```

Grüner Chip = erledigt, orangener/roter Chip = offen. So sieht der Admin sofort, was der Innendienst noch tun muss.

