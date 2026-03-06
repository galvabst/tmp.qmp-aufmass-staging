

# Innendienst-Aufgaben und Bestellungen nebeneinander

## Problem
Innendienst-Aufgaben und Bestellungen sind derzeit in separaten Karten/Accordions untereinander dargestellt. Der Admin will auf einen Blick sehen: Links die internen Aufgaben (Vertrag, Kleidung, Lizenzen), rechts die Bestellungen mit Bezahlstatus — alles nebeneinander.

## Lösung

Die Innendienst-Aufgaben-Karte (Zeile 128-161) und die Bestellungsliste werden in einem **2-Spalten-Grid** (`grid grid-cols-2 gap-2`) zusammengefasst:

- **Linke Spalte**: Innendienst-Aufgaben (Vertrag, Kleidung, Lizenzen) als vertikale Chip-Liste mit Haken/Kreuz
- **Rechte Spalte**: Alle Bestellungen als vertikale Liste mit Bezahlt/Offen-Status

So sieht der Admin sofort, was intern erledigt ist und welche Bestellungen noch offen sind — ohne Accordion öffnen zu müssen. Das Bestellungen-Accordion wird dadurch entbehrlich (oder bleibt als Duplikat bestehen, kann aber entfernt werden).

## Änderungen

| Datei | Änderung |
|-------|----------|
| `src/features/contractors/ui/ContractorDetailView.tsx` | Innendienst-Karte (Z.128-161) durch 2-Spalten-Grid ersetzen: links Innendienst-Checks, rechts Bestellungsliste. Bestellungen-Accordion entfernen (Duplikat). |

## UI-Skizze

```text
┌──────────────────────┬──────────────────────────┐
│ Innendienst    2/3   │ Bestellungen       6/9   │
│ ✓ Vertrag            │ ✓ Google Workspace       │
│ ✗ Kleidung           │ ✗ Schlappen (44)         │
│ ✓ Lizenzen           │ ✗ Tshirt (L)             │
│                      │ ✓ Pullover (L)           │
│                      │ ✓ Ausweiskarte           │
│                      │ ...                      │
└──────────────────────┴──────────────────────────┘
```

