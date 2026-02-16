

## Fix: Quiz bleibt bei "Quiz wird geladen..." haengen

### Ursache

Beim Oeffnen des Modals passiert Folgendes:

1. `useEffect([open])` setzt den State auf `'loading'`
2. `useEffect([isLoading, fragen.length])` soll auf `'questions'` wechseln
3. ABER: Die Quiz-Daten sind bereits im React-Query-Cache (staleTime: 5 Minuten), d.h. `isLoading` ist sofort `false` und `fragen.length` ist sofort > 0
4. Da sich diese Werte nicht aendern, wird der zweite Effect **nicht erneut ausgefuehrt**
5. Ergebnis: State bleibt auf `'loading'` haengen

Beim allerersten Oeffnen funktioniert es, weil `isLoading` initial `true` ist und sich dann zu `false` aendert. Ab dem zweiten Mal bleiben die Werte gleich.

### Loesung

Den `state` direkt im ersten Effect setzen, wenn die Daten bereits verfuegbar sind:

```text
useEffect(() => {
  if (open) {
    setCurrentIndex(0);
    setAntworten({});
    setResult(null);
    // Wenn Daten bereits gecacht sind, direkt zu 'questions' wechseln
    if (!isLoading && fragen.length > 0) {
      setState('questions');
    } else {
      setState('loading');
    }
  }
}, [open]);
```

### Technische Aenderung

| Datei | Aenderung |
|---|---|
| `src/components/akademie/QuizModal.tsx` | Zeilen 47-55: Den Reset-Effect so anpassen, dass er den Cache-Zustand prueft und direkt zu `'questions'` wechselt, wenn Daten bereits vorhanden sind |

Der zweite `useEffect` (Zeilen 57-62) bleibt bestehen fuer den Fall, dass die Daten erst spaeter geladen werden (erster Aufruf).

