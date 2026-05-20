## Problem

Alexandra Jaap hat in der DB weiterhin `onboarding_status = 'mitfahrt'` – die Statusänderung auf "ausgestiegen" wurde **nicht persistiert**. Das erklärt, warum sie weiterhin in der Karte und in der Liste auftaucht (die Filter exkludieren `ausgestiegen`/`gefeuert` korrekt).

Verifiziert:
- DB: `SELECT onboarding_status FROM contractor_onboarding WHERE profile=Jaap` → `mitfahrt`
- RPC `set_contractor_austritt` ist korrekt (released Aufträge + setzt Status), `is_innendienst()`-Check vorhanden
- Liste exkludiert `EHEMALIGE_STATUSES = ['ausgestiegen','gefeuert','deaktiviert']` korrekt
- Karte exkludiert `ausgestiegen/gefeuert/deaktiviert/invited` korrekt
- **Karten-Popup bietet aber NUR `Pausieren` (→inaktiv) und `Feuern` (→gefeuert), KEIN `Ausgestiegen`** – inkonsistent mit Liste

Wahrscheinliche Ursache: Du hast in der Karte "Feuern" geklickt (es gibt dort kein "Ausgestiegen"); der Klick wurde entweder nicht bestätigt, oder der Toast/Fehler ist untergegangen. Das mutate-Callback `setContractorOnboardingStatus` hat **keinen try/catch + Toast** – Fehler verschwinden lautlos.

## Lösung

### 1) Karte: Aktion "Ausgestiegen" ergänzen + Fehler-Feedback
- `useAdminHiringMap.ts` Action-Type erweitern: `'pause' | 'fire' | 'exit' | 'reactivate'`
- `'exit'` ruft **dieselbe RPC** `set_contractor_austritt` mit `p_status='ausgestiegen'` (statt direkter UPDATE), damit zugewiesene Aufträge auch im Karten-Flow zurück in den Pool freigegeben werden – Parität mit der Liste.
- Auch `pause` und `fire` auf RPC umstellen (heute direkter UPDATE → Aufträge bleiben am Ex-Techniker hängen!).
- Im Popup-UI (`AdminHiringMap.tsx`) dritten Button "Ausgestiegen" zwischen Pausieren und Feuern hinzufügen, mit Bestätigungsdialog + optionalem Grund-Feld (identisch zur Liste).
- Mutation in `try/catch` mit `toast.success`/`toast.error` – keine stillen Fehler mehr.

### 2) Alexandra reparieren
Einmalig: über die Liste (Suche "jaap" → 3-Punkte-Menü → Ausgestiegen) oder den neuen Karten-Button erneut markieren. Danach verschwindet sie aus Karte+Liste, ihre 0 offenen Aufträge gehen zurück in den Pool.

### 3) Defensive Verifikation
Nach jeder Statusänderung: `queryClient.invalidateQueries` + Refetch + Toast mit konkreter Anzahl freigegebener Aufträge (gibt die RPC bereits zurück).

## Out of scope
- KPI-Karten ("Onboarding 16") – sind reine Aggregate über bereits gefilterte Liste, werden durch Fix automatisch korrekt.
- Karten-Heatmap – nutzt dieselbe Query, ebenfalls automatisch korrekt.

## Dateien
- `src/features/admin/hooks/useAdminHiringMap.ts` – RPC statt UPDATE, neue Action `exit`, Toast/Error-Handling
- `src/features/admin/ui/AdminHiringMap.tsx` – Button "Ausgestiegen" + Confirm/Grund-Dialog im Popup
- Keine DB-Migration nötig (RPC existiert)
