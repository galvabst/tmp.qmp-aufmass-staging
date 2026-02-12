

## Bereits abgeschlossene Lektionen: Tabs dauerhaft offen + Video ueberspringbar

### Problemanalyse

Aktuell werden bei jedem Besuch einer Lektion die Lerninhalte-Tabs gesperrt und das Video ist nicht vorspulbar -- auch wenn die Lektion bereits abgeschlossen wurde. Der User muss das Video jedes Mal komplett neu anschauen.

### User Story

**Als Techniker** moechte ich nach dem erstmaligen Abschluss einer Lektion:
- Die Lerninhalte (Lerninhalt + Zusammenfassung Tabs) **sofort sehen** koennen
- Das Video **frei vor- und zurueckspulen** koennen
- Den "Als abgeschlossen markieren" Button **sofort** sehen (bereits erledigt)

### Technischer Ansatz

#### 1. Completion-Check aus localStorage

Die `AkademieModul`-Seite hat aktuell keinen Zugriff auf den Completion-Status. Der Fortschritt wird im localStorage (Onboarding-State) gespeichert. Wir lesen den gespeicherten State und pruefen, ob die aktuelle `lektionId` als `abgeschlossen` markiert ist.

**Neue Hilfsfunktion** in `src/hooks/useAkademieFortschritt.ts`:

```typescript
export function useIsLektionAlreadyCompleted(lektionId: string | undefined): boolean
```

Diese Funktion:
- Liest den Onboarding-State aus localStorage
- Durchsucht `akademieHauptmodule` nach der `lektionId`
- Gibt `true` zurueck wenn `abgeschlossen === true`

#### 2. Skip-Schutz deaktivieren fuer abgeschlossene Lektionen

In `src/hooks/useVideoProgress.ts` - `useBunnyPlayerProgress`:
- Neuer Parameter: `allowSeeking: boolean` (default: `false`)
- Wenn `allowSeeking === true`:
  - Kein `player.setCurrentTime(maxReached)` bei Skip-Erkennung
  - `canUnlockTabs` und `canMarkComplete` sofort `true`

#### 3. AkademieModul-Seite anpassen

In `src/pages/AkademieModul.tsx` - `AkademieModulContent`:
- `useIsLektionAlreadyCompleted(unterpunkt.id)` aufrufen
- Flag an `useBunnyPlayerProgress` weitergeben
- `canUnlockTabs` und `canMarkComplete` ueberschreiben wenn bereits abgeschlossen

### Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/hooks/useAkademieFortschritt.ts` | Neue Funktion `useIsLektionAlreadyCompleted` |
| `src/hooks/useVideoProgress.ts` | `allowSeeking` Parameter in `useBunnyPlayerProgress` |
| `src/pages/AkademieModul.tsx` | Completion-Check integrieren, Flags ueberschreiben |

### Edge Cases

- **Leerstehende localStorage**: Kein State vorhanden → `false` (normaler Ablauf)
- **Veraltete/Legacy IDs**: UUID-Validierung existiert bereits im System
- **Mehrere Tabs offen**: localStorage ist synchron, kein Race Condition
- **Erstmalig anschauen**: `allowSeeking = false` → unveraendertes Verhalten
- **DB-Fortschritt vs. localStorage**: Beide Quellen werden geprueft (localStorage hat Prioritaet da es der aktive State ist, DB-Fortschritt wird bei Hydration gemerged)

### Rollen-Matrix

Diese Aenderung betrifft nur die Client-seitige Video-Darstellung. Keine RLS-Policies oder DB-Schreibzugriffe werden veraendert:
- **Alle Rollen (user/manager/admin/superadmin)**: Lesen aus localStorage, keine DB-Mutation
- **Keine neuen Tabellen/Spalten**: Bestehende Datenstruktur wird nur gelesen
- **Kein Sicherheitsrisiko**: Skip-Schutz ist ein UX-Feature, keine Sicherheitsmassnahme

### Zusaetzlicher Bug-Fix

`useAkademieFortschritt` verwendet `.eq('onboarding_id', ...)` aber die Spalte heisst `contractor_id`. Wird als Teil dieser Aenderung korrigiert, damit der DB-Fortschritt auch korrekt geladen wird und bei der Completion-Pruefung beruecksichtigt werden kann.

