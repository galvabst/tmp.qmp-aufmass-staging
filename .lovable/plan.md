

# Akademie-Architektur Fix: Nummerierung und Hierarchie

## Probleme

1. **Nummerierung off-by-one**: Modul 0 ("Willkommen & Orientierung") wird als "1" angezeigt, dadurch verschiebt sich alles um 1. Modul 6 (Datenerhebung) zeigt als "7".
2. **Fehlende Code-basierte Nummerierung**: Das Frontend nutzt `hauptmodulIndex + 1` statt den tatsaechlichen `code` aus der Datenbank (z.B. `modul-6-datenerhebung` -> Nummer 6).
3. **Keine Hierarchie-Darstellung**: Lektionen wie 6-3-1 und 6-3-2 sind Unterpunkte von 6-3, werden aber flach neben den anderen angezeigt.

## Loesung

### Schritt 1: Typen erweitern

**Datei: `src/types/onboarding.ts`**

`AkademieHauptmodul` und `AkademieUnterpunkt` bekommen ein `code`-Feld:

```text
AkademieHauptmodul {
  ...
  code: string;        // z.B. "modul-6-datenerhebung"
  displayNummer: number; // Extrahiert: 6
}

AkademieUnterpunkt {
  ...
  code: string;        // z.B. "6-3-1"
}
```

### Schritt 2: Hook anpassen (useAkademieContent)

**Datei: `src/hooks/useAkademieContent.ts`**

- `code` aus der DB in die App-Typen durchreichen
- `displayNummer` aus dem Modul-Code extrahieren (z.B. `modul-6-datenerhebung` -> `6`)
- Modul 0 bekommt `displayNummer = 0`

### Schritt 3: Nummerierung im UI fixen

**Datei: `src/components/onboarding/steps/AcademyStep.tsx`**

Zeile 159: Statt `hauptmodulIndex + 1` den extrahierten `displayNummer`-Wert verwenden:

```text
Vorher:  hauptmodulIndex + 1
Nachher: hauptmodul.displayNummer
```

Dies loest das Off-by-one-Problem sofort -- Modul 0 zeigt "0", Modul 6 zeigt "6".

### Schritt 4: Sub-Lektionen visuell gruppieren (optional aber empfohlen)

Lektionen mit Code-Pattern `X-Y-Z` (z.B. 6-3-1, 6-3-2) werden als Unterpunkte der Parent-Lektion (6-3) erkannt und leicht eingerueckt dargestellt. Dies nutzt die bereits existierende `parent_lektion_id`-Spalte in der DB oder alternativ das Code-Pattern.

Konkret:
- Lektion 6-3 ("Dokumentationsstandard") wird zur Gruppen-Ueberschrift
- 6-3-1 und 6-3-2 werden darunter eingerueckt angezeigt
- Eine Gruppen-Lektion gilt als abgeschlossen wenn alle Kinder fertig sind

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `src/types/onboarding.ts` | `code` und `displayNummer` Felder hinzufuegen |
| `src/hooks/useAkademieContent.ts` | `code` durchreichen, `displayNummer` extrahieren |
| `src/components/onboarding/steps/AcademyStep.tsx` | Nummerierung auf `displayNummer` umstellen |
| `src/hooks/useOnboardingState.ts` | `code` in Hydration-Logik beruecksichtigen |

## Kein DB-Change noetig

Alle Daten (`code`, `reihenfolge`) sind bereits korrekt in der Datenbank. Es handelt sich rein um Frontend-Fixes.

## Risiken

- **Gering**: Reine UI-Aenderung, keine Daten-Migration
- **Hydration**: Der `useOnboardingState`-Hook muss das neue `code`-Feld beim Merge von DB-Daten und localStorage beruecksichtigen -- wird mitgemacht
- **Abschlusstest-Logik**: Modul 0 zaehlt weiterhin zum Gesamtfortschritt (alle Module muessen abgeschlossen werden) -- falls Modul 0 NICHT zum Test zaehlen soll, bitte Bescheid geben

