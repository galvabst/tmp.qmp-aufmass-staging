

# Fix: Profildaten (Name, Email, Telefon) werden nicht aus DB geladen

## Problem

Die Merge-Logik in `OnboardingScreen.tsx` prueft nur drei Faelle fuer die DB-Hydration:
1. `state.profil.id === ''` (ID leer)
2. State hat kein Avatar, DB schon
3. State hat keine Adresse, DB schon

Es fehlt die Pruefung: **State hat keinen Namen/Email/Telefon, aber DB schon.** Wenn ein neuer User sich anmeldet und der localStorage noch keine Profildaten hat (aber bereits eine ID), werden Vorname, Nachname, Email und Telefon nicht aus der DB uebernommen.

## Loesung

Die Merge-Bedingung in `OnboardingScreen.tsx` (ca. Zeile 195) um eine weitere Pruefung erweitern:

```text
Aktuelle Bedingung:
  id === '' || (kein Avatar && DB hat Avatar) || (keine Adresse && DB hat Adresse)

Neue Bedingung (zusaetzlich):
  || (kein Vorname/Nachname im State && DB hat Vorname/Nachname)
```

### Konkrete Aenderung

In der Datei `src/components/OnboardingScreen.tsx`, im useEffect das die DB-Profildaten merged:

Eine neue Variable `stateMissingName` hinzufuegen:

```
const stateMissingName =
  !state.profil.vorname?.trim() ||
  !state.profil.nachname?.trim();

const dbHasName =
  !!dbProfile.vorname?.trim() &&
  !!dbProfile.nachname?.trim();
```

Und die if-Bedingung erweitern:

```
if (
  state.profil.id === '' ||
  (stateHasNoAvatar && dbHasAvatar) ||
  (stateMissingAddress && dbHasAddress) ||
  (stateMissingName && dbHasName)        // NEU
) {
```

## Betroffene Datei

| Datei | Aenderung |
|---|---|
| `src/components/OnboardingScreen.tsx` | Merge-Bedingung um Name-Check erweitern (ca. 4 Zeilen) |

## Erwartetes Ergebnis

Wenn ein Contractor den Onboarding-Profil-Schritt oeffnet, werden Vorname, Nachname, Email und Telefon sofort aus der Datenbank vorausgefuellt - genau wie es vorher funktioniert hat.
