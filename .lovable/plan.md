

# Plan: Vergangene Coaching-Termine ausfiltern

## Änderung

**Datei:** `src/hooks/useCoachingSlots.ts`, Zeile ~130-131

Nach dem Laden der Termine pro Auftrag, vor dem Weiterverarbeiten: Termine filtern auf `datum >= heute`, und Aufträge ohne verbleibende zukünftige Termine überspringen.

```ts
// Zeile 130-131 ersetzen durch:
const today = new Date().toISOString().slice(0, 10);
const auftragTermine = (termineByAuftrag.get(auftrag.id) || [])
  .filter(t => t.datum >= today);
if (auftragTermine.length === 0) continue;
```

Keine DB-Änderung. Eine Zeile Code-Änderung.

