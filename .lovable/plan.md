

## Fix: Akademie-Fortschritt wird nicht korrekt aus der DB geladen

### Problem

Es gibt eine Race Condition bei der Hydration des Akademie-Fortschritts:

1. Die Akademie-Module (`dbAkademieModule`) laden zuerst
2. Der Hydration-Effect laeuft und setzt `hasHydratedRef = true`
3. Aber `completedLektionIds` (abhaengig von `dbStatus?.onboardingId`) ist zu dem Zeitpunkt noch `undefined`
4. Wenn `completedLektionIds` spaeter eintrifft, verhindert `hasHydratedRef` ein erneutes Ausfuehren
5. Ergebnis: Alle Module erscheinen als "nicht abgeschlossen" und bleiben gesperrt

### Loesung

Die Hydration in `OnboardingScreen.tsx` (Zeilen 261-267) so anpassen, dass sie auf BEIDE Datenquellen wartet bevor sie den Ref setzt:

- `completedLektionIds` muss definiert sein (nicht nur `dbLoaded`)
- ODER: Hydration ohne `completedLektionIds` erlauben, aber bei spaeterem Eintreffen nochmals mit den IDs ausfuehren

Bevorzugter Ansatz: **Warten bis beide Queries fertig sind**, bevor hydrated wird.

### Technische Details

| Datei | Aenderung |
|---|---|
| `src/components/OnboardingScreen.tsx` | Hydration-Effect (Zeile 261-267): Guard erweitern um `completedLektionIds !== undefined` als zusaetzliche Bedingung |

Konkret wird die Bedingung von:
```text
if (!dbLoaded || !dbAkademieModule || dbAkademieModule.length === 0) return;
```
zu:
```text
if (!dbLoaded || !dbAkademieModule || dbAkademieModule.length === 0) return;
if (completedLektionIds === undefined) return;  // Warten bis Fortschritt geladen
```

So wird die Hydration erst ausgefuehrt, wenn sowohl die Modulstruktur als auch die Fortschrittsdaten aus der DB verfuegbar sind. Keine weiteren Dateien betroffen.

