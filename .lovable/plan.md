

# Fix: Modul 6 erscheint nicht (Gruppen-Eltern werden faelschlicherweise gefiltert)

## Problem
Der Content-Filter (`lek.video_url || lek.text_inhalt`) auf Zeile 208 entfernt die Lektion "6-3" (Dokumentationsstandard), weil sie selbst kein Video/Text hat. Aber "6-3" ist der **Gruppen-Eltern** fuer "6-3-1" und "6-3-2" (die Videos haben). Ohne den Eltern-Eintrag kann `buildHierarchicalUnterpunkte` die Kinder nicht zuordnen — sie werden uebersprungen und Modul 6 erscheint leer.

## Loesung

### Datei: `src/hooks/useAkademieContent.ts`

**1. Content-Filter von Zeile 208 entfernen** — alle aktiven Lektionen an `buildHierarchicalUnterpunkte` uebergeben.

**2. Content-Filter in `buildHierarchicalUnterpunkte` verschieben** — dort gezielt anwenden:
- Kinder (Code mit 3 Teilen, z.B. "6-3-1"): Nur aufnehmen wenn `video_url` oder `text_inhalt` vorhanden
- Einzel-Lektionen (Code mit 2 Teilen, z.B. "6-1"): Nur aufnehmen wenn Content vorhanden
- Gruppen-Eltern (Code mit 2 Teilen, z.B. "6-3"): Behalten wenn mindestens ein Kind mit Content existiert

### Technische Umsetzung

Die Funktion `buildHierarchicalUnterpunkte` erhaelt den vollen `DbLektion[]`-Array (statt nur `AkademieUnterpunkt`). Der Filter wird wie folgt angewendet:

```
// Kinder filtern: nur mit Content
for (const lek of sorted) {
  if (parts.length === 3 && (lek.video_url || lek.text_inhalt)) {
    // Kind aufnehmen
  }
}

// Eltern/Einzel: 
// - Gruppe behalten wenn Kinder vorhanden
// - Einzel nur wenn Content vorhanden
```

Die bestehende Bereinigung (Gruppen ohne Kinder entfernen, Module ohne Unterpunkte entfernen) bleibt unveraendert.

