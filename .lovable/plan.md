
# Bugfix-Plan: Onboarding muss DB-Status prüfen (nicht nur localStorage)

## Identifiziertes Problem

Die App zeigt "Du bist einsatzbereit!" obwohl:
- `onboarding_substatus = 'neu_angelegt'` (nicht 'einsatzbereit')
- `trainer_freigabe = FALSE`
- `contractor_akademie_lektions_fortschritt` ist leer (keine Lektionen abgeschlossen)

**Root Cause:** Die gesamte Onboarding-Logik basiert ausschließlich auf localStorage. Die Datenbank wird niemals abgefragt.

## Lösung: DB als Single Source of Truth

### Architektur-Änderung

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ONBOARDING STATUS CHECK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐                                                            │
│  │   App Start  │                                                            │
│  └──────┬───────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌────────────────────────────────────┐                                     │
│  │ 1. Prüfe auth.user() vorhanden?    │                                     │
│  └─────────────┬──────────────────────┘                                     │
│                │ Ja                                                          │
│                ▼                                                             │
│  ┌────────────────────────────────────┐                                     │
│  │ 2. Lade contractor_onboarding      │                                     │
│  │    WHERE profile_id = auth.uid()   │                                     │
│  └─────────────┬──────────────────────┘                                     │
│                │                                                             │
│         ┌──────┴──────┐                                                      │
│         ▼             ▼                                                      │
│   Kein Eintrag   Eintrag gefunden                                           │
│       │               │                                                      │
│       │               ▼                                                      │
│       │         ┌────────────────────────────────────┐                       │
│       │         │ 3. Prüfe onboarding_substatus:     │                       │
│       │         │    - 'einsatzbereit' UND           │                       │
│       │         │    - trainer_freigabe = TRUE       │                       │
│       │         └─────────────┬──────────────────────┘                       │
│       │                       │                                              │
│       │              ┌────────┴────────┐                                     │
│       │              ▼                 ▼                                     │
│       │         Alle erfüllt      Nicht erfüllt                             │
│       │              │                 │                                     │
│       ▼              ▼                 ▼                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐               │
│  │Anmeldung │  │  Zeige       │  │ Zeige Onboarding-Wizard  │               │
│  │ verweig. │  │  Hauptapp    │  │ beim aktuellen Schritt   │               │
│  └──────────┘  └──────────────┘  └──────────────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementierung

#### Schritt 1: Neuer Hook für DB-Onboarding-Status

Neuer Hook: `src/hooks/useContractorOnboardingStatus.ts`

Funktionen:
- Lädt `contractor_onboarding` für den eingeloggten User
- Prüft `onboarding_substatus` und `trainer_freigabe`
- Gibt `isReady`, `isLoading`, `onboardingRecord` zurück
- Cached mit React Query für Performance

#### Schritt 2: Index.tsx anpassen

Änderungen:
- Import des neuen Hooks
- Prüfe DB-Status bevor localStorage geprüft wird
- Zeige Loading-State während DB-Abfrage
- DB-Status hat Priorität über localStorage

Logik:
```typescript
// Pseudocode
const { isReady, isLoading, onboardingRecord } = useContractorOnboardingStatus();

// Wenn noch am Laden -> Loading anzeigen
if (isLoading) return <LoadingScreen />;

// Wenn kein Contractor-Eintrag -> Zugang verweigern
if (!onboardingRecord) return <AccessDenied />;

// Wenn nicht einsatzbereit ODER keine Trainer-Freigabe -> Onboarding anzeigen
if (!isReady) {
  return <OnboardingScreen ... />;
}

// Ansonsten -> Hauptapp anzeigen
return <MainApp />;
```

#### Schritt 3: localStorage als Fallback/Cache

Änderungen in `useOnboardingState.ts`:
- Beim ersten Laden: Sync mit DB-Status
- localStorage dient nur als Offline-Cache
- Bei DB-Konflikt: DB gewinnt immer

#### Schritt 4: Berechnung der Step-Position aus DB

Neue Logik um den aktuellen Schritt zu berechnen basierend auf:
- `contractor_bestellungen` (welche Produkte bezahlt?)
- `contractor_akademie_lektions_fortschritt` (welche Lektionen abgeschlossen?)
- `contractor_onboarding` Felder (Gewerbeschein, etc.)

## Dateien die geändert werden

| Datei | Aktion | Beschreibung |
|-------|--------|--------------|
| `src/hooks/useContractorOnboardingStatus.ts` | NEU | DB-Status-Hook mit React Query |
| `src/pages/Index.tsx` | ÄNDERN | DB-Prüfung vor localStorage |
| `src/hooks/useOnboardingState.ts` | ÄNDERN | DB-Sync bei Initialisierung |
| `src/components/ui/LoadingScreen.tsx` | NEU (optional) | Loading-Anzeige während DB-Check |

## Sicherheitsaspekte

- RLS-Policy auf `contractor_onboarding` stellt sicher dass User nur eigene Daten sieht
- `trainer_freigabe` kann nur von berechtigten Rollen gesetzt werden (manager, admin)
- Kein Bypass durch localStorage-Manipulation möglich nach dem Fix

## Technische Details

Query für den Status-Check:
```sql
SELECT 
  co.id,
  co.onboarding_substatus,
  co.trainer_freigabe,
  co.trainer_freigabe_am,
  -- Akademie-Fortschritt aggregiert
  (SELECT COUNT(*) FROM thermocheck.contractor_akademie_lektions_fortschritt 
   WHERE contractor_id = co.id AND status = 'completed') as lektionen_abgeschlossen,
  -- Bestellungen
  (SELECT COUNT(*) FROM thermocheck.contractor_bestellungen 
   WHERE onboarding_id = co.id AND status = 'paid') as bestellungen_bezahlt
FROM thermocheck.contractor_onboarding co
WHERE co.profile_id = auth.uid()
```

Bedingung für "einsatzbereit":
```typescript
const isReady = 
  onboardingRecord.onboarding_substatus === 'einsatzbereit' &&
  onboardingRecord.trainer_freigabe === true;
```
