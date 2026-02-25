

# Fix: Ablehnen-Button im RescheduleModal wird abgeschnitten

## Problem

Der "Alle ablehnen"-Button existiert im Code, wird aber auf dem Bildschirm abgeschnitten. Das `DialogContent` hat keine Hoehenbegrenzung mit Scroll, sodass der untere Teil des Modals (Warnung + Button) ueber den sichtbaren Bereich hinausragt.

## Loesung

Eine einzige Aenderung in `src/components/RescheduleModal.tsx`: Dem `DialogContent` die Klassen `max-h-[90vh] overflow-y-auto` hinzufuegen, damit der Inhalt bei kleinen Bildschirmen scrollbar wird und der Ablehnen-Button erreichbar ist.

## Technische Details

### `src/components/RescheduleModal.tsx`
- Zeile 109: `className="max-w-md [&>button]:hidden"` aendern zu `className="max-w-md max-h-[90vh] overflow-y-auto [&>button]:hidden"`

Das ist alles. Der Button und die Logik sind bereits vollstaendig implementiert – er war nur nicht sichtbar.

