

# Plan: Auto-Save alle 2 Minuten + Date-Bug-Fix

## Zusammenfassung

Zwei Aenderungen:

1. **Auto-Save**: Alle 2 Minuten wird das Formular automatisch im Hintergrund gespeichert (ohne Toast-Benachrichtigung, damit der Techniker nicht gestoert wird). Nur wenn das Formular nicht read-only ist und Daten vorhanden sind.

2. **Bug-Fix**: Aktuell schlaegt das Speichern fehl (400-Error: `invalid input syntax for type date: ""`), weil leere Datums-Strings (`""`) an die DB gesendet werden. Leere Strings muessen vor dem Speichern zu `null` konvertiert werden.

## Aenderungen

### 1. `src/features/aufmass/hooks/useVotFormular.ts` — Leere Strings sanitizen

Im `mutationFn` nach dem Payload-Aufbau alle leeren Strings zu `null` konvertieren:

```typescript
// Nach der Payload-Schleife:
for (const key of Object.keys(dbPayload)) {
  if (dbPayload[key] === '') dbPayload[key] = null;
}
```

Ausserdem: `onSuccess` bekommt einen optionalen `silent`-Parameter. Wenn `silent === true`, wird kein Toast angezeigt (fuer Auto-Save).

### 2. `src/features/aufmass/hooks/usePvFormular.ts` — Gleiche Sanitization

Gleiche leere-String-zu-null-Konvertierung im PV-Upsert-Hook.

### 3. `src/features/aufmass/ui/AufmassFormPage.tsx` — Auto-Save Timer

Ein `useEffect` mit `setInterval` (120_000ms = 2 Minuten):

- Prueft ob `auftragId`, `userId` vorhanden und `!isReadOnly`
- Ruft `handleSaveDraft` auf, aber mit `silent: true` damit kein Toast erscheint
- Cleanup: `clearInterval` bei Unmount
- Kein Auto-Save waehrend eines manuellen Saves (`isSaving`)

### Technische Details

**Silent-Save**: Die Mutations bekommen ein `silent`-Flag. Bei `silent: true` wird der `onSuccess`-Toast unterdrueckt. So sieht der Techniker nur Toasts bei manuellem Speichern, nicht alle 2 Minuten.

**Date-Bug**: Das Problem ist, dass HTML-`<input type="date">` einen leeren String `""` zurueckgibt wenn nichts eingegeben wurde. PostgreSQL akzeptiert das nicht als gueltige Date-Eingabe — es muss `null` sein.

## Dateien

| Aktion | Datei |
|---|---|
| Aendern | `src/features/aufmass/hooks/useVotFormular.ts` |
| Aendern | `src/features/aufmass/hooks/usePvFormular.ts` |
| Aendern | `src/features/aufmass/ui/AufmassFormPage.tsx` |

