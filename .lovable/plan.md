

# Akademie UI: 3-stufiges Accordion + Kritische Bug-Fixes

## Identifizierte Probleme (durch Reverse Engineering)

### Bug 1: Sub-Lektionen koennen NICHT abgeschlossen werden (KRITISCH)
`completeAkademieUnterpunkt()` in `useOnboardingState.ts` durchsucht nur `hm.unterpunkte` -- NICHT `up.children`. Wenn ein User Lektion 6.3.1 oder 6.3.2 abschliesst, wird die ID nicht gefunden und der Fortschritt geht verloren. Der User bleibt in der Akademie stecken.

### Bug 2: findUnterpunktInHauptmodule ignoriert Kinder
In `useAkademieContent.ts` sucht `findUnterpunktInHauptmodule()` nur in der obersten Ebene. Kinder-Lektionen werden nie gefunden.

### Bug 3: Code-Darstellung mit Bindestrichen statt Punkten
Codes werden als `6-3-1` angezeigt statt `6.3.1`.

### Bug 4: GruppenLektion ist immer offen
Die Kinder einer Gruppen-Lektion (6-3) werden immer angezeigt statt aufklappbar zu sein. Das ueberladene UI ist das Problem aus den Screenshots.

### Bug 5: Modul-Nummern korrekt aber nicht optimal sichtbar
Die `displayNummer` wird korrekt gerendert (Zeile 258), aber bei Modul 0 steht nur "0" im Kreis. Das ist technisch korrekt aber visuell unauffaellig.

## Kein DB-Change noetig
Die Datenbank-Struktur ist verifiziert und korrekt:
- 12 Module (0-10 + modul-11 falls vorhanden)
- Modul 6 hat korrekt: 6-1, 6-2, 6-3, 6-3-1, 6-3-2, 6-4, 6-5
- `buildHierarchicalUnterpunkte()` gruppiert korrekt nach Code-Pattern

## Kein RLS/IAM-Change noetig
- Die Akademie-Inhalte sind read-only fuer alle authentifizierten User (`auth.uid() IS NOT NULL`)
- Fortschritt wird lokal (localStorage) + in `contractor_onboarding` (eigener Record) gespeichert
- Keine neuen Tabellen, keine neuen Policies

## Betroffene Dateien und Aenderungen

### Datei 1: `src/hooks/useOnboardingState.ts`

**Fix A -- completeAkademieUnterpunkt muss Kinder durchsuchen (Zeile 307-323)**

Aktuell durchsucht die Funktion nur `hm.unterpunkte.map()`. Kinder von Gruppen-Lektionen werden nicht erreicht.

Loesung: Rekursiv auch `up.children` durchsuchen und dort `abgeschlossen` setzen:

```text
completeAkademieUnterpunkt(hauptmodulId, unterpunktId):
  Fuer jedes Hauptmodul:
    Fuer jeden Unterpunkt:
      Wenn unterpunktId == up.id -> markiere abgeschlossen
      Wenn up.children existieren:
        Fuer jedes Kind:
          Wenn unterpunktId == child.id -> markiere abgeschlossen
```

### Datei 2: `src/hooks/useAkademieContent.ts`

**Fix B -- findUnterpunktInHauptmodule muss Kinder durchsuchen (Zeile 286-297)**

Aktuell: `hauptmodul.unterpunkte.find(up => up.id === lektionId)` -- findet keine Kinder.

Loesung: Auch `up.children` durchsuchen:
```text
Fuer jedes Hauptmodul:
  Fuer jeden Unterpunkt:
    Wenn up.id == lektionId -> return
    Fuer jedes Kind in up.children:
      Wenn child.id == lektionId -> return
```

### Datei 3: `src/components/onboarding/steps/AcademyStep.tsx`

**Aenderung C -- GruppenLektion wird zum verschachtelten Accordion**

Die `GruppenLektion`-Komponente wird umgebaut: Statt die Kinder immer sichtbar anzuzeigen, wird ein inneres `Accordion` verwendet. Die Eltern-Lektion (z.B. 6.3 Dokumentationsstandard) wird zur aufklappbaren Zeile. Erst beim Aufklappen erscheinen die Kind-Lektionen.

Radix UI unterstuetzt verschachtelte Accordions nativ -- kein neues Package noetig.

**Aenderung D -- Code als Punkt-Notation anzeigen**

Ueberall wo `unterpunkt.code` oder `parent.code` gerendert wird, wird `code.replace(/-/g, '.')` angewendet. Aus `6-3-1` wird `6.3.1`.

Betrifft:
- `LektionRow` Zeile 104
- `GruppenLektion` Zeile 154

**Aenderung E -- Modul-Nummer weiterhin korrekt (kein Change)**

Zeile 258 zeigt bereits `hauptmodul.displayNummer`. Das ist korrekt. Modul 0 zeigt "0", Modul 6 zeigt "6". Kein Aenderungsbedarf.

### Zusammenfassung betroffene Dateien

| Datei | Aenderung | Risiko |
|-------|-----------|--------|
| `useOnboardingState.ts` | completeAkademieUnterpunkt: Kinder-Suche | Gering -- additive Logik |
| `useAkademieContent.ts` | findUnterpunktInHauptmodule: Kinder-Suche | Gering -- additive Logik |
| `AcademyStep.tsx` | Nested Accordion + Punkt-Notation | Mittel -- UI-Refactor |

## Edge Cases

1. **Lektion ohne Kinder**: Wird wie bisher als klickbare Zeile gerendert (LektionRow). Kein Change.
2. **Gruppen-Lektion mit 0 Kindern**: Wird als normale Lektion gerendert (isGroup wuerde false sein, da buildHierarchicalUnterpunkte nur isGroup=true setzt wenn children.length > 0).
3. **Fortschritt nach Code-Aenderung**: Bestehender localStorage-Progress wird korrekt migriert, da `hydrateAkademieFromDb` nach ID matcht (UUIDs), nicht nach Code.
4. **Alle Kinder einer Gruppe abgeschlossen**: Die Gruppen-Lektion zeigt einen gruenen Haken und Badge "2/2".
5. **Modul 0 im Abschlusstest**: Zaehlt weiterhin zum Gesamtfortschritt (wie bisher). Falls gewuenscht, kann das spaeter geaendert werden.
6. **Mobile Touch-Targets**: Nested Accordion-Trigger haben mindestens 44px Hoehe fuer Touch.

## Keine Migration noetig
- Keine DB-Schema-Aenderungen
- localStorage-Struktur bleibt identisch (IDs sind UUIDs, Progress-Map matcht korrekt)
- Keine neuen Spalten, Tabellen oder ENUMs
