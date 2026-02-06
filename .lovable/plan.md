
# Fix: "Alle Bestellungen abgeschlossen" wird falsch angezeigt

## Problem

Die App zeigt "Alle Bestellungen abgeschlossen!", obwohl laut Datenbank:
- **Bezahlt (paid):** T-Shirt, Poloshirt, Schlappen (3 Produkte)
- **Ausstehend (pending):** Pullover
- **Nicht bestellt:** Ausweiskarte, Scanner-Lizenz, Google Workspace

Das Problem: `state.bestellungenBestaetigt` im localStorage enthaelt veraltete Eintraege aus frueheren Test-Sessions. Die kuerzlich reparierte forceReset-Logik verhindert jetzt korrekterweise ein Loeschen bei payment=success, aber dadurch bleiben auch alte falsche Daten bestehen.

## Ursache

1. `bestellungenBestaetigt` wird im localStorage gespeichert und beim naechsten Laden wiederhergestellt
2. Fruehere Tests haben Produkte manuell als "bestellt" markiert (via `toggleProductOrdered`)
3. Die DB-Sync-Logik (OnboardingScreen Zeile ~180) fuegt nur **neue** paid-Keys hinzu, entfernt aber nie falsche Eintraege
4. Resultat: localStorage sagt "alles bestellt", DB sagt "3 von 7 bezahlt"

## Loesung

Die Datenbank muss die einzige Wahrheitsquelle fuer Bestellungen sein. Aenderungen:

### 1. DB-Sync als "Replace" statt "Append" (OnboardingScreen.tsx)

Der bestehende Sync-Effekt (ca. Zeile 180-190) fuegt nur neue paid-Keys hinzu. Stattdessen soll er `bestellungenBestaetigt` komplett durch die DB-Werte **ersetzen**:

```
// VORHER: Nur neue hinzufuegen
const newPaidProducts = paidKeys.filter(key => !state.bestellungenBestaetigt.includes(key));
newPaidProducts.forEach(productId => toggleProductOrdered(productId));

// NACHHER: Komplett durch DB-Werte ersetzen
setBestellungenFromDb(paidKeys);
```

### 2. Neue Funktion `setBestellungenFromDb` im Hook (useOnboardingState.ts)

Eine neue Setter-Funktion, die `bestellungenBestaetigt` direkt auf die uebergebenen Werte setzt (kein Toggle, kein Append):

```
const setBestellungenFromDb = useCallback((paidKeys: string[]) => {
  setState(prev => ({
    ...prev,
    bestellungenBestaetigt: paidKeys,
  }));
}, []);
```

### 3. `isStepComplete('bestellungen')` anpassen (useOnboardingState.ts)

Die Validierung prueft nur die Anzahl, nicht welche Produkte bezahlt sind. Besser: explizit pruefen, ob alle Pflicht-Produkte bezahlt sind. Da die Produkte aus MOCK_PRODUCTS kommen, muss die Logik pruefen:

- Oberteil (tshirt und/oder poloshirt je nach Auswahl) -- bezahlt
- schlappen -- bezahlt
- pullover -- bezahlt (ist in MOCK_PRODUCTS als pflicht:true)
- ausweiskarte -- bezahlt
- scanner-lizenz -- bezahlt
- google-workspace -- bezahlt

Die `requiredCount`-Logik bleibt, aber das Ergebnis wird korrekt sein, sobald `bestellungenBestaetigt` nur echte DB-Werte enthaelt.

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useOnboardingState.ts` | Neue Funktion `setBestellungenFromDb` |
| `src/components/OnboardingScreen.tsx` | Sync-Effekt: Replace statt Append |
