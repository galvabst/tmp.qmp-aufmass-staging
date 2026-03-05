

# Quiz-Fragen inline mit Antworten anzeigen

## Problem
`QuizFrageListItem` zeigt nur den Fragetext (truncated) und "X Antw. · Y korrekt". Man muss den Editor-Dialog öffnen um die Antworten zu sehen. Der Admin will auf einen Blick sehen, wie jede Frage aufgebaut ist.

## Lösung

**Datei:** `src/features/admin/ui/akademie/QuizFrageListItem.tsx`

Die Komponente erweitern: Unterhalb der Frage werden die Antworten als kompakte Liste angezeigt — jede mit einem farbigen Indikator (grün = korrekt, grau = falsch) und dem Antworttext. Die Frage selbst wird nicht mehr truncated sondern vollständig angezeigt.

```
┌─────────────────────────────────────────────────┐
│ Wie heißt das Kältemittel?          #1  [⟳] [✎]│
│ ✓ R290 (Propan)                                 │
│ ✗ R410A                                         │
│ ✗ R32                                           │
│ ✗ CO2                                           │
└─────────────────────────────────────────────────┘
```

- Korrekte Antworten: grüner Haken + `text-green-700`
- Falsche Antworten: graues X + `text-muted-foreground`
- Frage vollständig anzeigen (kein `truncate`)
- Bestehende Edit/Toggle-Buttons bleiben oben rechts

Nur 1 Datei betroffen. Keine DB-Änderungen.

