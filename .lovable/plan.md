

# Plan: Zurueck-Navigation aus dem Aufmass-Formular reparieren

## Problem

Der Zurueck-Button oben links im Aufmass-Formular nutzt `navigate(-1)` (Browser-History). Wenn der User direkt ueber einen Link auf die Aufmass-Seite kommt (z.B. geteilter Link, Lesezeichen, oder Page-Refresh), gibt es keinen History-Eintrag — der Button tut dann nichts.

## Loesung

`navigate(-1)` durch eine robuste Navigation ersetzen, die:
1. Zurueck navigiert wenn History vorhanden ist
2. Sonst zur Startseite (`/`) faellt

## Aenderung

### `src/features/aufmass/ui/AufmassFormPage.tsx`

Die Zurueck-Button onClick-Logik aendern:

```tsx
// Alt:
onClick={() => navigate(-1)}

// Neu:
onClick={() => {
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate('/');
  }
}}
```

Eine einzige Zeile wird geaendert — sonst nichts.

