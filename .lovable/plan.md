
# Plan: Preview-Modus - Bestellungen überspringbar machen

## Problem

Im `useOnboardingState.ts` (Zeilen 227-230) wurde bewusst festgelegt, dass der Bestellungs-Schritt auch im Preview-Modus durchlaufen werden muss:

```typescript
case 'bestellungen':
  // WICHTIG: Kein Preview-Skip hier!
  // User soll im Vorschau-Modus alle Produkte durchklicken können
  const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6;
  return state.bestellungenBestaetigt.length >= requiredCount;
```

Fuer die Entwicklung der Akademie ist das hinderlich.

## Loesung

Preview-Skip fuer Bestellungen aktivieren:

```typescript
case 'bestellungen':
  // Preview-Modus: Bestellungen-Validierung überspringen (für Development)
  if (isPreview) return true;
  const requiredCount = state.oberteilAuswahl === 'beides' ? 7 : 6;
  return state.bestellungenBestaetigt.length >= requiredCount;
```

## Aenderung

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useOnboardingState.ts` | Zeile 227-230: `if (isPreview) return true` hinzufuegen |

## Hinweis

Falls du spaeter den Original-Zustand wiederherstellen moechtest (User soll Bestellungen im Preview durchklicken), einfach die Zeile `if (isPreview) return true` wieder entfernen.
