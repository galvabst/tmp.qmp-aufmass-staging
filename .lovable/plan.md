## Problem

1. **Mark Röder** ist auf `onboarding_status = 'inaktiv'` gesetzt, taucht aber trotzdem in **Aktive** und **Einsatzbereit** auf. Grund: In `useAdminContractorList.ts` überschreibt `is_trainer` den echten Status (`is_trainer ? 'ready' : status`). Inaktive Trainer werden dadurch fälschlich als "Einsatzbereit" angezeigt.
2. Die Status‑Chips (Angelegt, Blockiert, Gestartet …) zeigen oft **0 Treffer** und wirken wie tote Filter. Sie sind im aktuellen Tab nicht nützlich, weil die Hauptnavigation bereits über das Segmented Control (Onboarding / Aktive / Alle / Inaktiv) läuft.

## Lösung

### 1. `inaktiv` hat Vorrang vor `is_trainer`
In `useAdminContractorList.ts`:
```ts
onboardingStatus: o.onboarding_status === 'inaktiv'
  ? 'inaktiv'
  : (o.is_trainer ? 'ready' : (o.onboarding_status ?? 'angelegt'))
```
Ehemalige Stati (`ausgestiegen`, `gefeuert`, `deaktiviert`) ebenfalls nicht durch Trainer‑Flag überschreiben.

Effekt: Mark Röder verschwindet aus **Aktive** und erscheint korrekt in **Inaktiv**.

### 2. Status‑Chips ausblenden wenn leer
In `ContractorListView.tsx` die `statusOptions` so filtern, dass nur Stati mit `count > 0` im aktuellen Tab erscheinen. Counts werden aus dem bereits gefilterten Datensatz (vor `statusFilter`) berechnet. So sieht der Nutzer nur Filter, die echte Treffer liefern.

Optional: Counts direkt in den Chip‑Labels einblenden (z. B. „In Bearbeitung (12)").

### 3. (Klein) Tab „Inaktiv" als Standard‑Sort
Inaktive Techniker, deren `is_trainer = true`, zusätzlich mit Trainer‑Badge in der Karte zeigen, damit erkennbar bleibt, dass es ein pausierter Trainer ist.

## Geänderte Dateien
- `src/features/contractors/hooks/useAdminContractorList.ts` — Status‑Mapping (Inaktiv/Ehemalig > Trainer > onboarding_status)
- `src/features/contractors/ui/ContractorListView.tsx` — `statusOptions` nur mit `count > 0`, optional Counts im Label

Keine DB‑Migration nötig.
