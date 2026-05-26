# Fix: "EU-Drohnenführerschein vorhanden" aus Nachweise-Checklist entfernen

## Problem
Im Onboarding-Step **Ausstattung bestätigen** (`ProofStep.tsx`) steht der Checklist-Eintrag „EU-Drohnenführerschein vorhanden". Das ist keine echte Voraussetzung und soll raus.

## Änderung
`src/components/onboarding/steps/ProofStep.tsx` — Zeile 23 aus dem Array `CHECKLIST_ITEMS` entfernen:

```diff
 const CHECKLIST_ITEMS = [
   { key: 'kleidung-erhalten', label: 'Arbeitskleidung erhalten (Zipper, Hausschuhe)' },
   { key: 'utensilien-komplett', label: 'Alle Pflichtutensilien vollständig' },
-  { key: 'drohnen-fuehrerschein', label: 'EU-Drohnenführerschein vorhanden' },
 ];
```

Die Completion-Prüfung (`allChecked = CHECKLIST_ITEMS.every(...)`) bleibt korrekt, weil sie über das Array iteriert.

## Was sich NICHT ändert
- Persistierte alte Häkchen (`drohnen-fuehrerschein: true`) in `checkliste` bleiben harmlos im Datensatz, werden nur nicht mehr gerendert/geprüft.
- Keine DB-Migration nötig (das Checklist-Objekt ist ein freier JSON-Record).
- Andere Stellen referenzieren den Key `drohnen-fuehrerschein` nicht (verifiziert per `rg`).
