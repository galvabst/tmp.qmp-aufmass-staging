
# Fix: Akademie zeigt falsche Module

## Problem-Analyse

Die Akademie-Ansicht zeigt die alten 4 Module statt der neuen 13 Module weil:

1. **MOCK-Daten veraltet**: `onboarding-config.ts` enthält noch die alten 4 Module
2. **DB nicht erreichbar**: Die neuen Tabellen im `thermocheck` Schema sind nicht via REST API erreichbar
3. **Falscher Datenfluss**: `OnboardingScreen.tsx` verwendet lokalen State statt DB-Daten

---

## Lösung

### Schritt 1: MOCK_AKADEMIE_HAUPTMODULE aktualisieren

Die Datei `src/lib/onboarding-config.ts` muss mit den korrekten 13 Modulen und 52 Lektionen aktualisiert werden:

**Modul 0**: Willkommen & Orientierung (3 Lektionen)
**Modul 1**: Grundlagen: Thermocheck verstehen (3 Lektionen)
**Modul 2**: Service-Professionalität beim Kunden (5 Lektionen)
**Modul 3**: Sicherheit, Regeln & Compliance (4 Lektionen)
**Modul 4**: Terminvorbereitung (4 Lektionen)
**Modul 5**: Ablauf vor Ort (4 Lektionen)
**Modul 6**: Datenerhebung (5 Lektionen)
**Modul 7**: Tool- & Dokumentationsworkflow (4 Lektionen)
**Modul 8**: Abschluss beim Kunden (4 Lektionen)
**Modul 9**: Sonderfälle & Eskalationen (5 Lektionen)
**Modul 10**: Qualitätssicherung (4 Lektionen)
**Modul 11**: Praxisphase (3 Lektionen)
**Modul 12**: Prüfung & Zertifizierung (4 Lektionen)

### Schritt 2: localStorage zurücksetzen

Nach dem Update wird der alte State aus localStorage mit den falschen Modulen geladen. Der State muss bei Schema-Änderungen zurückgesetzt werden:

- Storage-Key versionieren: `thermocheck_onboarding_state_v2`
- Alte Daten werden ignoriert, neue MOCK-Daten werden verwendet

### Schritt 3: Datenfluss korrigieren (später)

Sobald das `thermocheck` Schema via REST API erreichbar ist:
- `useAkademieContent` Hook die neuen Tabellen abfragen lassen
- `OnboardingScreen` die DB-Daten verwenden statt lokaler State

---

## Technische Details

### Datei: src/lib/onboarding-config.ts

Ersetze `MOCK_AKADEMIE_HAUPTMODULE` mit:

```typescript
export const MOCK_AKADEMIE_HAUPTMODULE: AkademieHauptmodul[] = [
  {
    id: 'modul-0',
    titel: 'Willkommen & Orientierung',
    beschreibung: 'Ziel der Akademie und Lernpfad',
    reihenfolge: 0,
    unterpunkte: [
      { id: 'up-0-1', titel: 'Ziel der Akademie', beschreibung: 'Wofür qualifizieren wir?', videoUrl: '', dauerMinuten: 5, reihenfolge: 1, abgeschlossen: false },
      { id: 'up-0-2', titel: 'Rolle im Gesamtprozess', beschreibung: 'Schnittstellen und Erwartungen', videoUrl: '', dauerMinuten: 5, reihenfolge: 2, abgeschlossen: false },
      { id: 'up-0-3', titel: 'Lernpfad & Prüfungen', beschreibung: 'Ablauf und Freigaben (Level-Modell)', videoUrl: '', dauerMinuten: 5, reihenfolge: 3, abgeschlossen: false },
    ],
  },
  // ... weitere 12 Module
];
```

### Datei: src/hooks/useOnboardingState.ts

Ändere Storage-Key:
```typescript
const STORAGE_KEY = 'thermocheck_onboarding_state_v2';
```

---

## Betroffene Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/onboarding-config.ts` | MOCK_AKADEMIE_HAUPTMODULE mit 13 Modulen ersetzen |
| `src/hooks/useOnboardingState.ts` | Storage-Key versionieren für Clean-State |

---

## Ergebnis

Nach der Implementierung:
- Akademie zeigt die korrekten 13 Module (Willkommen & Orientierung bis Prüfung & Zertifizierung)
- Jedes Modul zeigt die richtigen Lektionen
- Alter localStorage-State wird automatisch durch neuen ersetzt
