

# Datenbereinigung: Admin-Techniker-Ansichten auf Backend-Wahrheit bringen

## Analyse-Ergebnis

Nach tiefgehender Analyse des gesamten Datenflusswegs (DB -> Hooks -> UI) sind die Befunde:

**Kein Mock-Data-Problem.** Alle Admin-Views (`ContractorListView`, `AdminDashboardView`, `AdminHiringMap`) lesen ausschließlich echte DB-Daten via `useAdminContractorList`. Die Dateien `mockOrders.ts` und `mockTechnicianData.ts` existieren, werden aber nirgends importiert.

**Die echten Probleme:**

1. **Stale `onboarding_substatus`** — Fast alle Techniker zeigen "Stammdaten erfasst", obwohl sie längst bei Akademie, Coaching oder sogar Nachweise sind. Der DB-Trigger `sync_onboarding_status` aktualisiert den `onboarding_status`, aber der `onboarding_substatus` wird nicht mitgezogen. Das Recruiting-Team sieht dadurch veraltete Infos.

2. **Lektionen-Zähler als Primärmetrik irreführend** — "19/54 Lektionen" ist zwar korrekt aus der DB, aber als prominenteste Info auf der Karte verwirrt es, weil der aktuelle Onboarding-Schritt viel aussagekräftiger ist.

3. **Bug: `contractor_verspaetungen.gebuehr` existiert nicht** — Die Spalte heißt `gesamtbetrag`. Das verursacht einen 400-Fehler im Performance-Dashboard (`useAdminAggregatedStats`).

4. **Tote Dateien** — `src/data/mockOrders.ts` und `src/data/mockTechnicianData.ts` werden nirgends importiert.

---

## Plan

### 1. ContractorListView Karte: Schritt-Status zuerst

**Datei: `src/features/contractors/ui/ContractorListView.tsx` (Zeilen 353-379)**

- **Subtitle-Zeile**: Statt `onboarding_substatus` den `current_step` als Label zeigen (z.B. "Schritt: Akademie" statt "Stammdaten erfasst"), da der Substatus stale ist
- **Primäre Info**: `current_step` prominent mit farbigem Step-Badge
- **Sekundäre Info**: Lektionen-Zähler nur als kleine Zusatzinfo (`👁 19/54`) behalten, aber nicht mehr als erste Zeile
- Pipeline-Cards und Filter bleiben auf `onboarding_status` (das ist korrekt)

### 2. Fix: Spaltenname in useAdminAggregatedStats

**Datei: `src/features/admin/hooks/useAdminAggregatedStats.ts` (Zeile 53)**

- `gebuehr` -> `gesamtbetrag` (der echte Spaltenname laut DB-Schema)

### 3. Backfill: Stale Substatus korrigieren (Migration)

Eine Migration, die den `onboarding_substatus` für alle Techniker basierend auf ihrem tatsächlichen `current_step` und `completed_steps` aktualisiert:

```sql
UPDATE thermocheck.contractor_onboarding SET onboarding_substatus = 
  CASE 
    WHEN onboarding_status = 'ready' THEN NULL
    WHEN current_step IS NULL THEN 'neu_angelegt'
    WHEN current_step = 'profil' THEN 'stammdaten_erfasst'
    WHEN current_step = 'dokumente' THEN 'stammdaten_erfasst'
    WHEN current_step IN ('bestellungen','equipment') THEN 'kleidung_bestellen'
    WHEN current_step = 'akademie' THEN 'akademie_gestartet'
    WHEN current_step IN ('coaching','nachweise') 
      AND 'akademie' = ANY(completed_steps) THEN 'akademie_abgeschlossen'
    ELSE onboarding_substatus
  END
WHERE onboarding_status NOT IN ('deaktiviert','gefeuert','ready');
```

Betrifft konkret: Brian Maina, Christian Born, Achim Mönning (Akademie -> `akademie_gestartet`), Oliver Tollkühn, Andreas Petry, etc. (Bestellungen -> `kleidung_bestellen`).

### 4. Tote Dateien entfernen

- `src/data/mockOrders.ts` löschen
- `src/data/mockTechnicianData.ts` löschen

### 5. Validation-Dokument

Erstelle `.lovable/validation-admin-data-cleanup.md` mit Befunden, betroffenen Dateien und Testergebnissen.

---

## Betroffene Dateien

| Datei | Änderung |
|---|---|
| `src/features/contractors/ui/ContractorListView.tsx` | Karten-Layout: Step-Status prominent, Lektionen sekundär |
| `src/features/admin/hooks/useAdminAggregatedStats.ts` | `gebuehr` -> `gesamtbetrag` |
| Migration | Substatus-Backfill für ~15 Techniker |
| `src/data/mockOrders.ts` | Löschen |
| `src/data/mockTechnicianData.ts` | Löschen |
| `.lovable/validation-admin-data-cleanup.md` | Neu |

