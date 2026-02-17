

## Fix: "Zum Auftrags-Pool" Button fuehrt nicht zum Pool

### Problem

Till sieht die "Du bist einsatzbereit"-Seite korrekt, aber ein Klick auf "Zum Auftrags-Pool" zeigt nur einen falschen Toast ("bitte warte auf Trainer-Freigabe") und bleibt auf derselben Seite haengen.

**Ursache:** Die `onComplete`-Callback in `Index.tsx` (Zeile 256-262) ruft nie `refetchOnboardingStatus()` auf. Dadurch bleibt der gecachte React-Query-State veraltet und `isDbReady` bleibt `false` -- die Seite rendert weiterhin `OnboardingScreen` statt den Pool.

### Loesung

**Datei:** `src/pages/Index.tsx`, Zeile 256-262

Aktuell:
```
onComplete={() => {
  if (isPreviewMode) {
    setIsPreviewMode(false);
    return;
  }
  toast.success('Onboarding abgeschlossen – bitte warte auf Trainer-Freigabe! 🎓');
}}
```

Neu:
```
onComplete={() => {
  if (isPreviewMode) {
    setIsPreviewMode(false);
    return;
  }
  refetchOnboardingStatus();
  toast.success('Willkommen im Pool! 🎉');
}}
```

### Technische Details

- `refetchOnboardingStatus()` ist bereits verfuegbar (Zeile 41 in Index.tsx, destrukturiert aus `useContractorOnboardingStatus`)
- Nach dem Refetch wird `isDbReady` in Index.tsx auf `true` evaluiert (weil die DB bereits `onboarding_status = 'ready'` hat)
- Die Bedingung `!isDbReady` (Zeile 240) wird dann `false`, und der Pool wird gerendert
- Die Toast-Nachricht wird korrigiert -- Trainer brauchen keine Freigabe abzuwarten

### Betroffene Dateien

| Datei | Aenderung |
|---|---|
| `src/pages/Index.tsx` | `onComplete` Callback: `refetchOnboardingStatus()` aufrufen + Toast-Text aendern |

