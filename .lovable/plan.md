
# Interne Admin-Checks als Zugangsvoraussetzung

Die drei internen Spalten `vertrag_geprueft_intern`, `kleidung_bestellt_intern` und `lizenzen_bereitgestellt_intern` muessen alle `true` sein, damit ein Techniker Auftraege annehmen kann. Aktuell werden sie weder vom RPC zurueckgegeben noch im Frontend geprueft.

## Aenderungen

### 1. DB-Migration: Anton auf true setzen + RPC erweitern

- `vertrag_geprueft_intern`, `kleidung_bestellt_intern`, `lizenzen_bereitgestellt_intern` fuer Anton (ID `17ef2646-e455-4d99-88ad-443b44ed9594`) auf `true` setzen
- Die RPC-Funktion `thermocheck.get_my_contractor_onboarding()` und den Public-Wrapper erweitern, sodass die drei Spalten im Ergebnis enthalten sind

### 2. Hook: `useContractorOnboardingStatus.ts`

- `ContractorOnboardingRecord` Interface um die drei neuen Felder erweitern
- `isReady`-Berechnung anpassen: Zusaetzlich zu `onboarding_status === 'ready'` und `trainer_freigabe === true` muessen auch alle drei intern-Felder `true` sein
- Die drei Felder aus der RPC-Response mappen

### 3. Keine UI-Aenderungen noetig

Wenn `isReady` false ist, zeigt die App bereits den Onboarding-Screen bzw. "Waiting for Approval". Es ist kein neuer Lockscreen noetig -- der bestehende Gate-Mechanismus greift automatisch.

## Dateien

- **Migration**: RPC-Update + Antons Daten
- **`src/hooks/useContractorOnboardingStatus.ts`**: Interface + isReady-Logik erweitern
