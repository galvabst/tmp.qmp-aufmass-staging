## Ziel
Sequentielle Modul-Sperre in der Akademie greift nur noch beim **Erstdurchlauf**. Sobald der Kandidat die Akademie einmal komplett abgeschlossen hat, sind ab dann **alle Module dauerhaft frei navigierbar** — auch neu hinzugefügte Module blockieren nicht mehr nachfolgende Inhalte. Erstes Anschauen jeder einzelnen Lektion bleibt unskippbar (bereits umgesetzt via `hideSeekbar`), wiederholtes Anschauen ist skippbar (bereits umgesetzt via DB-Check).

## Signal „Erstdurchlauf bereits abgeschlossen"
Quelle der Wahrheit ist `thermocheck.contractor_onboarding`. Ein Kandidat gilt als „Akademie-Erstdurchlauf erledigt", wenn **mindestens eine** dieser Bedingungen zutrifft:

1. `onboarding_status = 'ready'` (Onboarding komplett abgeschlossen — Akademie war Pflichtschritt)
2. `'akademie' = ANY(completed_steps)` (Akademie-Step explizit als erledigt markiert)
3. `is_trainer = true` (Trainer haben grundsätzlich freien Zugang — bereits etablierte Regel)

Reicht für alle Bestandskunden plus zukünftige Kandidaten, ohne neue DB-Spalten oder Migrationen.

## Umsetzung

### 1) `AcademyStep.tsx`
- Neuen Prop `akademieErstdurchlaufAbgeschlossen: boolean` annehmen.
- Lock-Auswertung anpassen:
  ```ts
  const isUnlocked =
    isTrainer ||
    isPreview ||
    akademieErstdurchlaufAbgeschlossen ||
    isHauptmodulUnlocked(hauptmodulIndex, hauptmodule);
  ```
- Lock-Icon und `disabled`-State entfallen damit für Bestandskandidaten automatisch.
- `LektionInnerRow` braucht keine Änderung — Lektionsstart innerhalb eines freigeschalteten Moduls funktioniert bereits ungehindert.

### 2) `OnboardingScreen.tsx`
- Flag aus `dbStatus`/`onboardingRecord` ableiten:
  ```ts
  const akademieErstdurchlaufAbgeschlossen =
    onboardingRecord?.onboarding_status === 'ready' ||
    (onboardingRecord?.completed_steps ?? []).includes('akademie') ||
    onboardingRecord?.is_trainer === true;
  ```
- An `AcademyStep` durchreichen.

### 3) `AkademieModul.tsx` (Detailseite einer Lektion)
- Keine Änderung an Seekbar-Logik (bereits korrekt: `hideSeekbar={!isAlreadyCompleted}`).
- Optional kleine Härtung: Wenn `akademieErstdurchlaufAbgeschlossen`, dann `allowSeeking = true` unabhängig von einzelner Lektion. **Wird nicht eingebaut**, da die DB-Logik (erstes Mal unskippbar pro einzelner Lektion) genau die vom User formulierte Regel ist: „1. mal anschauen → unskipable, danach skippbar".

### 4) Optional: Sichtbarkeits-Hinweis
Wenn `akademieErstdurchlaufAbgeschlossen`, kleinen Info-Banner über der Modulliste anzeigen:
> „Du hast die Akademie abgeschlossen — alle Module sind frei zugänglich. Neue Lektionen erkennst du am Play-Icon."

## Was sich NICHT ändert
- Subscription-Overlay (bereits im letzten Schritt gefixt — Text + Gate via `onboarding_status === 'ready'`).
- DB-Schema, RLS, Migrationen.
- Erstdurchlauf-Erlebnis für komplett neue Kandidaten — Sperre greift weiterhin sequentiell, bis Step `akademie` in `completed_steps` landet.
- Pflichtvideo-Overlay für neue Lektionen nach „ready" (`PflichtVideoOverlay`) — bleibt aktiv, damit Content-Updates trotzdem einmalig erzwungen werden.

## Technische Details

| Datei | Änderung |
|---|---|
| `src/components/onboarding/steps/AcademyStep.tsx` | Prop `akademieErstdurchlaufAbgeschlossen` ergänzen, in `isUnlocked` einbinden |
| `src/components/OnboardingScreen.tsx` | Flag berechnen, an `AcademyStep` weiterreichen |
| `src/hooks/useContractorOnboardingStatus.ts` | Sicherstellen, dass `completed_steps` und `is_trainer` im Mapping enthalten sind (vermutlich schon) |

## Verifikation (nach Build-Mode)
1. **Christian Born (impersonate):** Akademie öffnen → alle Module ohne Schloss-Icon, alle expandierbar, alle Lektionen klickbar.
2. **Neuer Kandidat ohne Progress:** Modul 1 offen, Modul 2-N gesperrt — bisheriges Verhalten unverändert.
3. **Bereits abgeschlossene Lektion öffnen:** Seekbar vorhanden, Skippen funktioniert.
4. **Neue, noch nie geschaute Lektion öffnen:** Seekbar ausgeblendet, erst nach Komplett-Wiedergabe weiter.
