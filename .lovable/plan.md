
# Plan: Produkt-Sequenz-Fix - UMGESETZT ✅

## Problem-Analyse

Das Problem war: Nach dem T-Shirt wurden die weiteren Produkte (Schlappen, Pullover, Ausweiskarte, Google Workspace) nicht angezeigt.

### Ursache

Der `oberteilAuswahl`-State war ein lokaler React-State und wurde nicht persistiert. Nach Bestätigung einer Bestellung wurde die Komponente neu gerendert und der State war wieder `null`.

### Lösung umgesetzt

Der `oberteilAuswahl`-State wurde in den globalen `OnboardingState` verschoben und wird nun in localStorage persistiert.

## Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/types/onboarding.ts` | Neuer Typ `OberteilAuswahl`, Feld `oberteilAuswahl` in `OnboardingState` |
| `src/lib/onboarding-config.ts` | Initial State mit `oberteilAuswahl: null` |
| `src/hooks/useOnboardingState.ts` | Neue Funktion `setOberteilAuswahl`, Import des Typs, validierte Bestellungsanzahl |
| `src/components/onboarding/steps/OrdersStep.tsx` | Props statt lokaler State, Import von `OberteilAuswahl` aus types |
| `src/components/OnboardingScreen.tsx` | Props `oberteilAuswahl` und `onOberteilAuswahl` an `OrdersStep` weitergeben |

## Produkt-Reihenfolge

| Reihenfolge | Produkt-ID | Name |
|-------------|------------|------|
| 1 | oberteil | T-Shirt oder Poloshirt |
| 2 | schlappen | Thermocheck Hausschuhe |
| 3 | pullover | Thermocheck Pullover |
| 4 | ausweiskarte | Thermocheck Ausweiskarte |
| 5 | google-workspace | Google Workspace |

## Validierung

- T-Shirt nur: 5 Bestellungen erforderlich
- Poloshirt nur: 5 Bestellungen erforderlich  
- Beides: 6 Bestellungen erforderlich
