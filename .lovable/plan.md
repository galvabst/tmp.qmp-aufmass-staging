

# Fixes: Sticky Countdown + Produkt-Flackern

## Problem 1: Countdown scrollt mit

Der Countdown ist im normalen Dokument-Flow und verschwindet beim Scrollen. Er muss `sticky` werden, damit er immer oben sichtbar bleibt.

**Aenderung in `src/components/onboarding/OnboardingCountdown.tsx`:**
- `sticky top-0 z-50` zum aeusseren Container hinzufuegen
- Der Countdown klebt dann am oberen Bildschirmrand, egal wie weit gescrollt wird

## Problem 2: Produkt-Bild "switcht"

Das ist kein Bild-Problem, sondern ein **Produkt-Wechsel**: Beim ersten Render sind die Bestellungen aus der DB noch nicht geladen (`orderedProducts` ist leer). Dadurch zeigt die Seite zunaechst das erste Produkt (Oberteil/T-Shirt) an. Sobald die DB-Daten ankommen und alle Kleidungs-Bestellungen als "bezahlt" erkannt werden, springt die Ansicht ploetzlich zum naechsten offenen Produkt (z.B. Google Workspace).

**Loesung: Loading-State waehrend Orders laden**

**Aenderung in `src/components/onboarding/steps/OrdersStep.tsx`:**
- Neue Prop `isLoadingOrders` hinzufuegen
- Solange Orders aus der DB laden, einen Skeleton/Spinner anzeigen statt ein falsches Produkt
- Erst wenn die DB-Daten da sind, das korrekte aktuelle Produkt anzeigen

**Aenderung in `src/components/OnboardingScreen.tsx`:**
- `ordersLoaded`-Status als `isLoadingOrders`-Prop an `OrdersStep` durchreichen

## Betroffene Dateien

1. `src/components/onboarding/OnboardingCountdown.tsx` - sticky positioning
2. `src/components/onboarding/steps/OrdersStep.tsx` - Loading-State hinzufuegen
3. `src/components/OnboardingScreen.tsx` - Loading-Prop durchreichen

