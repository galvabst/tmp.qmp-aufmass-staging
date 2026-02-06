
# Akademie-Fortschritt aus DB synchronisieren

Aktuell wird der Akademie-Fortschritt (welche Lektionen abgeschlossen, ob Test bestanden) **nur im localStorage** gespeichert. Die Tabelle `contractor_akademie_lektions_fortschritt` wird zwar befuellt, aber nie vom Frontend gelesen. Dadurch zeigt die App den Akademie-Schritt nicht als "fertig" an, obwohl die DB-Daten vorhanden sind.

## Aenderungen

### 1. Neuer Hook: `useAkademieFortschritt`

Neuer Hook, der die abgeschlossenen Lektions-IDs aus `contractor_akademie_lektions_fortschritt` laedt (direkt via `thermocheckClient`, wie `useAkademieContent` es auch tut).

Liefert: `Set<string>` mit allen `lektion_id`s die `status = 'completed'` haben.

### 2. Neues DB-Feld: `akademie_test_bestanden` auf `contractor_onboarding`

Eine neue Spalte `akademie_test_bestanden boolean DEFAULT false` auf `thermocheck.contractor_onboarding`, damit der Test-Status persistent ist. Fuer Anton wird sie direkt auf `true` gesetzt.

### 3. RPC erweitern: `get_contractor_onboarding_state`

Die RPC-Funktion wird um `akademie_test_bestanden` erweitert, sodass der Wert beim Laden des Onboarding-States mitkommt.

### 4. `OnboardingScreen` hydration erweitern

Nach dem Laden der Akademie-Module und des Fortschritts aus der DB:
- Alle Lektionen, deren IDs im Fortschritts-Set sind, werden als `abgeschlossen: true` markiert
- `akademieTestBestanden` wird aus dem DB-State geladen

### 5. Test-User: `akademie_test_bestanden = true` setzen

Migration setzt `akademie_test_bestanden = true` fuer Antons Onboarding-Record.

## Technische Details

```text
Datenfluss (neu):
  DB: contractor_akademie_lektions_fortschritt
    |
    v
  useAkademieFortschritt() --> Set<lektion_id>
    |
    v
  OnboardingScreen: hydrateAkademieFromDb() 
    merge mit completedLektionIds --> abgeschlossen: true
    
  DB: contractor_onboarding.akademie_test_bestanden
    |
    v  
  useContractorProfile --> onboardingState.akademieTestBestanden
    |
    v
  OnboardingScreen: setAkademieTestBestanden(true)
```

### Dateien die geaendert werden:
- **Neue Datei**: `src/hooks/useAkademieFortschritt.ts` - Hook zum Laden der Fortschrittsdaten
- **Migration**: Spalte `akademie_test_bestanden` + Update fuer Anton
- **`src/hooks/useContractorProfile.ts`** - `akademieTestBestanden` aus RPC-Response mappen
- **`src/components/OnboardingScreen.tsx`** - Fortschritt aus DB in Akademie-State hydrieren + `akademieTestBestanden` aus DB laden
- **RPC** `get_contractor_onboarding_state` - Neues Feld zurueckgeben
