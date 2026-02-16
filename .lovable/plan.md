
## Fix: Quiz-Ergebnisse werden nicht in der Datenbank gespeichert

### Gefundene Bugs

**Bug 1: Supabase-Fehler werden verschluckt**
Der Code nutzt `try/catch` um den Insert abzufangen. Supabase wirft aber KEINEN Error -- es gibt `{ data, error }` zurueck. Der `catch`-Block wird also nie ausgefuehrt und Fehler werden komplett ignoriert.

```text
// AKTUELL (Bug):
try {
  await thermocheckClient.from(...).insert({...});
} catch (e) {
  console.warn('[Quiz] Could not save result to DB:', e);
}

// FIX:
const { error } = await thermocheckClient.from(...).insert({...});
if (error) {
  console.error('[Quiz] Could not save result to DB:', error);
}
```

**Bug 2: `modul_id` ist UUID, aber 'abschlusspruefung' ist kein UUID**
Die Spalte `modul_id` in der Datenbank ist vom Typ `uuid`. Bei der Abschlusspruefung wird aber der String `'abschlusspruefung'` uebergeben -- das ist kein gueltiger UUID und der Insert schlaegt fehl.

### Loesung

| Datei | Aenderung |
|---|---|
| `src/hooks/useModulQuiz.ts` | 1. `try/catch` durch korrekte Supabase-Fehlerbehandlung ersetzen (`{ error }` pruefen) |
| `src/hooks/useModulQuiz.ts` | 2. Fuer die Abschlusspruefung einen festen UUID als `modul_id` verwenden (z.B. `00000000-0000-0000-0000-000000000000`) oder `modul_id` nullable machen |

### Empfohlener Ansatz fuer Bug 2

Die sauberste Loesung: `modul_id` in der Ergebnis-Tabelle nullable machen, sodass `null` die Abschlusspruefung repraesentiert.

1. **Migration**: `ALTER TABLE thermocheck.contractor_akademie_quiz_ergebnis ALTER COLUMN modul_id DROP NOT NULL;`
2. **Code**: Bei `modulId === undefined` (Abschlusspruefung) wird `modul_id: null` gespeichert statt einen ungültigen String

### Code-Aenderungen in `src/hooks/useModulQuiz.ts`

Zeilen 158-171 (Insert-Block):
```text
// Korrekte Fehlerbehandlung + nullable modul_id
const { error: insertError } = await thermocheckClient
  .from('contractor_akademie_quiz_ergebnis')
  .insert({
    contractor_id: contractorId,
    modul_id: modulId === 'abschlusspruefung' ? null : modulId,
    score,
    bestanden,
    antworten: antworten as any,
  });

if (insertError) {
  console.error('[Quiz] Could not save result to DB:', insertError);
}
```

Zeile 107 im QuizModal bleibt unveraendert (`modulId || 'abschlusspruefung'`), da die Behandlung im Hook passiert.
