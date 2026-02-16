

## Fix: Akademie-Fortschritt wird nicht aus der DB in den UI-State uebernommen

### Ursache

Die `hydrateAkademieFromDb`-Funktion in `useOnboardingState.ts` (Zeilen 158-201) hat einen kritischen Fehler: Wenn die Modul-Struktur im localStorage bereits die gleichen IDs hat wie in der DB, wird die Hydration uebersprungen (Zeile 201: `return prev`). Das bedeutet, die `completedLektionIds` aus der DB werden **nie angewendet**, weil der Code denkt "die Struktur stimmt schon, nichts zu tun".

```text
Ablauf:
1. Erster Besuch: localStorage leer, Module werden geladen mit abgeschlossen=false
2. Module werden in localStorage gespeichert (alle abgeschlossen=false)
3. DB-Fortschritt (54 completed Records) wird geladen
4. hydrateAkademieFromDb prueft: dbIds === stateIds? -> JA (gleiche Struktur!)
5. -> return prev (keine Aenderung!) -> completedLektionIds werden ignoriert
6. Ergebnis: Alle Module bleiben "gesperrt"
```

Das `completed_at` NULL-Feld in der DB ist NICHT die Ursache -- die Query filtert nur nach `status = 'completed'`.

### Loesung

Die `hydrateAkademieFromDb`-Funktion muss die `completedLektionIds` IMMER auf die Module anwenden, auch wenn die Struktur (IDs) bereits uebereinstimmt. Konkret: Der `return prev`-Zweig (Zeile 201) muss ebenfalls die DB-Fortschrittsdaten mergen.

### Zum Thema "leere Lektionen nicht als Pflicht"

Das funktioniert bereits korrekt:
- `buildHierarchicalUnterpunkte` in `useAkademieContent.ts` filtert Lektionen ohne Video und ohne Text-Inhalt automatisch heraus
- Module ohne sichtbare Lektionen werden komplett versteckt (Zeile 223)
- `countLeafUnterpunkte` in `AcademyStep.tsx` zaehlt nur sichtbare (= inhaltshabende) Lektionen

### Technische Aenderung

| Datei | Aenderung |
|---|---|
| `src/hooks/useOnboardingState.ts` | Zeile 158-201: Den `else`-Zweig (wenn IDs uebereinstimmen) so aendern, dass `completedLektionIds` trotzdem angewendet werden |

Konkret wird der Block ab Zeile 158 so angepasst:

```text
// VORHER (Zeile 200-201):
return prev; // No change needed

// NACHHER:
// Struktur stimmt, aber DB-Fortschritt muss trotzdem gemergt werden
if (completedLektionIds && completedLektionIds.size > 0) {
  const updatedModules = currentHauptmodule.map(hm => ({
    ...hm,
    unterpunkte: hm.unterpunkte.map(up => ({
      ...up,
      abgeschlossen: up.abgeschlossen || completedLektionIds.has(up.id),
      children: up.children?.map(child => ({
        ...child,
        abgeschlossen: child.abgeschlossen || completedLektionIds.has(child.id),
      })),
    })),
  }));
  return { ...prev, akademieHauptmodule: updatedModules };
}
return prev;
```

Keine DB-Aenderungen noetig. Die 54 Fortschritt-Records sind bereits korrekt in der Datenbank.

