

# Praxistest: Einreichung + Admin-Übersicht reparieren

## Analyse

### Problem 1: Trainer-Mitfahrten-Query bricht (400 Error)
In `useMyCoachingRideAlongs.ts` Zeile 60 wird `praxistest_eingereicht` als Spalte abgefragt — diese Spalte existiert aber nicht. Die tatsächliche Spalte heisst `praxistest_eingereicht_am` (Timestamp). Der 400-Error im Network-Log bestätigt das:

```
"column contractor_onboarding.praxistest_eingereicht does not exist"
"hint": "Perhaps you meant to reference the column contractor_onboarding.praxistest_eingereicht_am"
```

Dieser Fehler kann den gesamten Coaching-View zum Absturz bringen und ggf. auch andere Queries blockieren (React Query Error Boundaries).

### Problem 2: Praxistest-Einreichung funktioniert technisch
Die RPCs (`update_contractor_praxistest`, `get_pending_praxistests`, `approve_contractor_praxistest`) existieren alle korrekt. Die Onboarding-State-Hydration funktioniert. Der Praxistest-Bereich zeigt sich nach bestandenem Test korrekt an (Screenshot bestätigt).

### Problem 3: Admin-Übersicht existiert bereits
Der Admin hat unter "Abnahme" → Tab "Praxistests" bereits die Übersicht. Sie zeigt aber leer an, weil noch kein Praxistest erfolgreich eingereicht wurde (DB bestätigt: `praxistest_eingereicht_am IS NULL` für alle Datensätze).

## Fazit
Der Hauptfehler ist die kaputte Query in `useMyCoachingRideAlongs.ts`, die einen 400-Error verursacht. Wenn der User als Trainer eingeloggt ist, könnte dieser Fehler Seiteneffekte haben.

## Umsetzung

### 1. Fix: `useMyCoachingRideAlongs.ts` — falsche Spalte
**Zeile 60:** `praxistest_eingereicht` → `praxistest_eingereicht_am`
**Zeile 95:** Ableitung anpassen: `praxistestEingereicht: !!onb?.praxistest_eingereicht_am`

### 2. Sicherheit: Praxistest-Einreichung testen
Nach dem Fix sollte die Einreichung E2E getestet werden, um sicherzustellen, dass keine weiteren Blocker bestehen.

## Betroffene Datei

| Datei | Änderung |
|-------|----------|
| `src/hooks/useMyCoachingRideAlongs.ts` | Spaltenname korrigieren |

